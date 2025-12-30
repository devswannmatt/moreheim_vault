var router = require('express').Router();
const { getDb } = require('../database/db');
const player = require('../database/models/player');

router.get('/', async (req, res) => {
  console.log("Rendering players view");
  try {
    const items = await player.findPlayers();
    res.render('players', { players: items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/player/:id', async (req, res) => {
  console.log(`Fetching player with ID: ${req.params.id}`);
  try {
    const item = await player.getPlayerById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.render('player', { player: item });
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