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
    var result  = await member.getMemberById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Member not found' });

    const rosters = await roster.findRosters();
    const units   = await unit.findUnits();
    const events  = await event.findEvents({ 'entities.id': result._id });

    result.expLevels = await calc.buildExpLevels(result.unit, calc.calcCurrentExp((result.unit.experience + result.experience), events));
    result.wealth    = await calc.wealth([result], result.items);
    result           = await calc.checkEvents(result, events);

    events.forEach(ev => {
      if (ev.injury) ev.details = calc.fetchInjuries(ev.injury);
    });

    var injuries = events.filter(ev => ev.type === 2);

    res.render('member', { member: result, rosters: rosters, units: units, events: events, injuries: injuries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/member/:id', async (req, res) => {
  console.log(`Updating /member/:id with ID: ${req.params.id} with data:`, req.body);
  try {
    member.updateMember(req.params.id, req.body).then(updatedMember => {
      if (!updatedMember) return res.status(404).json({ error: 'Member not found' });
      res.status(200).json(updatedMember);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/member/:id/status', async (req, res) => {
  console.log(`Updating member status with ID: ${req.params.id} with data:`, req.body);
  console.log('Status from query:', req.query.status);
  try {
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

router.patch('/member/:id/item', async (req, res) => {
  console.log(`Item action Member with ID: ${req.params.id} with data:`, req.query);
  console.log('Status from query:', req.query.status);
  try {
    if (!req.query.action) return res.status(400).json({ error: 'Action is required' });
    if (!req.query.item)   return res.status(400).json({ error: 'Item ID is required' });
    if (!req.query.index)  return res.status(400).json({ error: 'Item index is required' });

    if (req.query.action === 'sell' || req.query.action === 'use' || req.query.action === 'refund') {
      member.getMemberById(req.params.id).then(m => {
        if (!m) return res.status(404).json({ error: 'Member not found' });
        item.getItemById(req.query.item).then(i => {
          if (!i) return res.status(404).json({ error: 'Item not found' });
          let updatedItems = m.items || [];
          const itemIndex = parseInt(req.query.index);
          if (itemIndex > -1) {
            updatedItems.splice(itemIndex, 1);
            member.updateMember(req.params.id, { items: updatedItems }).then(updatedMember => {
              if (!updatedMember) return res.status(404).json({ error: 'Member not found' });
              let goldEarned = 0;
              if (req.query.action === 'sell')   goldEarned = Math.floor((i.gold || 0) / 2) * (m.qty || 1);
              if (req.query.action === 'refund') goldEarned = (i.gold || 0) * (m.qty || 1);
              
              if (goldEarned) {
                console.log(`Member sold/refunded item ${i.name} for ${goldEarned} gold`);
                rosterAdjustGold(m.roster, goldEarned).then(() => {
                  return res.status(200).json({ member: updatedMember, goldEarned: goldEarned });
                }).catch(err => {
                  return res.status(500).json({ error: err.message });
                });
              } else {
                return res.status(200).json({ member: updatedMember });
              }
            });
          } else {
            res.status(400).json({ error: 'Member does not possess this item' });
          }
        });
      });
      return;
    }

    if (req.query.action === 'moveUp') {
      member.getMemberById(req.params.id).then(m => {
        if (!m) return res.status(404).json({ error: 'Member not found' });
        let updatedItems = m.items || [];
        const itemIndex = parseInt(req.query.index);
        if (itemIndex > 0) {
          const temp = updatedItems[itemIndex - 1];
          updatedItems[itemIndex - 1] = updatedItems[itemIndex];
          updatedItems[itemIndex] = temp;
          member.updateMember(req.params.id, { items: updatedItems }).then(updatedMember => {
            if (!updatedMember) return res.status(404).json({ error: 'Member not found' });
            res.status(200).json({ member: updatedMember });
          });
        } else {
          res.status(400).json({ error: 'Item is already at the top of the inventory' });
        }
      });
    }
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
  console.log(`Fetching member event gain resource with ID: ${req.params.id}`);
  try {
    const result = await member.getMemberById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Member not found' });

    res.render('event_gain_resource', { member: result, eventTypes: calc.fetchEventTypes(3), query: req.query });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/member/:id/event/injury', async (req, res) => {
  console.log(`Fetching member event injury with ID: ${req.params.id}`);
  try {
    const result = await member.getMemberById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Member not found' });

    res.render('event_injury', { member: result, eventTypes: calc.fetchEventTypes(2), injuries: calc.fetchInjuries(), query: req.query });
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

    res.render('member_inventory', { member: result, items: items, inventory: result.items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/member/:id/inventory', async (req, res) => {
  console.log(`Updating member Inventory with ID: ${req.params.id} with data:`, req.body);
  try {
    member.getMemberById(req.params.id).then(m => {
      if (!m) return res.status(404).json({ error: 'Member not found' });

      let oldItems = m.items.map(i => String(i._id)) || [];
      let newItems = req.body.items || [];
      if (!Array.isArray(newItems)) newItems = [newItems];
      newItems = newItems.filter(function (v) { return v !== undefined && v !== null && String(v).length > 0; });

      // Find items being added (in newItems but not in oldItems)
      // Create a copy of oldItems to track which items have been matched
      let itemsToAdd = [];
      let remainingOldItems = [...oldItems];

      newItems.forEach((item) => {
        const indexInOld = remainingOldItems.indexOf(item);
        if (indexInOld !== -1) {
          // Item already exists in inventory, remove it from tracking
          remainingOldItems.splice(indexInOld, 1);
        } else {
          // Item is new and needs to be purchased
          itemsToAdd.push(item);
        }
      });

      console.log('Items already in Inventory:', oldItems);
      console.log('Full desired Inventory:', newItems);
      console.log('Items to add (will charge for):', itemsToAdd);

      if (itemsToAdd.length === 0) return res.status(404).json({ error: 'No new items to add to inventory.' });

      var itemCost = 0;
      // Calculate cost for items being added using Promise.all to wait for all calculations
      var costPromises = itemsToAdd.map(element => {
        return item.getItemById(element).then(i => {
          if (!i) throw('Invalid item ID provided.');
          const cost = (i.gold * (m.qty || 1));
          itemCost += cost;
          console.log('Item to pay for:', i.name || element, 'Cost:', cost, 'Total so far:', itemCost);
          return cost;
        });
      });

      Promise.all(costPromises).then(() => {
        console.log('Total item cost calculated:', itemCost);

        roster.getRosterById(m.roster).then(r => {
          console.log('Roster fetched for member inventory update:', r);
          console.log('Roster gold available:', r.gold);
          if (r.gold < itemCost) return res.status(400).json({ error: 'Insufficient gold in roster to purchase these items.' });

          member.updateMember(req.params.id, { items: newItems }).then(updatedMember => {
            if (!updatedMember) return res.status(404).json({ error: 'Member not found' });

            rosterAdjustGold(m.roster, -(itemCost || 0)).then(() => {
              res.status(201).redirect(`/members/member/${updatedMember._id}`);
            }).catch(err => {
              res.status(500).json({ error: err.message });
            });
          });
        });
      }).catch(err => {
        res.status(500).json({ error: err.message });
      });
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
    roster.getRosterById(req.body.roster).then(r => {
      console.log('Roster fetched for member creation:', r);
      unit.getUnitById(req.body.unit).then(u => {
        console.log('Unit fetched for member creation:', u);
        var owedGold = (u.gold * req.body.qty || 0);
        if (r.gold < owedGold) throw('Insufficient gold in roster to create this member.');

        member.createMember(req.body).then(result => {
          rosterAdjustGold(req.body.roster, -(owedGold || 0)).then(() => {
            res.status(201).redirect(`/members/member/${result}`);
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
  if (!amount) return Promise.reject(new Error('Amount to adjust gold by is required'));
  return roster.getRosterById(rosterId).then(r => {
    let newGold = (r.gold || 0) + amount;
    return roster.updateRoster(rosterId, { gold: newGold });
  });
}

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