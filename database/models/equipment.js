const mongoose = require('mongoose');

const COLLECTION = 'equipment';

// Mongoose schema for Equipment
const equipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  gold: { type: Number, default: 0 }
}, { timestamps: true, collection: COLLECTION });

const Equipment = mongoose.models.Equipment || mongoose.model('Equipment', equipmentSchema);

function createEquipment(data) {
  if (!data) return Promise.reject(new Error('No data provided for creating equipment'));
  return Equipment.create(data).then(created => created._id);
}

function getEquipmentById(id) {
  return Equipment.findById(id).lean().exec();
}

function updateEquipment(id, patch = {}) {
  patch.updatedAt = new Date();
  return Equipment.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean().exec();
}

function findEquipment(filter = {}, options = {}) {
  return Equipment.find(filter, null, options).lean().exec();
}

module.exports = { createEquipment, getEquipmentById, updateEquipment, findEquipment, COLLECTION };