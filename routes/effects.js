var router = require('express').Router();
const effect = require('../database/models/effect');
const member = require('../database/models/member');
const roster = require('../database/models/roster');
const auth = require('../system/auth');

function renderView(req, res, view, data) {
  const isModal = req.query && (req.query.modal === '1' || req.query.modal === 'true');
  return res.render(view, Object.assign({}, data, {
    isModal: isModal,
    layout: isModal ? false : undefined
  }));
}

function isOwnedByCurrentPlayer(req, playerId) {
  return auth.canManagePlayer(req, playerId);
}

async function loadOwnedMember(req, res, memberId) {
  const ownedMember = await member.getMemberById(memberId);
  if (!ownedMember) {
    res.status(404).json({ error: 'Member not found' });
    return null;
  }

  const ownedRoster = await roster.getRosterById((ownedMember.roster && ownedMember.roster._id) ? ownedMember.roster._id : ownedMember.roster);
  if (!ownedRoster) {
    res.status(404).json({ error: 'Roster not found' });
    return null;
  }

  if (!isOwnedByCurrentPlayer(req, ownedRoster.player && ownedRoster.player._id ? ownedRoster.player._id : ownedRoster.player)) {
    res.status(403).json({ error: 'You can only modify members in your own rosters.' });
    return null;
  }

  return ownedMember;
}

async function loadOwnedRoster(req, res, rosterId) {
  const ownedRoster = await roster.getRosterById(rosterId);
  if (!ownedRoster) {
    res.status(404).json({ error: 'Roster not found' });
    return null;
  }

  if (!isOwnedByCurrentPlayer(req, ownedRoster.player && ownedRoster.player._id ? ownedRoster.player._id : ownedRoster.player)) {
    res.status(403).json({ error: 'You can only modify your own rosters.' });
    return null;
  }

  return ownedRoster;
}

router.get('/', async (req, res) => {
  try {
    const effects = await effect.findEffects({}, { sort: { name: 1 } });
    res.render('effects', { effects: effects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/create', auth.requireAuthenticated, async (req, res) => {
  try {
    const payload = {
      name: String(req.body.name || '').trim(),
      duration: Number(req.body.duration || 1),
      icon: String(req.body.icon || '').trim(),
      description: String(req.body.description || '').trim()
    };

    if (!payload.name) return res.status(400).json({ error: 'Name is required.' });
    if (!Number.isFinite(payload.duration) || payload.duration < 1) {
      return res.status(400).json({ error: 'Duration must be a positive number.' });
    }

    await effect.createEffect(payload);
    res.status(201).redirect('/effects');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/effect/:id', async (req, res) => {
  try {
    const result = await effect.getEffectById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Effect not found' });
    res.render('effect', { effect: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/effect/:id', auth.requireAuthenticated, async (req, res) => {
  try {
    const patch = {
      name: String(req.body.name || '').trim(),
      duration: Number(req.body.duration || 1),
      icon: String(req.body.icon || '').trim(),
      description: String(req.body.description || '').trim()
    };
    if (!patch.name) return res.status(400).json({ error: 'Name is required.' });
    if (!Number.isFinite(patch.duration) || patch.duration < 1) {
      return res.status(400).json({ error: 'Duration must be a positive number.' });
    }
    const updated = await effect.updateEffect(req.params.id, patch);
    if (!updated) return res.status(404).json({ error: 'Effect not found' });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/effect/:id', auth.requireAuthenticated, async (req, res) => {
  try {
    const result = await effect.deleteEffect(req.params.id);
    if (!result) return res.status(404).json({ error: 'Effect not found' });
    res.status(200).json({ message: 'Effect deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/member/:id', async (req, res) => {
  try {
    const result = await member.getMemberById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Member not found' });

    const effects = await effect.findEffects({}, { sort: { name: 1 } });

    const memberRosterId = (result.roster && result.roster._id) ? result.roster._id : result.roster;
    const memberRoster = await roster.getRosterById(memberRosterId);
    const canEdit = isOwnedByCurrentPlayer(req, memberRoster && memberRoster.player && memberRoster.player._id ? memberRoster.player._id : memberRoster && memberRoster.player);

    renderView(req, res, 'member_effects', {
      member: result,
      effects: effects,
      canEdit: canEdit
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/member/:id/effects', auth.requireAuthenticated, async (req, res) => {
  try {
    const ownedMember = await loadOwnedMember(req, res, req.params.id);
    if (!ownedMember) return;

    let effects = req.body.effects || [];
    if (!Array.isArray(effects)) effects = [effects];
    effects = effects.filter(function (v) { return v !== undefined && v !== null && String(v).length > 0; });

    const updatedMember = await member.updateMember(req.params.id, { effects: effects });
    if (!updatedMember) return res.status(404).json({ error: 'Member not found' });

    res.status(200).json({ success: true, effects: updatedMember.effects || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/roster/:id', async (req, res) => {
  try {
    const result = await roster.getRosterById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Roster not found' });

    const effects = await effect.findEffects({}, { sort: { name: 1 } });
    const canEdit = isOwnedByCurrentPlayer(req, result.player && result.player._id ? result.player._id : result.player);

    renderView(req, res, 'roster_effects', {
      roster: result,
      effects: effects,
      canEdit: canEdit
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/roster/:id/effects', auth.requireAuthenticated, async (req, res) => {
  try {
    const ownedRoster = await loadOwnedRoster(req, res, req.params.id);
    if (!ownedRoster) return;

    let effects = req.body.effects || [];
    if (!Array.isArray(effects)) effects = [effects];
    effects = effects.filter(function (v) { return v !== undefined && v !== null && String(v).length > 0; });

    const updatedRoster = await roster.updateRoster(req.params.id, { effects: effects });
    if (!updatedRoster) return res.status(404).json({ error: 'Roster not found' });

    res.status(200).json({ success: true, effects: updatedRoster.effects || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
