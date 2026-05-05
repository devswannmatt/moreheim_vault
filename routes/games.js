var router = require('express').Router();
const game = require('../database/models/game');
const roster = require('../database/models/roster');
const campaign = require('../database/models/campaign');
const event = require('../database/models/event');
const item = require('../database/models/item');
const member = require('../database/models/member');
const auth = require('../system/auth');
const calc = require('../js/calc');

function normalizeIdArray(input) {
  if (!input) return [];
  const list = Array.isArray(input) ? input : [input];
  return list
    .map(function (value) { return String(value || '').trim(); })
    .filter(function (value) { return value.length > 0; });
}

function toObjectIdStrings(input) {
  if (!input) return [];
  const list = Array.isArray(input) ? input : [input];
  return list
    .map(function (value) {
      if (!value) return '';
      return String(value && value._id ? value._id : value).trim();
    })
    .filter(function (value) { return value.length > 0; });
}

function isOwnedByCurrentPlayer(req, playerId) {
  return auth.canManagePlayer(req, playerId);
}

async function loadOwnedGame(req, res, gameId) {
  const ownedGame = await game.getGameById(gameId);
  if (!ownedGame) {
    res.status(404).json({ error: 'Game not found' });
    return null;
  }

  if (!auth.isAuthEnabledForRequest(req)) return ownedGame;
  if (!req.currentPlayer) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  const rosters = Array.isArray(ownedGame.rosters) ? ownedGame.rosters : [];
  const canEdit = rosters.some(function (entry) {
    const playerId = entry && entry.player && entry.player._id ? entry.player._id : entry && entry.player;
    return isOwnedByCurrentPlayer(req, playerId);
  });

  if (!canEdit) {
    res.status(403).json({ error: 'You can only modify games that include one of your rosters.' });
    return null;
  }

  return ownedGame;
}

function normalizeGamePayload(body = {}) {
  const selectedRosters = body.rosters || body['rosters[]'];
  const rosters = selectedRosters
    ? (Array.isArray(selectedRosters) ? selectedRosters : [selectedRosters])
        .filter(function (value) { return value !== undefined && value !== null && String(value).trim().length > 0; })
    : [];

  const selectedCampaign = body.campaign !== undefined ? String(body.campaign).trim() : '';

  return {
    name: body.name || 'Untitled Game',
    description: body.description || '',
    campaign: selectedCampaign || null,
    rosters: rosters
  };
}

function summarizeRollMatches(rollValues) {
  if (!rollValues) return '';
  const values = String(rollValues)
    .split(',')
    .map(function (part) { return parseInt(String(part).trim(), 10); })
    .filter(function (num) { return !Number.isNaN(num) && num >= 1 && num <= 6; });

  if (!values.length) return '';

  const counts = new Map();
  values.forEach(function (value) {
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  const labels = [];
  Array.from(counts.keys()).sort(function (a, b) { return a - b; }).forEach(function (face) {
    const count = counts.get(face);
    if (count < 2) return;
    if (count === 2) labels.push('Pair of ' + face);
    else if (count === 3) labels.push('Triple ' + face);
    else if (count === 4) labels.push('Quad ' + face);
    else if (count === 5) labels.push('Five of a kind (' + face + ')');
    else if (count === 6) labels.push('Six of a kind (' + face + ')');
    else labels.push(count + 'x ' + face);
  });

  return labels.join(', ');
}

const EXPLORATION_SPECIAL_TITLES = {
  2: { 1: 'Well', 2: 'Shop', 3: 'Corpse', 4: 'Straggler', 5: 'Overturned Cart', 6: 'Ruined Hovels' },
  3: { 1: 'Tavern', 2: 'Smithy', 3: 'Prisoners', 4: 'Fletcher', 5: 'Market Hall', 6: 'Returning a Favour' },
  4: { 1: 'Gunsmith', 2: 'Shrine', 3: 'Townhouse', 4: 'Armourer', 5: 'Graveyard', 6: 'Catacombs' },
  5: { 1: 'Moneylender\'s House', 2: 'Alchemist\'s Laboratory', 3: 'Jewelsmith', 4: 'Merchant\'s House', 5: 'Shattered Building', 6: 'Entrance to the Catacombs' },
  6: { 1: 'The Pit', 2: 'Hidden Treasure', 3: 'Dwarf Smithy', 4: 'Slaughtered Warband', 5: 'Fighting Arena', 6: 'Noble\'s Villa' }
};

function getMatchLabel(count, face) {
  if (count === 2) return 'Pair of ' + face;
  if (count === 3) return 'Triple ' + face;
  if (count === 4) return 'Four of a kind (' + face + ')';
  if (count === 5) return 'Five of a kind (' + face + ')';
  return 'Six of a kind (' + face + ')';
}

function summarizeExplorationSpecials(rollValues) {
  if (!rollValues) return '';

  const values = String(rollValues)
    .split(',')
    .map(function (part) { return parseInt(String(part).trim(), 10); })
    .filter(function (num) { return !Number.isNaN(num) && num >= 1 && num <= 6; });

  if (!values.length) return '';

  const counts = new Map();
  values.forEach(function (value) {
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  const outcomes = [];
  Array.from(counts.keys()).sort(function (a, b) { return a - b; }).forEach(function (face) {
    const count = counts.get(face);
    if (count < 2) return;

    const chartCount = Math.min(count, 6);
    const title = EXPLORATION_SPECIAL_TITLES[chartCount] && EXPLORATION_SPECIAL_TITLES[chartCount][face];
    if (!title) return;

    outcomes.push(getMatchLabel(chartCount, face) + ': ' + title);
  });

  return outcomes.join('; ');
}

function calcWyrdstoneFromExplorationTotal(total) {
  if (total >= 36) return 7;
  if (total >= 31) return 6;
  if (total >= 25) return 5;
  if (total >= 18) return 4;
  if (total >= 12) return 3;
  if (total >= 6) return 2;
  if (total >= 1) return 1;
  return 0;
}

function normalizeItemLookupName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function singularizeItemLookupName(value) {
  const text = normalizeItemLookupName(value);
  if (!text) return '';

  if (/\bbows$/.test(text)) return text.replace(/bows$/, 'bow');
  if (/\bcrossbows$/.test(text)) return text.replace(/crossbows$/, 'crossbow');
  if (/\bhalberds$/.test(text)) return text.replace(/halberds$/, 'halberd');
  if (/\bhandguns$/.test(text)) return text.replace(/handguns$/, 'handgun');
  if (/\bshields$/.test(text)) return text.replace(/shields$/, 'shield');
  if (/\bhelmets$/.test(text)) return text.replace(/helmets$/, 'helmet');
  if (/\bflasks$/.test(text)) return text.replace(/flasks$/, 'flask');
  if (/\bies$/.test(text)) return text.replace(/ies$/, 'y');
  if (/\bs$/.test(text)) return text.replace(/s$/, '');
  return text;
}

function parseExplorationItemsCsv(csv) {
  if (!csv) return [];

  return String(csv)
    .split(',')
    .map(function (rawPart) {
      const part = String(rawPart || '').trim();
      if (!part) return null;

      const qtyMatch = part.match(/^(\d+)\s*x\s*(.+)$/i);
      const qty = qtyMatch ? Math.max(1, parseInt(qtyMatch[1], 10) || 1) : 1;
      const name = qtyMatch ? String(qtyMatch[2] || '').trim() : part;
      if (!name) return null;

      return { qty, name };
    })
    .filter(Boolean);
}

function resolveItemIdByName(name, normalizedNameMap) {
  const direct = normalizeItemLookupName(name);
  const singular = singularizeItemLookupName(name);
  const candidates = [direct, singular].filter(function (value, idx, arr) {
    return value && arr.indexOf(value) === idx;
  });

  for (let i = 0; i < candidates.length; i++) {
    const match = normalizedNameMap.get(candidates[i]);
    if (match && match._id) return String(match._id);
  }

  return '';
}

router.get('/', async (req, res) => {
  try {
    const games = await game.findGames({}, { sort: { createdAt: -1 } });
    const rosters = await roster.findRosters({}, { sort: { name: 1 } });
    const campaigns = await campaign.findCampaigns({}, { sort: { name: 1 } });
    res.render('games', { games, rosterList: rosters, campaignList: campaigns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/game/:id', async (req, res) => {
  try {
    const gameItem = await game.getGameById(req.params.id);
    if (!gameItem) return res.status(404).json({ error: 'Game not found' });

    const rosters = await roster.findRosters({}, { sort: { name: 1 } });
    const campaigns = await campaign.findCampaigns({}, { sort: { name: 1 } });
    const gameEvents = await event.findEvents({ 'entities.id': gameItem._id }, { sort: { createdAt: -1 } });
    const injuredMemberIdsInGame = new Set(
      (gameEvents || [])
        .filter(function (ev) { return Number(ev.type) === 2; })
        .map(function (ev) {
          var memberEntity = Array.isArray(ev.entities)
            ? ev.entities.find(function (entity) { return entity && entity.kind === 'Member'; })
            : null;
          var memberValue = memberEntity && memberEntity.id;
          return memberValue && memberValue._id ? String(memberValue._id) : (memberValue ? String(memberValue) : '');
        })
        .filter(function (id) { return id.length > 0; })
    );
    const gameRosterIds = (gameItem.rosters || []).map(function (entry) {
      return String(entry && entry._id ? entry._id : entry);
    });
    const gameMembers = gameRosterIds.length
      ? await member.findMembers({ roster: { $in: gameRosterIds } })
      : [];
    const heroCountByRoster = new Map();
    const explorationRosterMembers = {};
    gameMembers.forEach(function (entry) {
      var rosterId = String(entry && entry.roster && entry.roster._id ? entry.roster._id : entry && entry.roster);
      if (!rosterId) return;
      if (!entry.unit || Number(entry.unit.type) !== 1) return;
      if (Number(entry.status) === 2 || Number(entry.status) === 3) return;
      if (injuredMemberIdsInGame.has(String(entry._id))) return;

      if (!Array.isArray(explorationRosterMembers[rosterId])) explorationRosterMembers[rosterId] = [];
      explorationRosterMembers[rosterId].push({
        _id: entry._id,
        name: entry.name || (entry.unit && entry.unit.name) || 'Hero',
        stats: {
          ws: Number(entry.unit.ws) || 0,
          bs: Number(entry.unit.bs) || 0,
          s: Number(entry.unit.s) || 0,
          t: Number(entry.unit.t) || 0,
          w: Number(entry.unit.w) || 0,
          i: Number(entry.unit.i) || 0,
          a: Number(entry.unit.a) || 0,
          ld: Number(entry.unit.ld) || 0,
          m: Number(entry.unit.m) || 0
        }
      });

      var qty = Number(entry.qty) || 1;
      heroCountByRoster.set(rosterId, (heroCountByRoster.get(rosterId) || 0) + Math.max(0, qty));
    });
    (gameItem.rosters || []).forEach(function (entry) {
      entry.heroCount = heroCountByRoster.get(String(entry && entry._id ? entry._id : entry)) || 0;
    });

    const injuryMembersRaw = gameRosterIds.length
      ? await member.findMembers({ roster: { $in: gameRosterIds } }, { sort: { name: 1 } })
      : [];
    const injuryMembers = (injuryMembersRaw || []).filter(function (m) {
      if (!auth.isAuthEnabledForRequest(req)) return true;
      if (!req.currentPlayer) return false;
      const playerId = m && m.roster && m.roster.player ? m.roster.player : null;
      return isOwnedByCurrentPlayer(req, playerId);
    }).map(function (m) {
      return {
        _id: m._id,
        name: m.name || (m.unit && m.unit.name) || 'Member',
        rosterId: m.roster && m.roster._id ? m.roster._id : m.roster,
        unitType: m.unit && m.unit.type ? Number(m.unit.type) : 0,
        rosterName: m.roster && m.roster.name ? m.roster.name : 'Roster'
      };
    });
    const injuryMap = calc.fetchInjuries();
    const injuryOptions = Object.keys(injuryMap).map(function (key) {
      const value = injuryMap[key];
      return {
        id: Number(key),
        label: value.label,
        roll: value.value
      };
    });

    const rosterNameById = new Map((gameItem.rosters || []).map(function (entry) {
      return [String(entry._id), entry.name || 'Roster'];
    }));
    const canEdit = !auth.isAuthEnabledForRequest(req)
      || (req.currentPlayer && (gameItem.rosters || []).some(function (entry) {
        const playerId = entry && entry.player && entry.player._id ? entry.player._id : entry && entry.player;
        return String(req.currentPlayer._id) === String(playerId);
      }));

    gameEvents.forEach(function (gameEvent) {
      if (!auth.isAuthEnabledForRequest(req)) {
        gameEvent.canDelete = true;
        return;
      }

      if (!req.currentPlayer) {
        gameEvent.canDelete = false;
        return;
      }

      const rosterEntities = (gameEvent.entities || []).filter(function (entity) {
        return entity && entity.kind === 'Roster';
      });
      if (!rosterEntities.length) {
        gameEvent.canDelete = false;
        return;
      }

      gameEvent.canDelete = rosterEntities.some(function (entity) {
        if (!entity.id) return false;
        const rosterPlayerId = entity.id && entity.id.player && entity.id.player._id
          ? entity.id.player._id
          : entity.id.player;
        return String(req.currentPlayer._id) === String(rosterPlayerId);
      });
    });

    gameEvents.forEach(function (gameEvent) {
      if (Number(gameEvent.type) !== 7 || !gameEvent.result) return;
      if (gameEvent.result.draw) {
        gameEvent.resultSummary = 'Draw';
        return;
      }

      var winners = normalizeIdArray(gameEvent.result.winners).map(function (id) {
        return rosterNameById.get(String(id)) || 'Unknown Roster';
      });
      var losers = normalizeIdArray(gameEvent.result.losers).map(function (id) {
        return rosterNameById.get(String(id)) || 'Unknown Roster';
      });

      gameEvent.resultSummary = 'Winners: ' + (winners.length ? winners.join(', ') : '-')
        + ' | Losers: ' + (losers.length ? losers.join(', ') : '-');
    });

    const gameResultEvent = gameEvents.find(function (e) { return Number(e.type) === 7; }) || null;
    const gameResultWinnerIds = gameResultEvent && gameResultEvent.result && !gameResultEvent.result.draw
      ? normalizeIdArray(gameResultEvent.result.winners)
      : [];
    const gameResultLoserIds = gameResultEvent && gameResultEvent.result && !gameResultEvent.result.draw
      ? normalizeIdArray(gameResultEvent.result.losers)
      : [];
    const gameResultDraw = !!(gameResultEvent && gameResultEvent.result && gameResultEvent.result.draw);
    const gameResultData = { hasResult: !!gameResultEvent, draw: gameResultDraw, winnerIds: gameResultWinnerIds, loserIds: gameResultLoserIds };

    res.render('game', { game: gameItem, rosterList: rosters, campaignList: campaigns, gameEvents, canEdit, explorationRosterMembers, gameResultEvent, gameResultWinnerIds, gameResultLoserIds, gameResultDraw, gameResultData, injuryMembers, injuryOptions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/game/:id', async (req, res) => {
  try {
    const patch = normalizeGamePayload(req.body || {});
    const updatedGame = await game.updateGame(req.params.id, patch);
    if (!updatedGame) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.status(200).json(updatedGame);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/game/:id', async (req, res) => {
  try {
    const deletedGame = await game.deleteGame(req.params.id);
    if (!deletedGame) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/json', async (req, res) => {
  try {
    const games = await game.findGames({}, { sort: { createdAt: -1 } });
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/create', async (req, res) => {
  try {
    const payload = normalizeGamePayload(req.body || {});
    const result = await game.createGame(payload);
    res.status(201).redirect(`/games/game/${result}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/game/:id/event/exploration', auth.requireAuthenticated, async (req, res) => {
  try {
    const ownedGame = await loadOwnedGame(req, res, req.params.id);
    if (!ownedGame) return;

    const rosterId = req.body && req.body.roster ? String(req.body.roster).trim() : '';
    const gold = parseInt(req.body && req.body['rewards.gold'], 10);
    const submittedWyrdstone = parseInt(req.body && req.body['rewards.wyrdstone'], 10);
    const notes = req.body && req.body.description ? String(req.body.description).trim() : '';
    const heroDice = parseInt(req.body && req.body['exploration.heroDice'], 10);
    const winBonus = req.body && (req.body['exploration.winBonus'] === '1' || req.body['exploration.winBonus'] === 'true');
    const rollValues = req.body && req.body['exploration.rolls'] ? String(req.body['exploration.rolls']).trim() : '';
    const rollTotal = parseInt(req.body && req.body['exploration.total'], 10);
    const totalDice = parseInt(req.body && req.body['exploration.totalDice'], 10);
    const matchSummary = summarizeRollMatches(rollValues);
    const specialSummary = summarizeExplorationSpecials(rollValues);
    const autoWyrdstone = Number.isNaN(rollTotal) ? 0 : calcWyrdstoneFromExplorationTotal(Math.max(0, rollTotal));
    const selectedItemsCsv = req.body && req.body['exploration.items']
      ? String(req.body['exploration.items']).trim()
      : '';

    if (!rosterId) {
      return res.status(400).json({ error: 'Exploration events require a roster.' });
    }

    const targetRoster = (ownedGame.rosters || []).find(function (entry) {
      return String(entry && entry._id ? entry._id : entry) === rosterId;
    });
    if (!targetRoster) {
      return res.status(400).json({ error: 'Selected roster must belong to this game.' });
    }

    const targetRosterPlayerId = targetRoster && targetRoster.player && targetRoster.player._id
      ? targetRoster.player._id
      : targetRoster && targetRoster.player;
    if (!isOwnedByCurrentPlayer(req, targetRosterPlayerId)) {
      return res.status(403).json({ error: 'You can only create exploration events for your own rosters.' });
    }

    const rewards = {
      gold: Number.isNaN(gold) ? 0 : Math.max(0, gold),
      wyrdstone: Number.isNaN(submittedWyrdstone)
        ? autoWyrdstone
        : Math.max(autoWyrdstone, Math.max(0, submittedWyrdstone))
    };
    const parsedExplorationItems = parseExplorationItemsCsv(selectedItemsCsv);

    if (rewards.gold === 0 && rewards.wyrdstone === 0) {
      return res.status(400).json({ error: 'Exploration events require at least one reward.' });
    }

    const rosterPatch = {};
    if (rewards.gold > 0) {
      rosterPatch.gold = (targetRoster.gold || 0) + rewards.gold;
    }

    if (rewards.wyrdstone > 0) {
      const wyrdstoneOptions = await item.findItems({ name: { $regex: /wyrdstone/i } }, { sort: { gold: 1, name: 1 } });
      if (!wyrdstoneOptions || wyrdstoneOptions.length === 0) {
        return res.status(400).json({ error: 'Unable to add Wyrdstone because no Wyrdstone item exists.' });
      }

      const wyrdstoneItem = wyrdstoneOptions[0];
      const currentItems = (targetRoster.items || []).map(function (entry) {
        return String(entry && entry._id ? entry._id : entry);
      });
      const itemsToAdd = Array.from({ length: rewards.wyrdstone }, function () {
        return String(wyrdstoneItem._id);
      });
      rosterPatch.items = currentItems.concat(itemsToAdd);
    }

    if (parsedExplorationItems.length) {
      const allItems = await item.findItems({}, { sort: { name: 1 } });
      const normalizedNameMap = new Map();
      (allItems || []).forEach(function (entry) {
        const key = normalizeItemLookupName(entry && entry.name ? entry.name : '');
        if (!key || normalizedNameMap.has(key)) return;
        normalizedNameMap.set(key, entry);
      });

      const currentItems = Array.isArray(rosterPatch.items)
        ? rosterPatch.items.slice()
        : (targetRoster.items || []).map(function (entry) {
            return String(entry && entry._id ? entry._id : entry);
          });

      parsedExplorationItems.forEach(function (entry) {
        const itemId = resolveItemIdByName(entry.name, normalizedNameMap);
        if (!itemId) return;

        for (let idx = 0; idx < entry.qty; idx++) {
          currentItems.push(itemId);
        }
      });

      rosterPatch.items = currentItems;
    }

    await roster.updateRoster(rosterId, rosterPatch);

    var explorationParts = [];
    if (!Number.isNaN(heroDice) && heroDice >= 0) explorationParts.push('Heroes: ' + heroDice);
    if (winBonus) explorationParts.push('Win bonus: +1 die');
    if (!Number.isNaN(totalDice) && totalDice > 0) explorationParts.push('Dice: ' + totalDice);
    if (rollValues) explorationParts.push('Rolls: ' + rollValues);
    if (matchSummary) explorationParts.push('Matches: ' + matchSummary);
    if (specialSummary) explorationParts.push('Specials: ' + specialSummary);
    if (!Number.isNaN(rollTotal) && rollTotal > 0) explorationParts.push('Total: ' + rollTotal);
    explorationParts.push('Shards: ' + rewards.wyrdstone);
    if (selectedItemsCsv) explorationParts.push('Items: ' + selectedItemsCsv);

    var eventDescription = notes;
    if (explorationParts.length) {
      var rollSummary = '[Exploration] ' + explorationParts.join(' | ');
      eventDescription = eventDescription ? eventDescription + ' ' + rollSummary : rollSummary;
    }

    await event.createEvent({
      type: 6,
      entities: [
        { id: ownedGame._id, kind: 'Game' },
        { id: rosterId, kind: 'Roster' }
      ],
      name: 'Exploration: ' + (targetRoster.name || 'Roster'),
      description: eventDescription,
      rewards
    });

    res.status(201).redirect(`/games/game/${ownedGame._id}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/game/:id/event/result', auth.requireAuthenticated, async (req, res) => {
  try {
    const ownedGame = await loadOwnedGame(req, res, req.params.id);
    if (!ownedGame) return;

    const isDraw = req.body && (req.body.draw === 'on' || req.body.draw === 'true' || req.body.draw === true);
    const winners = normalizeIdArray(req.body && (req.body.winners || req.body['winners[]']));
    const losers = normalizeIdArray(req.body && (req.body.losers || req.body['losers[]']));
    const notes = req.body && req.body.description ? String(req.body.description).trim() : '';

    const gameRosterIds = new Set((ownedGame.rosters || []).map(function (entry) {
      return String(entry && entry._id ? entry._id : entry);
    }));

    const allSelected = winners.concat(losers);
    const hasInvalid = allSelected.some(function (id) { return !gameRosterIds.has(String(id)); });
    if (hasInvalid) {
      return res.status(400).json({ error: 'Result selections must be rosters assigned to this game.' });
    }

    if (!isDraw) {
      if (!winners.length || !losers.length) {
        return res.status(400).json({ error: 'Select at least one winner and one loser, or mark Draw.' });
      }
      const overlap = winners.some(function (winnerId) { return losers.includes(winnerId); });
      if (overlap) {
        return res.status(400).json({ error: 'A roster cannot be both winner and loser.' });
      }
    }

    const participatingRosters = isDraw
      ? Array.from(gameRosterIds)
      : Array.from(new Set(winners.concat(losers)));

    const rosterEntities = participatingRosters.map(function (id) {
      return { id: id, kind: 'Roster' };
    });

    await event.createEvent({
      type: 7,
      entities: [{ id: ownedGame._id, kind: 'Game' }].concat(rosterEntities),
      name: isDraw ? 'Game Result: Draw' : 'Game Result',
      description: notes,
      result: {
        draw: isDraw,
        winners: isDraw ? [] : winners,
        losers: isDraw ? [] : losers
      }
    });

    res.status(201).redirect(`/games/game/${ownedGame._id}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/game/:id/event/injury', auth.requireAuthenticated, async (req, res) => {
  try {
    const ownedGame = await loadOwnedGame(req, res, req.params.id);
    if (!ownedGame) return;

    const memberId = req.body && req.body.member ? String(req.body.member).trim() : '';
    const injury = parseInt(req.body && req.body.injury, 10);
    const notes = req.body && req.body.description ? String(req.body.description).trim() : '';

    if (!memberId) {
      return res.status(400).json({ error: 'Injury events require a member.' });
    }

    const rosterIds = toObjectIdStrings(ownedGame.rosters);
    const targetMember = await member.getMemberById(memberId);
    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    const memberRosterId = targetMember.roster && targetMember.roster._id
      ? String(targetMember.roster._id)
      : String(targetMember.roster || '');
    if (!rosterIds.includes(memberRosterId)) {
      return res.status(400).json({ error: 'Selected member must belong to a roster assigned to this game.' });
    }

    const memberPlayerId = targetMember.roster && targetMember.roster.player
      ? String(targetMember.roster.player)
      : '';
    if (!isOwnedByCurrentPlayer(req, memberPlayerId)) {
      return res.status(403).json({ error: 'You can only create injury events for your own members.' });
    }

    if (Number.isNaN(injury) || injury < 1 || injury > 20) {
      return res.status(400).json({ error: 'A valid injury selection is required.' });
    }

    const memberUnitType = targetMember && targetMember.unit && targetMember.unit.type
      ? Number(targetMember.unit.type)
      : 0;
    if (memberUnitType === 2 && injury !== 1 && injury !== 14) {
      return res.status(400).json({ error: 'Henchmen injuries are limited to Dead or Full Recovery.' });
    }

    await event.createEvent({
      type: 2,
      entities: [
        { id: ownedGame._id, kind: 'Game' },
        { id: targetMember._id, kind: 'Member' }
      ],
      name: 'Injury: ' + (targetMember.name || 'Member'),
      description: notes,
      injury: injury
    });

    // Henchman Dead! injury: reduce group qty by 1
    if (memberUnitType === 2 && injury === 1) {
      const currentQty = Number(targetMember.qty) || 1;
      const newQty = Math.max(0, currentQty - 1);
      await member.updateMember(memberId, { qty: newQty });
    }

    res.status(201).redirect(`/games/game/${ownedGame._id}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;