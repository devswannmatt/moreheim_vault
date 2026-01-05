const mongoose = require('mongoose');

const COLLECTION = 'warbands';

// Mongoose schema for Warband
const warbandSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
}, { timestamps: true, collection: COLLECTION });

const Warband = mongoose.models.Warband || mongoose.model('Warband', warbandSchema);

function createWarband(data) {
  if (!data) return Promise.reject(new Error('No data provided for creating warband'));
  return Warband.create(data).then(created => created._id);
}

function getWarbandById(id) {
  return Warband.findById(id).lean().exec();
}

function updateWarband(id, patch = {}) {
  patch.updatedAt = new Date();
  return Warband.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean().exec();
}

function findWarbands(filter = {}, options = {}) {
  return Warband.find(filter, null, options).lean().exec();
}

module.exports = { createWarband, getWarbandById, updateWarband, findWarbands, COLLECTION };