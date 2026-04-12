#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const mongo = require('../database/mongo');
const db = require('../database/db');
require('../database/models/trait');
const itemModel = require('../database/models/item');

function normalizeName(name) {
  return String(name || '').trim().toLowerCase();
}

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseArgs(argv) {
  const args = {
    file: 'scripts/items.bulk.json',
    snapshot: false,
    snapshotFile: ''
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--file' && argv[i + 1]) {
      args.file = argv[i + 1];
      i += 1;
    } else if (arg === '--snapshot-file' && argv[i + 1]) {
      args.snapshotFile = argv[i + 1];
      i += 1;
    } else if (arg === '--no-snapshot') {
      args.snapshot = false;
    } else if (arg === '--snapshot') {
      args.snapshot = true;
    }
  }

  return args;
}

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('Items file must contain a JSON array.');
  }
  return parsed;
}

function makeSnapshot(items) {
  return (items || []).map(it => ({
    name: it.name || '',
    type: toNumber(it.type, 0),
    description: it.description || '',
    gold: toNumber(it.gold, 0),
    range: it.range || '',
    strength: it.strength || '',
    slot: toNumber(it.slot, 0),
    traits: Array.isArray(it.traits)
      ? it.traits.map(t => (t && t._id ? String(t._id) : String(t))).filter(Boolean)
      : []
  }));
}

function sanitizeItem(raw) {
  const name = String(raw && raw.name ? raw.name : '').trim();
  if (!name) return { valid: false, reason: 'missing name' };

  const type = toNumber(raw.type, NaN);
  if (!Number.isFinite(type)) return { valid: false, reason: 'missing numeric type', name };

  const item = {
    name,
    type,
    description: raw.description ? String(raw.description) : '',
    gold: toNumber(raw.gold, 0),
    range: raw.range ? String(raw.range) : '',
    strength: raw.strength ? String(raw.strength) : '',
    slot: toNumber(raw.slot, 0)
  };

  if (Array.isArray(raw.traits)) {
    item.traits = raw.traits.filter(v => v !== null && v !== undefined && String(v).trim().length > 0);
  }

  return { valid: true, item };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(process.cwd(), args.file);

  await mongo.connect();

  const existing = await itemModel.findItems();
  const existingNames = new Set(existing.map(it => normalizeName(it.name)).filter(Boolean));

  if (args.snapshot) {
    const snapshotData = makeSnapshot(existing);
    const snapshotPath = path.resolve(
      process.cwd(),
      args.snapshotFile || args.file.replace(/\.json$/i, '.snapshot.json')
    );
    fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshotData, null, 2));
    console.log('[items:add] Wrote snapshot of existing items to:', snapshotPath);
  }

  const payload = readJsonArray(inputPath);
  if (!payload) {
    fs.mkdirSync(path.dirname(inputPath), { recursive: true });
    fs.writeFileSync(inputPath, JSON.stringify(makeSnapshot(existing), null, 2));
    console.log('[items:add] Created items file from existing DB items.');
    console.log('[items:add] Add new item objects to that file, then run this script again.');
    return;
  }

  let created = 0;
  let skippedExisting = 0;
  let skippedInvalid = 0;
  let skippedDuplicateInFile = 0;

  const seenInFile = new Set();

  for (const raw of payload) {
    const checked = sanitizeItem(raw || {});
    if (!checked.valid) {
      skippedInvalid += 1;
      continue;
    }

    const key = normalizeName(checked.item.name);
    if (!key) {
      skippedInvalid += 1;
      continue;
    }

    if (seenInFile.has(key)) {
      skippedDuplicateInFile += 1;
      continue;
    }
    seenInFile.add(key);

    if (existingNames.has(key)) {
      skippedExisting += 1;
      continue;
    }

    await itemModel.createItem(checked.item);
    existingNames.add(key);
    created += 1;
  }

  console.log('[items:add] Done.');
  console.log('[items:add] Created:', created);
  console.log('[items:add] Skipped (already exists by name):', skippedExisting);
  console.log('[items:add] Skipped (duplicate name in file):', skippedDuplicateInFile);
  console.log('[items:add] Skipped (invalid rows):', skippedInvalid);
}

main()
  .catch(err => {
    console.error('[items:add] Failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
      await db.close();
    } catch (err) {
      // ignore shutdown errors
    }
  });
