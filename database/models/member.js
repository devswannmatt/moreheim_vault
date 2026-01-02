const mongoose = require('mongoose');
const { getDb } = require('../db');

const COLLECTION = 'members';

// Mongoose schema for Member
const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  warband: { type: mongoose.Schema.Types.ObjectId, ref: 'Warband', required: true },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
  experience: { type: Number, default: 0 },
  gold: { type: Number, default: 0 }
}, { timestamps: true, collection: COLLECTION });

const Member = mongoose.models.Member || mongoose.model('Member', memberSchema);

function createMember(data) {
  if (!data) return Promise.reject(new Error('No data provided for creating member'));
  return Member.create(data).then(created => created._id);
}

function getMemberById(id) {
  return Member.findById(id).populate('player').lean().exec();
}

function updateMember(id, patch = {}) {
  patch.updatedAt = new Date();
  return Member.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean().exec();
}

function findMembers(filter = {}, options = {}) {
  return Member.find(filter, null, options).populate('player').lean().exec();
}

module.exports = { createMember, getMemberById, updateMember, findMembers, COLLECTION };