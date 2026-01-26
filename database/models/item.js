const mongoose = require('mongoose');

const COLLECTION = 'item';

// Mongoose schema for Equipment
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: Number, required: true },
  description: { type: String, default: '' },
  gold: { type: Number, default: 0 },
  range: { type: String, default: '' },
  strength: { type: String, default: '' },
  slot: { type: Number, default: 0 },
  traits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trait' }]
}, { timestamps: true, collection: COLLECTION });

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);
function createItem(data) {
  if (!data) return Promise.reject(new Error('No data provided for creating item'));
  return Item.create(data).then(created => created._id);
}

function getItemById(id) {
  return Item.findById(id).populate('traits').lean().exec();
}

function updateItem(id, patch = {}) {
  patch.updatedAt = new Date();
  return Item.findByIdAndUpdate(id, { $set: patch }, { new: true }).populate('traits').lean().exec();
}

function findItems(filter = {}, options = {}) {
  return Item.find(filter, null, options).populate('traits').lean().exec();
}

module.exports = { createItem, getItemById, updateItem, findItems, COLLECTION };