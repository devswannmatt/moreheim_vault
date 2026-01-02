var router = require('express').Router();
const player = require('../database/models/player');
const warband = require('../database/models/warband');

router.get('/', async (req, res) => {
  console.log("Rendering players view");
  try {
    const items = await player.findPlayers();
    const warbands = await warband.findWarbands();
    res.render('players', { players: items, warbands: warbands });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/player/:id', async (req, res) => {
  console.log(`Fetching player with ID: ${req.params.id}`);
  try {
    const item = await player.getPlayerById(req.params.id);
    const warbands = await warband.findWarbands({ player: req.params.id });
    if (!item) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.render('player', { player: item, warbands: warbands });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/player/:id', async (req, res) => {
  console.log(`Updating player with ID: ${req.params.id} with data:`, req.body);
  try {
    player.updatePlayer(req.params.id, req.body).then(updatedPlayer => {
      if (!updatedPlayer) {
        return res.status(404).json({ error: 'Player not found' });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/json', async (req, res) => {
  console.log("Fetching players in JSON format");
  try {
    const items = await player.findPlayers();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message, info: "Error fetching players" });
  }
});

router.post('/create', async (req, res) => {
  try {
    console.log("Creating new player with data:", req.body);
    player.createPlayer(req.body).then(result => {
      res.status(201).redirect(`/players/player/${result}`);
    }).catch(err => {
      res.status(500).json({ error: err.message });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;