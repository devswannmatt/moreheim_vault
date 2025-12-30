var router = require('express').Router();
const { getDb } = require('../database/db');

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const items = await db.collection('campaigns').find({}).toArray();4
    res.render('campaigns', { campaigns: items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const item = await db.collection('campaigns').findOne({ _id: new ObjectId(req.params.id) });
    if (!item) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.render('campaign', { campaign: item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/json', async (req, res) => {
  try {
    const db = getDb();
    const items = await db.collection('campaigns').find({}).toArray();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/create', async (req, res) => {
  try {
    const db = getDb();
    const data = req.body || {};
    const result = await db.collection('campaigns').insertOne({ ...data, createdAt: new Date() });
    res.status(201).json({ insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;