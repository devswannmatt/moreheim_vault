const mongoose = require('mongoose');

const COLLECTION = 'trait';

// Mongoose schema for Equipment
const traitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: Number, required: true },
  description: { type: String, default: '' },
  modifier: { type: Boolean, default: false }
}, { timestamps: true, collection: COLLECTION });

const Trait = mongoose.models.Trait || mongoose.model('Trait', traitSchema);
function createTrait(data) {
  if (!data) return Promise.reject(new Error('No data provided for creating trait'));
  return Trait.create(data).then(created => created._id);
}

function getTraitById(id) {
  return Trait.findById(id).lean().exec();
}

function updateTrait(id, patch = {}) {
  patch.updatedAt = new Date();
  return Trait.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean().exec();
}

function findTraits(filter = {}, options = {}) {
  return Trait.find(filter, null, options).lean().exec();
}

module.exports = { createTrait, getTraitById, updateTrait, findTraits, COLLECTION };