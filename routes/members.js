var router = require('express').Router();
const warband = require('../database/models/warband');

router.get('/', async (req, res) => {
  console.log("Rendering members view");
  try {
    const items = await warband.findWarbands();
    res.render('members', { warbands: items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/member/:id', async (req, res) => {
  console.log(`Fetching member with ID: ${req.params.id}`);
  try {
    const item = await warband.getMemberById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.render('member', { member: item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/member/:id', async (req, res) => {
  console.log(`Updating member with ID: ${req.params.id} with data:`, req.body);
  try {
    warband.updateMember(req.params.id, req.body).then(updatedMember => {
      if (!updatedMember) {
        return res.status(404).json({ error: 'Member not found' });
      }
      res.status(200).json(updatedMember);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/json', async (req, res) => {
  console.log("Fetching members in JSON format");
  try {
    const items = await warband.findMembers();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message, info: "Error fetching members" });
  }
});

router.post('/create', async (req, res) => {
  try {
    console.log("Creating new member with data:", req.body);
    warband.createMember(req.body).then(result => {
      res.status(201).redirect(`/members/member/${result}`);
    }).catch(err => {
      res.status(500).json({ error: err.message });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;