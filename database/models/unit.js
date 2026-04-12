const mongoose = require('mongoose');

const COLLECTION = 'units';

// Mongoose schema for Unit
const unitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: Number, required: true }, // 1 = Hero, 2 = Henchman
  isUnique: { type: Boolean, default: false },
  maxCount: { type: Number, default: 0 },
  description: { type: String, default: '' },
  experience: { type: Number, default: 0 },
  gold: { type: Number, default: 0 },
  m: { type: Number, default: 0 },
  ws: { type: Number, default: 0 },
  bs: { type: Number, default: 0 },
  s: { type: Number, default: 0 },
  t: { type: Number, default: 0 },
  w: { type: Number, default: 0 },
  i: { type: Number, default: 0 },
  a: { type: Number, default: 0 },
  ld: { type: Number, default: 0 },
  skillAccess: [{ type: Number }],
  traits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trait' }],
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }]
}, { timestamps: true, collection: COLLECTION });

const Unit = mongoose.models.Unit || mongoose.model('Unit', unitSchema);

function createUnit(data) {
  if (!data) return Promise.reject(new Error('No data provided for creating unit'));
  return Unit.create(data).then(created => created._id);
}

function getUnitById(id) {
  return Unit.findById(id)
    .populate('traits')
    .populate({ path: 'items', populate: { path: 'traits' } })
    .lean()
    .exec();
}

function updateUnit(id, patch = {}) {
  patch.updatedAt = new Date();
  return Unit.findByIdAndUpdate(id, { $set: patch }, { new: true })
    .populate('traits')
    .populate({ path: 'items', populate: { path: 'traits' } })
    .lean()
    .exec();
}

function findUnits(filter = {}, options = {}) {
  return Unit.find(filter, null, options)
    .populate('traits')
    .populate({ path: 'items', populate: { path: 'traits' } })
    .lean()
    .exec();
}

module.exports = { createUnit, getUnitById, updateUnit, findUnits, COLLECTION };