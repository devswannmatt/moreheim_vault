var router = require('express').Router();
const campaign = require('../database/models/campaign');
const player = require('../database/models/player');
const roster = require('../database/models/roster');
const member = require('../database/models/member');
const event = require('../database/models/event');

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

    const authEnabled = req.app.locals.authEnabled;
    const currentPlayerId = req.currentPlayer ? String(req.currentPlayer._id) : null;
    const creatorId = result.creator ? String(result.creator) : null;
    const isCreator = !authEnabled || (!!currentPlayerId && currentPlayerId === creatorId);

    // Privacy check
    if (authEnabled && result.privacy === 'private') {
      const isMember = Array.isArray(result.players) && result.players.some(p => String(p) === currentPlayerId);
      if (!isCreator && !isMember) {
        return res.status(403).render('home', { error: 'This campaign is private.' });
      }
    }

    const rostersList = await roster.findRosters();
    const rosters = await roster.findRosters({ _id: { $in: result.rosters } });
    const topHeroes = [];

    function buildPlayerDisplay(playerRecord) {
      const fullName = (playerRecord && playerRecord.name) ? playerRecord.name : 'Unknown Player';
      const username =
        (playerRecord && playerRecord.account && playerRecord.account.nickname)
        || (playerRecord && playerRecord.meta && playerRecord.meta.username)
        || (playerRecord && playerRecord.account && playerRecord.account.email ? String(playerRecord.account.email).split('@')[0] : '')
        || 'unknown';

      return {
        fullName,
        username: String(username).replace(/^#/, '')
      };
    }

    for (const r of rosters) {
      const members = await member.findMembers({ roster: r._id });
      r.wealth = { rating: 0, gold: 0 };
      r.playerDisplay = buildPlayerDisplay(r.player);

      for (const m of members) {
        const events = await event.findEvents({ 'entities.id': m._id });
        m.wealth = await calc.wealth([m], m.items);
        m.expLevels = await calc.buildExpLevels(
          m.unit,
          calc.calcCurrentExp((m.unit.experience + m.experience), events)
        );
        await calc.checkEvents(m, events, m.expLevels);

        r.wealth.rating += m.wealth.rating;
        r.wealth.gold += m.wealth.gold;

        const isHero = Number(m.unit && m.unit.type) === 1;
        const isActive = Number(m.status) !== 2 && Number(m.status) !== 3;
        if (isHero && isActive) {
          topHeroes.push({
            _id: m._id,
            name: m.name,
            wealth: m.wealth,
            roster: {
              _id: r._id,
              name: r.name
            },
            playerDisplay: r.playerDisplay
          });
        }
      }
    }

    rosters.sort((a, b) => (b.wealth?.rating || 0) - (a.wealth?.rating || 0));
    topHeroes.sort((a, b) => (b.wealth?.rating || 0) - (a.wealth?.rating || 0));

    res.render('campaign', { campaign: result, rostersList, rosters, topHeroes: topHeroes.slice(0, 10), isCreator });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/campaign/:id', async (req, res) => {
  try {
    const campaignId = req.params.id;
    const result = await campaign.getCampaignById(campaignId);
    if (!result) return res.status(404).json({ error: 'Campaign not found' });

    const authEnabled = req.app.locals.authEnabled;
    const currentPlayerId = req.currentPlayer ? String(req.currentPlayer._id) : null;
    const creatorId = result.creator ? String(result.creator) : null;
    const isCreator = !authEnabled || (!!currentPlayerId && currentPlayerId === creatorId);
    if (!isCreator) return res.status(403).json({ error: 'Only the campaign creator can add rosters.' });

    const rosterData = req.body || {};
    campaign.addRosterToCampaign(campaignId, rosterData.roster).then((rosterId) => {
      res.status(200).json({ rosterId });
    }).catch(err => {
      res.status(500).json({ error: err.message });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/campaign/:id/roster/:rosterId', async (req, res) => {
  try {
    const result = await campaign.getCampaignById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Campaign not found' });

    const authEnabled = req.app.locals.authEnabled;
    const currentPlayerId = req.currentPlayer ? String(req.currentPlayer._id) : null;
    const creatorId = result.creator ? String(result.creator) : null;
    const isCreator = !authEnabled || (!!currentPlayerId && currentPlayerId === creatorId);
    if (!isCreator) return res.status(403).json({ error: 'Only the campaign creator can remove rosters.' });

    await campaign.removeRosterFromCampaign(req.params.id, req.params.rosterId);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/campaign/:id/settings', async (req, res) => {
  try {
    const result = await campaign.getCampaignById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Campaign not found' });

    const authEnabled = req.app.locals.authEnabled;
    const currentPlayerId = req.currentPlayer ? String(req.currentPlayer._id) : null;
    const creatorId = result.creator ? String(result.creator) : null;
    const isCreator = !authEnabled || (!!currentPlayerId && currentPlayerId === creatorId);
    if (!isCreator) return res.status(403).json({ error: 'Only the campaign creator can edit settings.' });

    const body = req.body || {};
    const patch = {};
    if (body.name) patch.name = body.name;
    if (body.description !== undefined) patch.description = body.description;
    if (['public', 'private'].includes(body.privacy)) patch.privacy = body.privacy;

    await campaign.updateCampaign(req.params.id, patch);
    res.status(200).json({ success: true });
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
    if (req.currentPlayer) {
      data.creator = req.currentPlayer._id;
    }
    const result = await campaign.createCampaign(data);
    res.status(201).redirect(`/campaigns/campaign/${result}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;