const mongoose = require('mongoose');

const COLLECTION = 'members';

// Mongoose schema for Member
const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  roster: { type: mongoose.Schema.Types.ObjectId, ref: 'Roster', required: true },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
  qty: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  gold: { type: Number, default: 0 },
  traits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trait' }],
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }]
}, { timestamps: true, collection: COLLECTION });

const Member = mongoose.models.Member || mongoose.model('Member', memberSchema);

function createMember(data) {
  if (!data) return Promise.reject(new Error('No data provided for creating member'));
  return Member.create(data).then(created => created._id);
}

function getMemberById(id) {
  return Member.findById(id)
    .populate('roster')
    .populate('unit')
    .populate({ path: 'unit', populate: { path: 'traits' } })
    .populate({ path: 'items', populate: { path: 'traits' } })
    .lean()
    .exec();
}

function updateMember(id, patch = {}) {
  patch.updatedAt = new Date();
  return Member.findByIdAndUpdate(id, { $set: patch }, { new: true })
    .populate('roster')
    .populate('unit')
    .populate({ path: 'items', populate: { path: 'traits' } })
    .lean()
    .exec();
}

function findMembers(filter = {}, options = {}) {
  return Member.find(filter, null, options)
    .populate('roster')
    .populate('unit')
    .populate({ path: 'items', populate: { path: 'traits' } })
    .lean()
    .exec();
}

function deleteMember(id) {
  return Member.findByIdAndDelete(id).exec();
}

module.exports = { createMember, getMemberById, updateMember, findMembers, deleteMember, COLLECTION };