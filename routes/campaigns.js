var router = require('express').Router();
const campaign = require('../database/models/campaign');
const player = require('../database/models/player');
const roster = require('../database/models/roster');
const member = require('../database/models/member');

const calc = require('../js/calc');

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
    const result = await campaign.getCampaignById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Campaign not found' });

    const rostersList = await roster.findRosters();
    const rosters = await roster.findRosters({ _id: { $in: result.rosters } });

    rosters.forEach(async r => {
      var members = await member.findMembers({ roster: r._id });
      console.log("Members in Roster:", members);
      r.wealth = { rating: 0, gold: 0 };
      members.forEach(async m => {
        m.wealth = await calc.wealth([m], m.items);
        
        r.wealth.rating += m.wealth.rating;
        r.wealth.gold += m.wealth.gold;
      });
      // console.log("Roster Wealth:", r.wealth);
    });

    res.render('campaign', { campaign: result, rostersList, rosters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/campaign/:id', async (req, res) => {
  console.log("[PATCH] Campaign:", req.params.id);
  try {
    const campaignId = req.params.id;
    console.log("Adding roster to campaign:", campaignId);
    const rosterData = req.body || {};
    console.log("Roster data:", rosterData);
    campaign.addRosterToCampaign(campaignId, rosterData.roster).then((rosterId) => {
      res.status(200).json({ rosterId });
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