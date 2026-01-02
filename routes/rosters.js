var router = require('express').Router();
const roster = require('../database/models/roster');
const player  = require('../database/models/player');
const member  = require('../database/models/member');

router.get('/', async (req, res) => {
  console.log("Rendering rosters view");
  try {
    const items   = await roster.findRosters();
    const players = await player.findPlayers();
    res.render('rosters', { rosters: items, players: players });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/roster/:id', async (req, res) => {
  console.log(`Fetching roster with ID: ${req.params.id}`);
  try {
    const item    = await roster.getRosterById(req.params.id);
    const members = await member.findMembers({ roster: req.params.id });
    if (!item) {
      return res.status(404).json({ error: 'Roster not found' });
    }
    res.render('roster', { roster: item, members: members });
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