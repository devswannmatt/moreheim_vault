var router = require('express').Router();
const unit = require('../database/models/unit');
const item = require('../database/models/item');
const warband = require('../database/models/warband');
const trait = require('../database/models/trait');

function getSkillTypeOptions() {
  return [
    { _id: 4, name: 'Skill: Combat' },
    { _id: 5, name: 'Skill: Shooting' },
    { _id: 6, name: 'Skill: Academic' },
    { _id: 7, name: 'Skill: Strength' },
    { _id: 8, name: 'Skill: Speed' },
    { _id: 9, name: 'Skill: Special' }
  ];
}

function normalizeUnitLimits(body) {
  const max = parseInt(body.maxCount, 10);
  const selectedSkills = body.skillAccess || body['skillAccess[]'];
  const selectedItems = body.items || body['items[]'];
  const skillAccess = selectedSkills
    ? (Array.isArray(selectedSkills) ? selectedSkills : [selectedSkills])
        .map(s => parseInt(s, 10))
        .filter(n => !Number.isNaN(n) && n >= 4 && n <= 9)
    : [];
  const items = selectedItems
    ? (Array.isArray(selectedItems) ? selectedItems : [selectedItems])
        .filter(v => v !== undefined && v !== null && String(v).length > 0)
    : [];

  return {
    ...body,
    isUnique: body.isUnique === 'on' || body.isUnique === 'true' || body.isUnique === true,
    maxCount: Number.isNaN(max) ? 0 : Math.max(0, max),
    skillAccess,
    items
  };
}

router.get('/', async (req, res) => {
  console.log("Rendering units view");
  try {
    const items = await unit.findUnits();
    res.render('units', { units: items, skillTypeList: getSkillTypeOptions() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/unit/create', async (req, res) => {
  console.log("Rendering create unit view");
  try {
    res.render('unit_create', { skillTypeList: getSkillTypeOptions() } );
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/unit/:id', async (req, res) => {
  console.log(`Fetching unit with ID: ${req.params.id}`);
  try {
    const unitRecord = await unit.getUnitById(req.params.id);
    const itemList = (await item.findItems()).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    const copySourceUnits = (await unit.findUnits())
      .filter(u => String(u._id) !== String(req.params.id))
      .filter(u => String(u && u.name ? u.name : '').trim().length > 0)
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    if (!unitRecord) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    res.render('unit', { unit: unitRecord, skillTypeList: getSkillTypeOptions(), itemList, copySourceUnits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/unit/:id/items/copy', async (req, res) => {
  console.log(`Copying unit items into unit with ID: ${req.params.id}`, req.body);
  try {
    const sourceUnitId = req.body.sourceUnitId || req.body.sourceUnit;
    if (!sourceUnitId) {
      return res.status(400).json({ error: 'A source unit is required.' });
    }
    if (String(sourceUnitId) === String(req.params.id)) {
      return res.status(400).json({ error: 'Cannot copy item restrictions from the same unit.' });
    }

    const targetUnit = await unit.getUnitById(req.params.id);
    if (!targetUnit) {
      return res.status(404).json({ error: 'Target unit not found.' });
    }

    const sourceUnit = await unit.getUnitById(sourceUnitId);
    if (!sourceUnit) {
      return res.status(404).json({ error: 'Source unit not found.' });
    }

    const sourceItems = Array.isArray(sourceUnit.items)
      ? sourceUnit.items.map(i => (i && i._id ? i._id : i)).filter(Boolean)
      : [];

    const updatedUnit = await unit.updateUnit(req.params.id, { items: sourceItems });
    if (!updatedUnit) {
      return res.status(404).json({ error: 'Unit not found.' });
    }

    return res.status(200).json({ success: true, copiedCount: sourceItems.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/unit/:id', async (req, res) => {
  console.log(`Updating unit with ID: ${req.params.id} with data:`, req.body);
  try {
    const patch = normalizeUnitLimits(req.body);
    unit.updateUnit(req.params.id, patch).then(updatedUnit => {
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

router.get('/unit/:id/traits', async (req, res) => {
  console.log(`Fetching unit with ID: ${req.params.id}`);
  try {
    const result = await unit.getUnitById(req.params.id);
    const traits = await trait.findTraits();
    if (!result) return res.status(404).json({ error: 'Unit not found' });

    res.render('unit_traits', { unit: result, traits: traits, existing: result.traits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/unit/:id/traits', async (req, res) => {
  console.log(`Updating unit traits with ID: ${req.params.id} with data:`, req.body);
  try {
    let traits = req.body.items || [];
    if (!Array.isArray(traits)) traits = [traits];
    traits = traits.filter(function (v) { return v !== undefined && v !== null && String(v).length > 0; });

    unit.updateUnit(req.params.id, { traits: traits }).then(updatedUnit => {
      if (!updatedUnit) {
        return res.status(404).json({ error: 'Unit not found' });
      }
      res.status(200).json(updatedUnit);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/json', async (req, res) => {
  console.log("Fetching units in JSON format");
  try {
    const units = await unit.findUnits();
    res.json(units);
  } catch (err) {
    res.status(500).json({ error: err.message, info: "Error fetching units" });
  }
});

router.post('/create', async (req, res) => {
  try {
    console.log("Creating new unit with data:", req.body);
    const payload = normalizeUnitLimits(req.body);
    unit.createUnit(payload).then(result => {
      res.status(201).redirect(`/units/unit/${result}`);
    }).catch(err => {
      res.status(500).json({ error: err.message });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;