const mongoose = require('mongoose');

const COLLECTION = 'effects';

// Mongoose schema for Effect
const effectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  duration: { type: Number, required: true },
  icon: { type: String, default: '' },
  description: { type: String, default: '' }
}, { timestamps: true, collection: COLLECTION });

const Effect = mongoose.models.Effect || mongoose.model('Effect', effectSchema);

function createEffect(data) {
  if (!data) return Promise.reject(new Error('No data provided for creating effect'));
  return Effect.create(data).then(created => created._id);
}

function getEffectById(id) {
  return Effect.findById(id)
    .lean()
    .exec();
}

function updateEffect(id, patch = {}) {
  patch.updatedAt = new Date();
  return Effect.findByIdAndUpdate(id, { $set: patch }, { new: true })
    .lean()
    .exec();
}

function findEffects(filter = {}, options = {}) {
  return Effect.find(filter, null, options)
    .lean()
    .exec();
}

function deleteEffect(id) {
  return Effect.findByIdAndDelete(id).exec();
}

module.exports = { createEffect, getEffectById, updateEffect, findEffects, deleteEffect, COLLECTION };