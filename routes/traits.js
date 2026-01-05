var router = require('express').Router();
const trait = require('../database/models/trait');

router.get('/', async (req, res) => {
  console.log("Rendering traits view");
  try {
    const traits = await trait.findTraits();
    res.render('traits', { traits: traits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/trait/create', async (req, res) => {
  console.log("Rendering create trait view");
const rosters = await roster.findRosters();
  try {
    res.render('trait_create', { rosters: rosters } );
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/trait/:id', async (req, res) => {
  console.log(`Fetching trait with ID: ${req.params.id}`);
  try {
    const result = await trait.getTraitById(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Trait not found' });
    }
    res.render('trait', { trait: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/trait/:id', async (req, res) => {
  console.log(`Updating trait with ID: ${req.params.id} with data:`, req.body);
  try {
    trait.updateTrait(req.params.id, req.body).then(updatedTrait => {
      if (!updatedTrait) {
        return res.status(404).json({ error: 'Trait not found' });
      }
      res.status(200).json(updatedTrait);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/json', async (req, res) => {
  console.log("Fetching traits in JSON format");
  try {
    const traits = await trait.findTraits();
    res.json(traits);
  } catch (err) {
    res.status(500).json({ error: err.message, info: "Error fetching traits" });
  }
});

router.post('/create', async (req, res) => {
  try {
    console.log("Creating new trait with data:", req.body);
    trait.createTrait(req.body).then(result => {
      res.status(201).redirect(`/traits/trait/${result}`);
    }).catch(err => {
      res.status(500).json({ error: err.message });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;