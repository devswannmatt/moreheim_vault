var router = require('express').Router();
const member  = require('../database/models/member');
const roster  = require('../database/models/roster');
const unit    = require('../database/models/unit');
const warband = require('../database/models/warband');
const item    = require('../database/models/item');
const event   = require('../database/models/event');
const trait   = require('../database/models/trait');
const auth    = require('../system/auth');

const calc = require('../js/calc');

function renderView(req, res, view, data) {
  return res.render(view, Object.assign({}, data, {
    isModal: req.query && (req.query.modal === '1' || req.query.modal === 'true'),
    layout: !(req.query && (req.query.modal === '1' || req.query.modal === 'true'))
  }));
}

function buildInventoryGroups(items) {
  const map = new Map();
  const groups = [];
  (items || []).forEach(it => {
    const id = String(it._id || it);
    if (map.has(id)) {
      map.get(id).qty++;
    } else {
      const entry = { item: it, qty: 1 };
      map.set(id, entry);
      groups.push(entry);
    }
  });
  return groups;
}

async function findUnitsForWarband(warbandId) {
  const allUnits = await unit.findUnits();
  if (!warbandId) return allUnits;

  const wb = await warband.getWarbandById(warbandId);
  if (!wb || !Array.isArray(wb.units) || wb.units.length === 0) return [];

  const allowedUnitIds = new Set(wb.units.map(u => String(u && u._id ? u._id : u)));
  return allUnits.filter(u => allowedUnitIds.has(String(u._id)));
}

function isOwnedByCurrentPlayer(req, playerId) {
  if (!auth.isAuthEnabledForRequest(req)) return true;
  return Boolean(req.currentPlayer && String(req.currentPlayer._id) === String(playerId));
}

function buildMemberItemEvent(action, itemName, goldAmount, qty) {
  const memberQty = qty || 1;
  const qtyNote = memberQty > 1 ? ` (member qty x${memberQty})` : '';

  switch (action) {
    case 'buy':
      return {
        name: `Bought ${itemName}`,
        description: `Purchased ${itemName} for ${goldAmount}g${qtyNote}.`,
        wealth: { gold: -goldAmount }
      };
    case 'sell':
      return {
        name: `Sold ${itemName}`,
        description: `Sold ${itemName} for ${goldAmount}g${qtyNote}.`,
        wealth: { gold: goldAmount }
      };
    case 'refund':
      return {
        name: `Refunded ${itemName}`,
        description: `Refunded ${itemName} for ${goldAmount}g${qtyNote}.`,
        wealth: { gold: goldAmount }
      };
    case 'deposit':
      return {
        name: `Deposited ${itemName}`,
        description: `Deposited ${itemName} into the roster stockpile.`,
        wealth: { gold: 0 }
      };
    case 'receive':
      return {
        name: `Received ${itemName}`,
        description: `Received ${itemName} from the roster stockpile.`,
        wealth: { gold: 0 }
      };
    default:
      return {
        name: `Item transaction: ${itemName}`,
        description: '',
        wealth: { gold: 0 }
      };
  }
}

function createMemberItemEvent(memberRecord, action, itemRecord, goldAmount = 0) {
  const itemEvent = buildMemberItemEvent(action, itemRecord.name, goldAmount, memberRecord.qty || 1);
  return event.createEvent({
    type: 4,
    entities: [{ id: memberRecord._id, kind: 'Member' }],
    name: itemEvent.name,
    description: itemEvent.description,
    wealth: itemEvent.wealth
  });
}

async function loadOwnedMember(req, res, memberId) {
  const ownedMember = await member.getMemberById(memberId);
  if (!ownedMember) {
    res.status(404).json({ error: 'Member not found' });
    return null;
  }
  const ownedRoster = await roster.getRosterById((ownedMember.roster && ownedMember.roster._id) ? ownedMember.roster._id : ownedMember.roster);
  if (!ownedRoster) {
    res.status(404).json({ error: 'Roster not found' });
    return null;
  }
  if (!isOwnedByCurrentPlayer(req, ownedRoster.player && ownedRoster.player._id ? ownedRoster.player._id : ownedRoster.player)) {
    res.status(403).json({ error: 'You can only modify members in your own rosters.' });
    return null;
  }
  return ownedMember;
}

async function loadOwnedRoster(req, res, rosterId) {
  const ownedRoster = await roster.getRosterById(rosterId);
  if (!ownedRoster) {
    res.status(404).json({ error: 'Roster not found' });
    return null;
  }
  if (!isOwnedByCurrentPlayer(req, ownedRoster.player && ownedRoster.player._id ? ownedRoster.player._id : ownedRoster.player)) {
    res.status(403).json({ error: 'You can only modify your own rosters.' });
    return null;
  }
  return ownedRoster;
}

router.get('/', async (req, res) => {
  console.log("Rendering members view");
  try {
    const members = await member.findMembers();
    members.forEach(m => { m.wealth = calc.wealth([m], m.items); });

    res.render('members', { members: members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/member/create', async (req, res) => {
  console.log("Rendering create member view");
  const rosters  = await roster.findRosters();
  const warbands = await warband.findWarbands();
  const units = [];

  rosters.map(r => {
    r.selected = (req.query.roster && req.query.roster === r._id.toString()) ? true : false;
  });

  warbands.map(wb => {
    wb.selected = (req.query.warband && req.query.warband === wb._id.toString()) ? true : false;
  });

  try {
    renderView(req, res, 'member_create', { rosters: rosters, units: units, warbands: warbands });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/unit-options', async (req, res) => {
  try {
    const units = await findUnitsForWarband(req.query.warband);
    const rosterId = req.query.roster;
    let unitCounts = new Map();

    if (rosterId) {
      const rosterMembers = await member.findMembers({ roster: rosterId });
      unitCounts = new Map(
        (rosterMembers || []).reduce((acc, m) => {
          const unitId = String(m.unit && m.unit._id ? m.unit._id : m.unit || '');
          if (!unitId) return acc;
          const prev = acc.get(unitId) || 0;
          acc.set(unitId, prev + (m.qty || 1));
          return acc;
        }, new Map())
      );
    }

    const options = units.map(u => ({
      _id: u._id,
      name: u.name,
      type: u.type,
      gold: u.gold,
      maxCount: u.maxCount,
      currentCount: unitCounts.get(String(u._id)) || 0
    }));

    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/member/:id', async (req, res) => {
  console.log(`Fetching member with ID: ${req.params.id}`);
  try {
    var result  = await member.getMemberById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Member not found' });

    const rosters = await roster.findRosters();
    const units   = await unit.findUnits();
    const events  = await event.findEvents({ 'entities.id': result._id });

    result.expLevels = await calc.buildExpLevels(result.unit, calc.calcCurrentExp((result.unit.experience + result.experience), events));
    result.wealth    = await calc.wealth([result], result.items);
    result           = await calc.checkEvents(result, events);
    result.unit.sv   = calc.calcSave(result.items);

    events.forEach(ev => {
      if (ev.injury) ev.details = calc.fetchInjuries(ev.injury);
    });

    var injuries = events.filter(ev => ev.type === 2);
    
    const memberRosterId = (result.roster && result.roster._id) ? result.roster._id : result.roster;
    const memberRoster = await roster.getRosterById(memberRosterId);
    const canEdit = isOwnedByCurrentPlayer(req, memberRoster && memberRoster.player && memberRoster.player._id ? memberRoster.player._id : memberRoster?.player);

    renderView(req, res, 'member', { member: result, rosters: rosters, units: units, events: events, injuries: injuries, canEdit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/member/:id', auth.requireAuthenticated, async (req, res) => {
  console.log(`Updating /member/:id with ID: ${req.params.id} with data:`, req.body);
  try {
    const ownedMember = await loadOwnedMember(req, res, req.params.id);
    if (!ownedMember) return;
    member.updateMember(req.params.id, req.body).then(updatedMember => {
      if (!updatedMember) return res.status(404).json({ error: 'Member not found' });
      res.status(200).json(updatedMember);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/member/:id/status', auth.requireAuthenticated, async (req, res) => {
  console.log(`Updating member status with ID: ${req.params.id} with data:`, req.body);
  console.log('Status from query:', req.query.status);
  try {
    const ownedMember = await loadOwnedMember(req, res, req.params.id);
    if (!ownedMember) return;
    if (!req.query.status && req.query.status !== 0) return res.status(400).json({ error: 'Status is required' });
    if (req.query.status) req.body.status = parseInt(req.query.status);
    req.body = { status: req.body.status };
    member.updateMember(req.params.id, req.body).then(updatedMember => {
      if (!updatedMember) return res.status(404).json({ error: 'Member not found' });
      res.status(200).json(updatedMember);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/member/:id/item', auth.requireAuthenticated, async (req, res) => {
  console.log(`Item action Member with ID: ${req.params.id} with data:`, req.query);
  try {
    if (!req.query.action) return res.status(400).json({ error: 'Action is required' });
    if (!req.query.item)   return res.status(400).json({ error: 'Item ID is required' });

    const m = await loadOwnedMember(req, res, req.params.id);
    if (!m) return res.status(404).json({ error: 'Member not found' });

    let updatedItems = (m.items || []).map(i => String(i._id || i));
    const itemIndex = updatedItems.indexOf(String(req.query.item));

    if (req.query.action === 'sell' || req.query.action === 'use' || req.query.action === 'refund') {
      const i = await item.getItemById(req.query.item);
      if (!i) return res.status(404).json({ error: 'Item not found' });
      if (itemIndex === -1) return res.status(400).json({ error: 'Member does not possess this item' });

      updatedItems.splice(itemIndex, 1);
      const updatedMember = await member.updateMember(req.params.id, { items: updatedItems });
      if (!updatedMember) return res.status(404).json({ error: 'Member not found' });

      let goldEarned = 0;
      if (req.query.action === 'sell')   goldEarned = Math.floor((i.gold || 0) / 2) * (m.qty || 1);
      if (req.query.action === 'refund') goldEarned = (i.gold || 0) * (m.qty || 1);

      if (goldEarned) await rosterAdjustGold(m.roster, goldEarned);
      if (req.query.action === 'sell') {
        await createMemberItemEvent(m, 'sell', i, goldEarned);
      }
      if (req.query.action === 'refund') {
        await createMemberItemEvent(m, 'refund', i, goldEarned);
      }
      return res.status(200).json({ member: updatedMember, goldEarned });
    }

    if (req.query.action === 'stash') {
      const i = await item.getItemById(req.query.item);
      if (!i) return res.status(404).json({ error: 'Item not found' });
      if (itemIndex === -1) return res.status(400).json({ error: 'Member does not possess this item' });
      updatedItems.splice(itemIndex, 1);
      const updatedMember = await member.updateMember(req.params.id, { items: updatedItems });
      if (!updatedMember) return res.status(404).json({ error: 'Member not found' });

      const rosterId = (m.roster && m.roster._id) ? m.roster._id : m.roster;
      const r = await roster.getRosterById(rosterId);
      if (!r) return res.status(404).json({ error: 'Roster not found' });
      const rosterItems = (r.items || []).map(i => String(i._id || i));
      await roster.updateRoster(String(rosterId), { items: [...rosterItems, String(req.query.item)] });
      await createMemberItemEvent(m, 'deposit', i);
      return res.status(200).json({ success: true });
    }

    res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/member/:id/event/levelup', async (req, res) => {
  console.log(`Fetching member event level up with ID: ${req.params.id}`);
  try {
    const result = await member.getMemberById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Member not found' });

    if (result.unit.type !== 1 && result.unit.type !== 2) {
      return res.status(400).json({ error: 'Level Up events are only applicable to Heroes and Henchmen.' });
    }

    const allowedSkillTypes = Array.isArray(result.unit && result.unit.skillAccess)
      ? result.unit.skillAccess
          .map(v => parseInt(v, 10))
          .filter(v => !Number.isNaN(v) && v >= 4 && v <= 9)
      : [];

    const skillTypeLabels = {
      4: 'Skill: Combat',
      5: 'Skill: Shooting',
      6: 'Skill: Academic',
      7: 'Skill: Strength',
      8: 'Skill: Speed',
      9: 'Skill: Special'
    };

    const traits = await trait.findTraits({ type: { $in: allowedSkillTypes } });
    const skillList = (traits || []).map(t => ({
      _id: t._id,
      name: t.name,
      type: t.type,
      typeLabel: skillTypeLabels[Number(t.type)] || 'Skill'
    }));
    var advanceTypes = calc.advanceTypes[result.unit.type];

    renderView(req, res, 'event_level_up', { member: result, level: req.query.level, eventTypes: calc.fetchEventTypes(1), query: req.query, advanceTypes: advanceTypes, skillList: skillList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/member/:id/event/gainresource', async (req, res) => {
  console.log(`Fetching member event gain resource with ID: ${req.params.id}`);
  try {
    const result = await member.getMemberById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Member not found' });

    renderView(req, res, 'event_gain_resource', { member: result, eventTypes: calc.fetchEventTypes(3), query: req.query });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/member/:id/event/injury', async (req, res) => {
  console.log(`Fetching member event injury with ID: ${req.params.id}`);
  try {
    const result = await member.getMemberById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Member not found' });

    renderView(req, res, 'event_injury', { member: result, eventTypes: calc.fetchEventTypes(2), injuries: calc.fetchInjuries(), query: req.query });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/member/:id/inventory', async (req, res) => {
  console.log(`Fetching member with ID: ${req.params.id}`);
  try {
    const result = await member.getMemberById(req.params.id);
    const items  = await item.findItems();

    if (!result) return res.status(404).json({ error: 'Member not found' });

    const inventoryGroups = buildInventoryGroups(result.items);
    renderView(req, res, 'member_inventory', { member: result, items: items, inventoryGroups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/member/:id/inventory', auth.requireAuthenticated, async (req, res) => {
  console.log(`Updating member Inventory with ID: ${req.params.id} with data:`, req.body);
  try {
    const m = await loadOwnedMember(req, res, req.params.id);
    if (!m) return res.status(404).json({ error: 'Member not found' });

    let itemsToAdd = req.body.items || [];
    if (!Array.isArray(itemsToAdd)) itemsToAdd = [itemsToAdd];
    itemsToAdd = itemsToAdd.filter(v => v !== undefined && v !== null && String(v).length > 0);

    if (itemsToAdd.length === 0) return res.status(400).json({ error: 'No items submitted.' });

    let itemCost = 0;
    const rosterId = (m.roster && m.roster._id) ? m.roster._id : m.roster;

    await Promise.all(itemsToAdd.map(id =>
      item.getItemById(id).then(i => {
        if (!i) throw new Error('Invalid item ID provided.');
        itemCost += (i.gold || 0) * (m.qty || 1);
      })
    ));

    const r = await roster.getRosterById(rosterId);
    if (!r) return res.status(404).json({ error: 'Roster not found.' });
    if (r.gold < itemCost) return res.status(400).json({ error: 'Insufficient gold in roster to purchase these items.' });

    const oldItems = (m.items || []).map(i => String(i._id || i));
    const updatedMember = await member.updateMember(req.params.id, { items: [...oldItems, ...itemsToAdd] });
    if (!updatedMember) return res.status(404).json({ error: 'Member not found' });

    await rosterAdjustGold(rosterId, -itemCost);
    await Promise.all(itemsToAdd.map(async id => {
      const purchasedItem = await item.getItemById(id);
      if (!purchasedItem) return;
      const purchaseCost = (purchasedItem.gold || 0) * (m.qty || 1);
      return createMemberItemEvent(m, 'buy', purchasedItem, purchaseCost);
    }));

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/json', async (req, res) => {
  console.log("Fetching members in JSON format");
  try {
    const items = await member.findMembers();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message, info: "Error fetching members" });
  }
});

router.post('/create', auth.requireAuthenticated, async (req, res) => {
  try {
    loadOwnedRoster(req, res, req.body.roster).then(r => {
      if (!r) return;
      console.log('Roster fetched for member creation:', r);
      unit.getUnitById(req.body.unit).then(u => {
        console.log('Unit fetched for member creation:', u);
        const requestedQty = Math.max(1, parseInt(req.body.qty, 10) || 1);

        member.findMembers({ roster: req.body.roster }).then(existingMembers => {
          const sameUnitMembers = existingMembers.filter(m => String(m.unit && m.unit._id ? m.unit._id : m.unit) === String(req.body.unit));

          if (u.isUnique && sameUnitMembers.length > 0) {
            return res.status(400).json({ error: `This unit is unique for the warband and can only be purchased once: ${u.name}.` });
          }

          if (u.maxCount > 0) {
            const activeUnitCount = sameUnitMembers
              .filter(m => m.status !== 2 && m.status !== 3)
              .reduce((sum, m) => sum + (parseInt(m.qty, 10) || 1), 0);
            if ((activeUnitCount + requestedQty) > u.maxCount) {
              return res.status(400).json({ error: `Unit limit reached for ${u.name}. Max allowed in this warband is ${u.maxCount}.` });
            }
          }

        req.body.qty = requestedQty;
        var owedGold = (u.gold * requestedQty || 0);
        if (r.gold < owedGold) return res.status(400).json({ error: 'Insufficient gold in roster to create this member.' });

        member.createMember(req.body).then(result => {
          rosterAdjustGold(req.body.roster, -(owedGold || 0)).then(() => {
            const memberUrl = `/members/member/${result}`;
            const accept = String(req.headers.accept || '').toLowerCase();
            if (req.xhr || accept.includes('application/json')) {
              return res.status(201).json({ success: true, redirect: memberUrl });
            }
            res.status(201).redirect(memberUrl);
          }).catch(err => {
            res.status(500).json({ error: err.message });
          });
        }).catch(err => {
          res.status(500).json({ error: err.message });
        });
        }).catch(err => {
          res.status(500).json({ error: err.message });
        });
      });
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function rosterAdjustGold(rosterId, amount) {
  const id = (rosterId && rosterId._id) ? rosterId._id : rosterId;
  if (!amount) return Promise.reject(new Error('Amount to adjust gold by is required'));
  return roster.getRosterById(id).then(r => {
    if (!r) return Promise.reject(new Error('Roster not found'));
    let newGold = (r.gold || 0) + amount;
    return roster.updateRoster(id, { gold: newGold });
  });
}

router.delete('/member/:id', auth.requireAuthenticated, async (req, res) => {
  console.log(`Deleting member with ID: ${req.params.id}`);
  try {
    const ownedMember = await loadOwnedMember(req, res, req.params.id);
    if (!ownedMember) return;
    const result = await member.deleteMember(req.params.id);
    if (!result) return res.status(404).json({ error: 'Member not found' });
    res.status(200).json({ message: 'Member deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/reorder', auth.requireAuthenticated, async (req, res) => {
  // Expects body: [{ id: "...", order: 0 }, ...]
  try {
    const items = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Expected a non-empty array of { id, order } objects' });
    }
    for (const { id } of items) {
      const ownedMember = await loadOwnedMember(req, res, id);
      if (!ownedMember) return;
    }
    await Promise.all(items.map(({ id, order }) => member.updateMember(id, { order })));
    res.status(200).json({ message: 'Order saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/member/:id/make-leader', auth.requireAuthenticated, async (req, res) => {
  try {
    const targetMember = await loadOwnedMember(req, res, req.params.id);
    if (!targetMember) return res.status(404).json({ error: 'Member not found' });
    if (!targetMember.unit || targetMember.unit.type !== 1) {
      return res.status(400).json({ error: 'Only Heroes can be promoted to Leader.' });
    }
    if (targetMember.isLeader === true) {
      return res.status(400).json({ error: 'This member is already the Leader.' });
    }

    const rosterId = (targetMember.roster && targetMember.roster._id)
      ? targetMember.roster._id
      : targetMember.roster;
    const rosterMembers = await member.findMembers({ roster: rosterId });

    const existingLeader = rosterMembers.find(m => (
      String(m._id) !== String(targetMember._id)
      && m.isLeader === true
      && m.status !== 2
      && m.status !== 3
    ));

    if (existingLeader) {
      return res.status(400).json({ error: 'This warband already has a Leader. The current Leader must be retired or killed first.' });
    }

    await member.updateMember(targetMember._id, { isLeader: true });

    await event.createEvent({
      type: 5,
      entities: [{ id: targetMember._id, kind: 'Member' }],
      name: 'Promoted to Leader',
      description: `${targetMember.name} is now the Leader of ${targetMember.roster.name}.`
    });

    res.status(200).json({ message: 'Leader assigned successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;