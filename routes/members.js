var router = require('express').Router();
const member  = require('../database/models/member');
const roster  = require('../database/models/roster');
const unit    = require('../database/models/unit');
const warband = require('../database/models/warband');
const item    = require('../database/models/item');
const event   = require('../database/models/event');
const trait   = require('../database/models/trait');

const calc = require('../js/calc');

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
  const units    = await unit.findUnits({warband: req.query.warband});

  rosters.map(r => {
    r.selected = (req.query.roster && req.query.roster === r._id.toString()) ? true : false;
  });

  warbands.map(wb => {
    wb.selected = (req.query.warband && req.query.warband === wb._id.toString()) ? true : false;
  });

  try {
    res.render('member_create', { rosters: rosters, units: units, warbands: warbands } );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/member/:id', async (req, res) => {
  console.log(`Fetching member with ID: ${req.params.id}`);
  try {
    const result  = await member.getMemberById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Member not found' });

    const rosters = await roster.findRosters();
    const units   = await unit.findUnits();
    const events  = await event.findEvents({ 'entities.id': result._id });

    const wealth = calc.wealth([result], result.items);

    console.log('Wealth calculated:', wealth);
    let expLevels = {};
    let expCap = 0;
    let expCurrent = 0;
    if (result.unit.type === 1) expCap = 90;
    if (result.unit.type === 2) expCap = 14;

    expCurrent = result.unit.experience + result.experience;

    // Clean this up, we are doing two loops where one should suffice
    for (const ev of events) {
      if (ev.type === 3) {
        if (ev.wealth && ev.wealth.experience) {
          expCurrent += ev.wealth.experience;
        }
      }
    }

    for (let i = 1; i <= expCap; i++) {
      if (i <= expCurrent) {
        expLevels[i] = { earned: true, spent: calc.spentExp(i, result.unit.experience), level: calc.levelUp(i)};
        if (i <= result.unit.experience) {
          expLevels[i].initial = true;
        }
      } else {
        expLevels[i] = { earned: false, spent: false, level: calc.levelUp(i) };
      }
    }

    result.unit.advance = { s: false, a: false, ws: false, bs: false, i: false, ld: false, w: false, t: false };
    result.traits = [];
    for (const ev of events) {
      if (ev.type === 1 && ev.wealth && ev.wealth.experience) {
        if (expLevels[ev.wealth.experience]) {
          expLevels[ev.wealth.experience].spent = true;
        }
 
        if (ev.advance) {
          if (ev.advance_linked) {
            console.log('Processing advance linked:', ev.advance);
            if (ev.advance === '2-5' || ev.advance === '10-12') {
              console.log('Adding trait for advance linked skillList:', ev.advance_linked);
              var tr = await trait.getTraitById(ev.advance_linked);
              result.traits.push(tr);
            } else {
              console.log('Processing standard advance for type:', ev.advance);
              let advance = calc.advanceTypes[result.unit.type][ev.advance].subType[ev.advance_linked];
              let stat = advance.stat ? advance.stat : undefined;
              Object.keys(stat).forEach(s => {
                result.unit[s] += stat[s];
                result.unit.advance[s] = true; 
              });
            }
          }
        }
      }
    }

    res.render('member', { member: result, rosters: rosters, units: units, events: events, wealth: wealth, expLevels: expLevels });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/member/:id', async (req, res) => {
  console.log(`Updating member with ID: ${req.params.id} with data:`, req.body);
  try {
    member.updateMember(req.params.id, req.body).then(updatedMember => {
      if (!updatedMember) return res.status(404).json({ error: 'Member not found' });
      res.status(200).json(updatedMember);
    });
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

    const traits = await trait.findTraits({ type: { $in: [4,5,6,7,8,9] } });
    var advanceTypes = calc.advanceTypes[result.unit.type];

    res.render('event_level_up', { member: result, level: req.query.level, eventTypes: calc.fetchEventTypes(1), query: req.query, advanceTypes: advanceTypes, skillList: traits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/member/:id/event/gainresource', async (req, res) => {
  console.log(`Fetching member event level up with ID: ${req.params.id}`);
  try {
    const result = await member.getMemberById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Member not found' });

    res.render('event_gain_resource', { member: result, eventTypes: calc.fetchEventTypes(3), query: req.query });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/member/:id/inventory', async (req, res) => {
  console.log(`Fetching member with ID: ${req.params.id}`);
  try {
    const result = await member.getMemberById(req.params.id);
    const items  = await item.findItems();

    if (!result) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.render('member_inventory', { member: result, items: items, inventory: result.items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/member/:id/inventory', async (req, res) => {
  console.log(`Updating member Inventory with ID: ${req.params.id} with data:`, req.body);
  try {
    let items = req.body.items || [];
    if (!Array.isArray(items)) items = [items];
    items = items.filter(function (v) { return v !== undefined && v !== null && String(v).length > 0; });

    member.updateMember(req.params.id, { items: items }).then(updatedMember => {
      if (!updatedMember) {
        return res.status(404).json({ error: 'Member not found' });
      }
      res.status(200).json(updatedMember);
    });
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

router.post('/create', async (req, res) => {
  try {
    console.log("Creating new member with data:", req.body);
    const rosters = await roster.getRosterById(req.body.roster);
    const units   = await unit.getUnitById(req.body.unit);
    console.log('Roster fetched for member creation:', rosters);
    console.log('Unit fetched for member creation:', units);

    if (rosters.gold < (units.gold || 0)) return res.status(400).json({ error: 'Insufficient gold in roster to create this member.' });

    member.createMember(req.body).then(result => {
      roster.updateRoster(req.body.roster, { gold: rosters.gold - (units.gold || 0) } ).then((result) => {
        console.log('Adjusted Gold for roster after member creation:', result);
        res.status(201).redirect(`/members/member/${result}`);
      }).catch(err => {
        res.status(500).json({ error: err.message });
      });
    }).catch(err => {
      res.status(500).json({ error: err.message });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/member/:id', async (req, res) => {
  console.log(`Deleting member with ID: ${req.params.id}`);
  try {
    const result = await member.deleteMember(req.params.id);
    if (!result) return res.status(404).json({ error: 'Member not found' });
    res.status(200).json({ message: 'Member deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;