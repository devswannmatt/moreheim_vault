var router = require('express').Router();
const { getDb } = require('../database/db');
const warband = require('../database/models/warband');
const player  = require('../database/models/player');

router.get('/', async (req, res) => {
  console.log("Rendering warbands view");
  try {
    const items   = await warband.findWarbands();
    const players = await player.findPlayers();
    res.render('warbands', { warbands: items, players: players });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/warband/:id', async (req, res) => {
  console.log(`Fetching warband with ID: ${req.params.id}`);
  try {
    const item = await warband.getWarbandById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Warband not found' });
    }
    res.render('warband', { warband: item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/warband/:id', async (req, res) => {
  console.log(`Updating warband with ID: ${req.params.id} with data:`, req.body);
  try {
    warband.updateWarband(req.params.id, req.body).then(updatedWarband => {
      if (!updatedWarband) {
        return res.status(404).json({ error: 'Warband not found' });
      }
      res.status(200).json(updatedWarband);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/json', async (req, res) => {
  console.log("Fetching warbands in JSON format");
  try {
    const items = await warband.findWarbands();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message, info: "Error fetching warbands" });
  }
});

router.post('/create', async (req, res) => {
  try {
    console.log("Creating new warband with data:", req.body);
    warband.createWarband(req.body).then(result => {
      res.status(201).redirect(`/warbands/warband/${result}`);
    }).catch(err => {
      res.status(500).json({ error: err.message });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;