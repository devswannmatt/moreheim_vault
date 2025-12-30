const mongoose = require('mongoose');
const { getDb } = require('../db');

const COLLECTION = 'warbands';

// Mongoose schema for Warband
const warbandSchema = new mongoose.Schema({
  name: { type: String, required: true },
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true }
}, { timestamps: true, collection: COLLECTION });

const Warband = mongoose.models.Warband || mongoose.model('Warband', warbandSchema);

function createWarband(data) {
    if (!data) return Promise.reject(new Error('No data provided for creating warband'));
    const doc = {
      name: data.name,
      player: data.player
    };
    return Warband.create(doc).then(created => created._id);
}

function getWarbandById(id) {
  // populate player details when fetching a single warband
  return Warband.findById(id).populate('player').lean().exec();
}

function updateWarband(id, patch = {}) {
  patch.updatedAt = new Date();
  return Warband.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean().exec();
}

function findWarbands(filter = {}, options = {}) {
  // populate player details for listing
  return Warband.find(filter, null, options).populate('player').lean().exec();
}

module.exports = { createWarband, getWarbandById, updateWarband, findWarbands, COLLECTION };