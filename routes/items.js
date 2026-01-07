var router = require('express').Router();
const item = require('../database/models/item');
const trait = require('../database/models/trait');

router.get('/', async (req, res) => {
  console.log("Rendering items view");
  try {
    const items = await item.findItems();
    res.render('items', { items: items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/item/create', async (req, res) => {
  console.log("Rendering create item view");
  const rosters = await roster.findRosters();
  try {
    res.render('item_create', { rosters: rosters } );
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/item/:id', async (req, res) => {
  console.log(`Fetching item with ID: ${req.params.id}`);
  try {
    const result = await item.getItemById(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.render('item', { item: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/item/:id', async (req, res) => {
  console.log(`Updating item with ID: ${req.params.id} with data:`, req.body);
  try {
    item.updateItem(req.params.id, req.body).then(updatedItem => {
      if (!updatedItem) {
        return res.status(404).json({ error: 'Item not found' });
      }
      res.status(200).json(updatedItem);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/item/:id/traits', async (req, res) => {
  console.log(`Fetching item with ID: ${req.params.id}`);
  try {
    const result = await item.getItemById(req.params.id);
    const traits = await trait.findTraits();

    if (!result) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.render('item_traits', { item: result, traits: traits, existing: result.traits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/item/:id/traits', async (req, res) => {
  console.log(`Updating item traits with ID: ${req.params.id} with data:`, req.body);
  try {
    let traits = req.body.items || [];
    if (!Array.isArray(traits)) traits = [traits];
    traits = traits.filter(function (v) { return v !== undefined && v !== null && String(v).length > 0; });

    item.updateItem(req.params.id, { traits: traits }).then(updatedItem => {
      if (!updatedItem) {
        return res.status(404).json({ error: 'Item not found' });
      }
      res.status(200).json(updatedItem);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/json', async (req, res) => {
  console.log("Fetching items in JSON format");
  try {
    const items = await item.findItems();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message, info: "Error fetching items" });
  }
});

router.post('/create', async (req, res) => {
  try {
    console.log("Creating new item with data:", req.body);
    item.createItem(req.body).then(result => {
      res.status(201).redirect(`/items/item/${result}`);
    }).catch(err => {
      res.status(500).json({ error: err.message });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;