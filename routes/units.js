var router = require('express').Router();
const unit = require('../database/models/unit');
const warband = require('../database/models/warband');

router.get('/', async (req, res) => {
  console.log("Rendering units view");
  const warbands = await warband.findWarbands();
  try {
    const items = await unit.findUnits();
    res.render('units', { units: items, warbands: warbands });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/unit/create', async (req, res) => {
  console.log("Rendering create unit view");
  const rosters = await roster.findRosters();
  try {
    res.render('unit_create', { rosters: rosters } );
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/unit/:id', async (req, res) => {
  console.log(`Fetching unit with ID: ${req.params.id}`);
  try {
    const item = await unit.getUnitById(req.params.id);
    const warbands = await warband.findWarbands();
    if (!item) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    const unitTypes = [
      { value: '1', label: 'Hero' },
      { value: '2', label: 'Henchman' }
    ]

    res.render('unit', { unit: item, warbands: warbands, unitTypes: unitTypes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/unit/:id', async (req, res) => {
  console.log(`Updating unit with ID: ${req.params.id} with data:`, req.body);
  try {
    unit.updateUnit(req.params.id, req.body).then(updatedUnit => {
      if (!updatedUnit) {
        return res.status(404).json({ error: 'Unit not found' });
      }
      console.log('Updated unit:', updatedUnit);
      res.status(200).json(updatedUnit);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/json', async (req, res) => {
  console.log("Fetching units in JSON format");
  try {
    const items = await unit.findUnits();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message, info: "Error fetching units" });
  }
});

router.post('/create', async (req, res) => {
  try {
    console.log("Creating new unit with data:", req.body);
    unit.createUnit(req.body).then(result => {
      res.status(201).redirect(`/units/unit/${result}`);
    }).catch(err => {
      res.status(500).json({ error: err.message });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;