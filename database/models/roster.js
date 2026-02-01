const mongoose = require('mongoose');
const { getDb } = require('../db');

const COLLECTION = 'rosters';

// Mongoose schema for Roster
const rosterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  warband: { type: mongoose.Schema.Types.ObjectId, ref: 'Warband', required: true },
  rating: { type: Number, default: 0 },
  gold: { type: Number, default: 500 }
}, { timestamps: true, collection: COLLECTION });

const Roster = mongoose.models.Roster || mongoose.model('Roster', rosterSchema);

function createRoster(data) {
  if (!data) return Promise.reject(new Error('No data provided for creating roster'));
  return Roster.create(data).then(created => created._id);
}

function getRosterById(id) {
  // populate player details when fetching a single roster
  return Roster.findById(id).populate('player').lean().exec();
}

function updateRoster(id, patch = {}) {
  patch.updatedAt = new Date();
  return Roster.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean().exec();
}

function findRosters(filter = {}, options = {}) {
  // populate player details for listing
  return Roster.find(filter, null, options).populate('player').lean().exec();
}

function deleteRoster(id) {
  return Roster.findByIdAndDelete(id).lean().exec();
}

module.exports = { createRoster, getRosterById, updateRoster, findRosters, deleteRoster, COLLECTION };