var router = require('express').Router();
const roster  = require('../database/models/roster');
const player  = require('../database/models/player');
const member  = require('../database/models/member');
const warband = require('../database/models/warband');
const event   = require('../database/models/event');

const calc = require('../js/calc');

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
    const warbands = await warband.findWarbands();

    const wealth = { rating: 0, gold: 0 };
    members.forEach(async m => {
      var events = await event.findEvents({ 'entities.id': m._id });
      m.wealth = calc.wealth([m], m.items);
      wealth.rating += m.wealth.rating;
      wealth.gold += m.wealth.gold;
      
      m.wealth    = calc.wealth([m], m.items);
      m.expLevels = calc.buildExpLevels(m.unit, calc.calcCurrentExp((m.unit.experience + m.experience), events));
  
      m = await calc.checkEvents(m, events, m.expLevels);
    });
    
    if (!rosters) return res.status(404).json({ error: 'Roster not found' });

    res.render('roster', { roster: rosters, members: members, warbands: warbands, wealth: wealth });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/roster/:id', async (req, res) => {
  console.log(`Updating roster with ID: ${req.params.id} with data:`, req.body);
  try {
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

router.post('/create', async (req, res) => {
  try {
    console.log("Creating new roster with data:", req.body);
    roster.createRoster(req.body).then(result => {
      res.status(201).redirect(`/rosters/roster/${result}`);
    }).catch(err => {
      res.status(500).json({ error: err.message });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;