var router = require('express').Router();
const player = require('../database/models/player');
const roster = require('../database/models/roster');
const auth   = require('../system/auth');

router.get('/', async (req, res) => {
  console.log("Rendering players view");
  try {
    const items = await player.findPlayers();
    const rosters = await roster.findRosters();
    res.render('players', { players: items, rosters: rosters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/player/:id', async (req, res) => {
  console.log(`Fetching player with ID: ${req.params.id}`);
  try {
    const item = await player.getPlayerById(req.params.id);
    const rosters = await roster.findRosters({ player: req.params.id });
    if (!item) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.render('player', { player: item, rosters: rosters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/player/:id', auth.requireAuthenticated, async (req, res) => {
  console.log(`Updating player with ID: ${req.params.id} with data:`, req.body);
  try {
    if (auth.isAuthEnabledForRequest(req) && String(req.currentPlayer._id) !== String(req.params.id)) {
      return res.status(403).json({ error: 'You can only modify your own player account.' });
    }
    player.updatePlayer(req.params.id, req.body).then(updatedPlayer => {
      if (!updatedPlayer) {
        return res.status(404).json({ error: 'Player not found' });
      }
      res.status(200).json(updatedPlayer);
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

router.post('/create', auth.requireAuthenticated, async (req, res) => {
  try {
    if (auth.isAuthEnabledForRequest(req)) {
      return res.status(403).json({ error: 'Player accounts are created automatically on first login.' });
    }
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