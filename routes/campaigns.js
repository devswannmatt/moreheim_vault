var router = require('express').Router();
const campaign = require('../database/models/campaign');
const player = require('../database/models/player');

router.get('/', async (req, res) => {
  try {
    const items = await campaign.findCampaigns();
    res.render('campaigns', { campaigns: items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/campaign/:id', async (req, res) => {
  console.log(`[FETCH] Campaign: ${req.params.id}`);
  try {
    const item = await campaign.getCampaignById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    const playersList = await player.findPlayers();
    const players = await player.findPlayers({ _id: { $in: item.players } });
    res.render('campaign', { campaign: item, playersList, players });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/campaign/:id', async (req, res) => {
  console.log("[PATCH] Campaign:", req.params.id);
  try {
    const campaignId = req.params.id;
    console.log("Adding player to campaign:", campaignId);
    const playerData = req.body || {};
    console.log("Player data:", playerData);
    campaign.addPlayerToCampaign(campaignId, playerData.player).then((playerId) => {
      res.status(200).json({ playerId });
    }).catch(err => {
      res.status(500).json({ error: err.message });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/json', async (req, res) => {
  try {
    const items = await campaign.findCampaigns();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/create', async (req, res) => {
  try {
    const data = req.body || {};
    const result = await campaign.createCampaign(data);
    res.status(201).redirect(`/campaigns/campaign/${result}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;