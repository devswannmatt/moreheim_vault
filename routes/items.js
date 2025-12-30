var router = require('express').Router();
const { getDb } = require('../database/db');

// GET /items - Retrieve all items
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const items = await db.collection('items').find({}).toArray();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const data = req.body || {};
    const result = await db.collection('items').insertOne({ ...data, createdAt: new Date() });
    res.status(201).json({ insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;