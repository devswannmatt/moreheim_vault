var router = require('express').Router();
const roster   = require('../database/models/roster');
const campaign = require('../database/models/campaign');
const player   = require('../database/models/player');
const member   = require('../database/models/member');
const warband = require('../database/models/warband');
const event   = require('../database/models/event');
const item    = require('../database/models/item');
const auth    = require('../system/auth');

const calc = require('../js/calc');

function renderView(req, res, view, data) {
  return res.render(view, Object.assign({}, data, {
    isModal: req.query && (req.query.modal === '1' || req.query.modal === 'true'),
    layout: !(req.query && (req.query.modal === '1' || req.query.modal === 'true'))
  }));
}

function buildStockpileGroups(items) {
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

function countWyrdstone(groups) {
  return (groups || []).reduce((total, group) => {
    const name = String(group.item && group.item.name ? group.item.name : '').toLowerCase();
    if (!name.includes('wyrdstone')) return total;
    return total + (group.qty || 0);
  }, 0);
}

function buildStockpileTypeSections(groups) {
  const sections = [
    { type: 1, label: 'Melee Weapons', groups: [] },
    { type: 2, label: 'Ranged Weapons', groups: [] },
    { type: 3, label: 'Armour', groups: [] },
    { type: 4, label: 'Miscellaneous', groups: [] }
  ];

  (groups || []).forEach(group => {
    const type = Number(group && group.item ? group.item.type : 0);
    const target = sections.find(s => s.type === type) || sections[3];
    target.groups.push(group);
  });

  return sections;
}

function isOwnedByCurrentPlayer(req, playerId) {
  if (!auth.isAuthEnabledForRequest(req)) return true;
  return Boolean(req.currentPlayer && String(req.currentPlayer._id) === String(playerId));
}

function createMemberReceiveItemEvent(memberRecord, itemRecord) {
  return event.createEvent({
    type: 4,
    entities: [{ id: memberRecord._id, kind: 'Member' }],
    name: `Received ${itemRecord.name}`,
    description: `Received ${itemRecord.name} from the roster stockpile.`,
    wealth: { gold: 0 }
  });
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
  console.log("Rendering rosters view");
  try {
    const rosters  = await roster.findRosters();
    const players  = await player.findPlayers();
    const warbands = await warband.findWarbands();

    rosters.forEach(async r => {
      const members = calc.membersInRoster(r._id, await member.findMembers());
      r.wealth = calc.wealth(members);
    });
    res.render('rosters', { rosters: rosters, players: players, warbands: warbands });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/roster/:id', async (req, res) => {
  console.log(`Fetching roster with ID: ${req.params.id}`);
  try {
    const rosters  = await roster.getRosterById(req.params.id);
    const members  = await member.findMembers({ roster: req.params.id });
    members.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const warbands = await warband.findWarbands();

    const wealth = { rating: 0, gold: 0 };
    for (let i = 0; i < members.length; i++) {
      let m = members[i];
      var events = await event.findEvents({ 'entities.id': m._id });
      m.wealth   = await calc.wealth([m], m.items);
      wealth.rating += m.wealth.rating;
      wealth.gold += m.wealth.gold;

      m.injuries = events
        .filter(ev => ev.type === 2)
        .map(ev => {
          const details = ev.injury ? calc.fetchInjuries(ev.injury) : null;
          return {
            _id: ev._id,
            createdAt: ev.createdAt,
            details,
            name: ev.name
          };
        });
      m.hasSkillsOrInjuries = Boolean(
        (m.unit && Array.isArray(m.unit.traits) && m.unit.traits.length)
        || (Array.isArray(m.traits) && m.traits.length)
        || (Array.isArray(m.injuries) && m.injuries.length)
      );

      const currentExp = calc.calcCurrentExp((m.unit.experience + m.experience), events);
      m.expLevels = await calc.buildExpLevels(m.unit, currentExp);
      m = await calc.checkEvents(m, events, m.expLevels);
      m.levelUpsAvailableCount = Array.isArray(m.expLevels)
        ? m.expLevels.filter(box => box && box.earned && box.level && !box.spent).length
        : 0;
      m.hasLevelUpsAvailable = m.levelUpsAvailableCount > 0;
      members[i] = m;
    }
    
    if (!rosters) return res.status(404).json({ error: 'Roster not found' });

    const maxRating = members.reduce((max, m) => Math.max(max, m.wealth?.rating || 0), 0);
    if (maxRating > 0) members.forEach(m => { m.isTopRated = (m.wealth?.rating || 0) === maxRating; });

    const heroCount     = members.filter(m => m.unit && m.unit.type === 1).reduce((sum, m) => sum + (m.qty || 1), 0);
    const henchmanCount = members.filter(m => m.unit && m.unit.type === 2).reduce((sum, m) => sum + (m.qty || 1), 0);
    const totalCount    = heroCount + henchmanCount;

    const stockpileGroups = buildStockpileGroups(rosters.items);
    const stockpileTypeSections = buildStockpileTypeSections(stockpileGroups);
    const stockpileValue  = stockpileGroups.reduce((sum, g) => sum + (g.item.gold || 0) * g.qty, 0);
    const wyrdstoneCount = countWyrdstone(stockpileGroups);
    const canEdit = isOwnedByCurrentPlayer(req, rosters.player && rosters.player._id ? rosters.player._id : rosters.player);
    const rosterEvents = await event.findEvents({ 'entities.id': rosters._id }, { sort: { createdAt: -1 } });

    const selectedWarband = (warbands || []).find(w => String(w._id) === String(rosters.warband));
    
    // Fetch campaigns containing this roster
    const campaigns = await campaign.findCampaigns({ rosters: req.params.id });
    
    // Build a map of current unit counts
    const unitCounts = new Map();
    members.forEach(m => {
      const unitId = String(m.unit && m.unit._id ? m.unit._id : '');
      if (unitId) {
        const currentCount = unitCounts.get(unitId) || 0;
        unitCounts.set(unitId, currentCount + (m.qty || 1));
      }
    });

    const memberCreateSetup = {
      warbandId: selectedWarband ? selectedWarband._id : rosters.warband,
      warbandName: selectedWarband ? selectedWarband.name : 'Warband',
      warbandTraits: selectedWarband && Array.isArray(selectedWarband.traits)
        ? selectedWarband.traits
            .filter(t => t && t.name)
            .map(t => ({ _id: t._id, name: t.name, description: t.description || '' }))
            .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        : [],
      rosterId: rosters._id,
      rosterName: rosters.name,
      rosterGold: rosters.gold || 0,
      units: selectedWarband && Array.isArray(selectedWarband.units) ? selectedWarband.units.map(u => ({
        parsedName: (function () {
          const rawName = String(u.name || '');
          const match = rawName.match(/^(.*)\s*\(([^)]+)\)\s*$/);
          return match ? match[1].trim() : rawName;
        })(),
        parsedSubtype: (function () {
          const rawName = String(u.name || '');
          const match = rawName.match(/^(.*)\s*\(([^)]+)\)\s*$/);
          return match ? match[2].trim() : '';
        })(),
        _id: u._id,
        name: u.name,
        type: u.type,
        maxCount: u.maxCount,
        gold: u.gold,
        currentCount: unitCounts.get(String(u._id)) || 0
      })).sort((a, b) => {
        // Sort by type ascending (Heroes 1 first, then Henchmen 2)
        if (a.type !== b.type) return a.type - b.type;
        // Then by gold descending (most expensive first)
        const goldA = Number(a.gold || 0);
        const goldB = Number(b.gold || 0);
        if (goldA !== goldB) return goldB - goldA;
        // Then by name
        return String(a.name || '').localeCompare(String(b.name || ''));
      }) : []
    };

    res.render('roster', { roster: rosters, members: members, warbands: warbands, wealth: wealth, heroCount, henchmanCount, totalCount, stockpileGroups, stockpileTypeSections, stockpileValue, wyrdstoneCount, canEdit, memberCreateSetup, campaigns, rosterEvents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/roster/:id/event/gainresource', async (req, res) => {
  try {
    const r = await roster.getRosterById(req.params.id);
    if (!r) return res.status(404).json({ error: 'Roster not found' });

    renderView(req, res, 'event_roster_gain_resource', {
      roster: r,
      resourceTypes: [
        { value: 1, label: 'Gold' },
        { value: 2, label: 'Wyrdstone' }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/roster/:id/event/gainresource', auth.requireAuthenticated, async (req, res) => {
  try {
    const r = await loadOwnedRoster(req, res, req.params.id);
    if (!r) return;

    const rawResourceType =
      (req.body && req.body.resource && req.body.resource.type)
      ?? (req.body && req.body['resource.type'])
      ?? (req.body && req.body.type);
    const rawQuantity =
      (req.body && req.body.resource && req.body.resource.quantity)
      ?? (req.body && req.body['resource.quantity'])
      ?? (req.body && req.body.quantity);

    const resourceType = parseInt(rawResourceType, 10);
    const quantity = parseInt(rawQuantity, 10);
    const notes = req.body && req.body.description ? String(req.body.description).trim() : '';

    if (![1, 2].includes(resourceType)) {
      return res.status(400).json({ error: 'Resource type must be Gold or Wyrdstone.' });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be a positive whole number.' });
    }

    if (resourceType === 1) {
      await roster.updateRoster(req.params.id, { gold: (r.gold || 0) + quantity });
      await event.createEvent({
        type: 3,
        entities: [{ id: r._id, kind: 'Roster' }],
        name: `Gained ${quantity} Gold`,
        description: notes,
        wealth: { gold: quantity },
        resource: { type: 1, quantity }
      });
      return res.status(201).json({ success: true });
    }

    const wyrdstoneOptions = await item.findItems({ name: { $regex: /wyrdstone/i } }, { sort: { gold: 1, name: 1 } });
    if (!wyrdstoneOptions || wyrdstoneOptions.length === 0) {
      return res.status(400).json({ error: 'Unable to add Wyrdstone because no Wyrdstone item exists.' });
    }

    const wyrdstoneItem = wyrdstoneOptions[0];
    const currentItems = (r.items || []).map(i => String(i && i._id ? i._id : i));
    const itemsToAdd = Array.from({ length: quantity }, () => String(wyrdstoneItem._id));

    await roster.updateRoster(req.params.id, { items: [...currentItems, ...itemsToAdd] });
    await event.createEvent({
      type: 3,
      entities: [{ id: r._id, kind: 'Roster' }],
      name: `Gained ${quantity} Wyrdstone`,
      description: notes,
      wealth: { gold: 0 },
      resource: { type: 2, quantity }
    });

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/roster/:id', auth.requireAuthenticated, async (req, res) => {
  console.log(`Updating roster with ID: ${req.params.id} with data:`, req.body);
  try {
    const ownedRoster = await loadOwnedRoster(req, res, req.params.id);
    if (!ownedRoster) return;
    delete req.body.player;

    roster.updateRoster(req.params.id, req.body).then(updatedRoster => {
      if (!updatedRoster) {
        return res.status(404).json({ error: 'Roster not found' });
      }
      res.status(200).json(updatedRoster);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/json', async (req, res) => {
  console.log("Fetching rosters in JSON format");
  try {
    const items = await roster.findRosters();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message, info: "Error fetching rosters" });
  }
});

router.post('/create', auth.requireAuthenticated, async (req, res) => {
  try {
    console.log("Creating new roster with data:", req.body);
    if (auth.isAuthEnabledForRequest(req)) {
      req.body.player = req.currentPlayer._id;
    }

    const selectedWarbandId = req.body && req.body.warband;
    if (!selectedWarbandId) {
      return res.status(400).json({ error: 'Warband is required.' });
    }

    const selectedWarband = await warband.getWarbandById(selectedWarbandId);
    if (!selectedWarband) {
      return res.status(400).json({ error: 'Invalid warband selected.' });
    }

    const startingGold = Number(selectedWarband.gold);
    if (Number.isFinite(startingGold)) {
      req.body.gold = startingGold;
    }

    roster.createRoster(req.body).then(result => {
      res.status(201).redirect(`/rosters/roster/${result}`);
    }).catch(err => {
      res.status(500).json({ error: err.message });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/roster/:id', auth.requireAuthenticated, async (req, res) => {
  console.log(`Deleting roster with ID: ${req.params.id}`);
  try {
    const ownedRoster = await loadOwnedRoster(req, res, req.params.id);
    if (!ownedRoster) return;
    const deletedRoster = await roster.deleteRoster(req.params.id);
    if (!deletedRoster) {
      return res.status(404).json({ error: 'Roster not found' });
    }
    res.status(200).json({ message: 'Roster deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/roster/:id/inventory', async (req, res) => {
  try {
    const r = await roster.getRosterById(req.params.id);
    if (!r) return res.status(404).json({ error: 'Roster not found' });
    const items = await item.findItems();
    const rosterMembers = await member.findMembers({ roster: req.params.id });
    const stockpileGroups = buildStockpileGroups(r.items);
    const canEdit = isOwnedByCurrentPlayer(req, r.player && r.player._id ? r.player._id : r.player);
    renderView(req, res, 'roster_inventory', { roster: r, items, stockpileGroups, rosterMembers, canEdit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/roster/:id/inventory', auth.requireAuthenticated, async (req, res) => {
  try {
    const r = await loadOwnedRoster(req, res, req.params.id);
    if (!r) return;

    let oldItems = (r.items || []).map(i => String(i._id || i));
    let itemsToAdd = req.body.items || [];
    if (!Array.isArray(itemsToAdd)) itemsToAdd = [itemsToAdd];
    itemsToAdd = itemsToAdd.filter(v => v !== undefined && v !== null && String(v).length > 0);

    if (itemsToAdd.length === 0) return res.status(400).json({ error: 'No items submitted.' });

    let itemCost = 0;
    let purchasedNames = [];
    await Promise.all(itemsToAdd.map(id =>
      item.getItemById(id).then(i => {
        if (!i) throw new Error('Invalid item ID: ' + id);
        purchasedNames.push(i.name);
        itemCost += (i.gold || 0);
      })
    ));

    if (r.gold < itemCost) return res.status(400).json({ error: 'Insufficient gold to purchase these items.' });

    await roster.updateRoster(req.params.id, { items: [...oldItems, ...itemsToAdd], gold: r.gold - itemCost });

    event.createEvent({
      type: 4,
      entities: [{ id: r._id, kind: 'Roster' }],
      name: `Stockpile: Purchased ${purchasedNames.join(', ')}`,
      description: '',
      wealth: { gold: -itemCost }
    }).catch(() => {});

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/roster/:id/item', auth.requireAuthenticated, async (req, res) => {
  try {
    const { action, item: itemId } = req.query;
    if (!action) return res.status(400).json({ error: 'Action is required' });
    if (!itemId)  return res.status(400).json({ error: 'Item ID is required' });

    const r = await loadOwnedRoster(req, res, req.params.id);
    if (!r) return;

    let updatedItems = (r.items || []).map(i => String(i._id || i));
    const itemIndex = updatedItems.indexOf(String(itemId));
    if (itemIndex === -1) return res.status(400).json({ error: 'Item not found in stockpile' });

    if (action === 'sell' || action === 'refund') {
      const i = await item.getItemById(itemId);
      if (!i) return res.status(404).json({ error: 'Item not found' });

      updatedItems.splice(itemIndex, 1);
      const goldEarned = action === 'sell' ? Math.floor((i.gold || 0) / 2) : (i.gold || 0);

      const updatedRoster = await roster.updateRoster(req.params.id, { items: updatedItems, gold: r.gold + goldEarned });
      if (!updatedRoster) return res.status(404).json({ error: 'Roster not found' });
      return res.status(200).json({ roster: updatedRoster, goldEarned });
    }

    if (action === 'give') {
      const memberId = req.query.member || req.body.member;
      if (!memberId) return res.status(400).json({ error: 'Member ID is required for give action' });

      const i = await item.getItemById(itemId);
      if (!i) return res.status(404).json({ error: 'Item not found' });

      updatedItems.splice(itemIndex, 1);
      const updatedRoster = await roster.updateRoster(req.params.id, { items: updatedItems });
      if (!updatedRoster) return res.status(404).json({ error: 'Roster not found' });

      const m = await member.getMemberById(memberId);
      if (!m) return res.status(404).json({ error: 'Member not found' });
      const memberRosterId = (m.roster && m.roster._id) ? m.roster._id : m.roster;
      if (String(memberRosterId) !== String(req.params.id)) {
        return res.status(403).json({ error: 'You can only give stockpile items to members in this roster.' });
      }
      const memberItems = (m.items || []).map(i => String(i._id || i));
      await member.updateMember(memberId, { items: [...memberItems, String(itemId)] });
      await createMemberReceiveItemEvent(m, i);
      return res.status(200).json({ success: true });
    }

    res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;