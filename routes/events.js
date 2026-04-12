var router = require('express').Router();
const event = require('../database/models/event');
const roster = require('../database/models/roster');
const member = require('../database/models/member');
const campaign = require('../database/models/campaign');
const trait = require('../database/models/trait');
const auth = require('../system/auth');
const calc = require('../js/calc');

async function playerOwnsRoster(req, rosterId) {
  const r = await roster.getRosterById(rosterId);
  if (!r) return false;
  const ownerId = (r.player && r.player._id) ? r.player._id : r.player;
  return String(req.currentPlayer._id) === String(ownerId);
}

async function playerOwnsMember(req, memberId) {
  const m = await member.getMemberById(memberId);
  if (!m) return false;
  const rosterId = (m.roster && m.roster._id) ? m.roster._id : m.roster;
  return playerOwnsRoster(req, rosterId);
}

async function assertOwnedEvent(req, res, eventId) {
  if (!auth.isAuthEnabledForRequest(req)) return true;
  if (!req.currentPlayer) {
    res.status(401).json({ error: 'Authentication required' });
    return false;
  }
  const events = await event.findEvents({ _id: eventId });
  const targetEvent = events[0];
  if (!targetEvent) {
    res.status(404).json({ error: 'Event not found' });
    return false;
  }
  for (const entity of (targetEvent.entities || [])) {
    if (entity.kind === 'Roster' && !(await playerOwnsRoster(req, entity.id && entity.id._id ? entity.id._id : entity.id))) {
      res.status(403).json({ error: 'You can only modify events attached to your own rosters or members.' });
      return false;
    }
    if (entity.kind === 'Member' && !(await playerOwnsMember(req, entity.id && entity.id._id ? entity.id._id : entity.id))) {
      res.status(403).json({ error: 'You can only modify events attached to your own rosters or members.' });
      return false;
    }
    if (entity.kind === 'Campaign') {
      res.status(403).json({ error: 'Campaign events are not editable through player ownership.' });
      return false;
    }
  }
  return true;
}

router.get('/', async (req, res) => {
  console.log("Rendering events view");
  try {
    const events = await event.findEvents();

    // fetch rosters, members and campaigns in parallel and build an entities list
    const [rosters, members, campaigns] = await Promise.all([
      roster.findRosters(),
      member.findMembers(),
      campaign.findCampaigns()
    ]);

    const entities = [];
    rosters.forEach(r => entities.push({ _id: r._id, name: r.name, type: 'Roster' }));
    members.forEach(m => entities.push({ _id: m._id, name: m.name, type: 'Member' }));
    campaigns.forEach(c => entities.push({ _id: c._id, name: c.name, type: 'Campaign' }));

    res.render('events', { events: events, entities: entities, eventTypes: calc.fetchEventTypes() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/event/create', async (req, res) => {
  console.log("Rendering create event view");
  const rosters = await roster.findRosters();
  try {
    res.render('event_create', { rosters: rosters } );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/event/:id', async (req, res) => {
  console.log(`Fetching event with ID: ${req.params.id}`);
  try {
    const result = await event.getEventById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Event not found' });
    
    let canEdit = false;
    if (auth.isAuthEnabledForRequest(req) && req.currentPlayer) {
      canEdit = await assertOwnedEvent(req, res, result._id);
    }

    res.render('event', { event: result, canEdit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/event/:id', auth.requireAuthenticated, async (req, res) => {
  console.log(`Updating event with ID: ${req.params.id} with data:`, req.body);
  try {
    if (!(await assertOwnedEvent(req, res, req.params.id))) return;
    event.updateEvent(req.params.id, req.body).then(updatedEvent => {
      if (!updatedEvent) return res.status(404).json({ error: 'Event not found' });
      res.status(200).json(updatedEvent);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/event/:id', auth.requireAuthenticated, async (req, res) => {
  console.log(`Deleting event with ID: ${req.params.id}`);
  try {
    if (!(await assertOwnedEvent(req, res, req.params.id))) return;
    const deletedEvent = await event.deleteEvent(req.params.id);
    if (!deletedEvent) return res.status(404).json({ error: 'Event not found' });
    res.status(200).json({ message: 'Event deleted successfully', event: deletedEvent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/json', async (req, res) => {
  console.log("Fetching events in JSON format");
  try {
    const events = await event.findEvents();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message, info: "Error fetching events" });
  }
});

router.post('/create', auth.requireAuthenticated, async (req, res) => {
  try {
    console.log("Creating new event with data:", req.body);
    if (req.body.entity) {
      const [entityId, entityKind] = req.body.entity.split('/');
      req.body.entities = [{ id: entityId, kind: entityKind }];
      delete req.body.entity;
    }

    if (auth.isAuthEnabledForRequest(req)) {
      const entity = (req.body.entities || [])[0];
      if (!entity) return res.status(400).json({ error: 'An event entity is required.' });
      if (entity.kind === 'Roster' && !(await playerOwnsRoster(req, entity.id))) {
        return res.status(403).json({ error: 'You can only create events for your own rosters.' });
      }
      if (entity.kind === 'Member' && !(await playerOwnsMember(req, entity.id))) {
        return res.status(403).json({ error: 'You can only create events for your own members.' });
      }
      if (entity.kind === 'Campaign') {
        return res.status(403).json({ error: 'Campaign events are not editable through player ownership.' });
      }
    }

    if (req.body.type) {
      req.body.name = await generateEventName(req.body.type, req.body);
      console.log("Generated event name:", req.body.name);
    }

    const result = await event.createEvent(req.body);
    res.status(201).json({ success: 'Event Created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function generateEventName(type, body) {
  console.log(body);
  switch (parseInt(type)) {
    case 1:
      var selected = '';
      if (body.advance_linked) {
        var adv = calc.advanceTypes[1] && calc.advanceTypes[1][body.advance];
        var sub = adv && adv.subType && adv.subType[body.advance_linked];
        console.log("Advance details:", adv, sub);
        if (adv.value === '2-5' || adv.value ==='10-12') {
          try {
            const tr = await trait.getTraitById(body.advance_linked);
            console.log("Fetched trait for event name:", tr);
            selected = `${calc.traitTypes[tr.type]} Skill: ${tr.name}`;
          } catch (e) {
            selected = 'Unknown Skill';
          }
        } else if (sub && typeof sub === 'object' && sub.label) {
          selected = sub.label;
        }
      }

      return `Selected ${selected}`;
    default:
      return 'Event';
  }
}

module.exports = router;