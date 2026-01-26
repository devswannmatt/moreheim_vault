const mongoose = require('mongoose');

const COLLECTION = 'event';

// Mongoose schema for Equipment
const eventSchema = new mongoose.Schema({
  type: { type: Number, required: true },
  entities: [{
    id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'entities.kind' },
    kind: { type: String, required: true, enum: ['Roster','Member','Campaign'] }
  }],
  name: { type: String, required: true },
  description: { type: String, default: '' },
  wealth: { 
    gold: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    rating: { type: Number, default: 0 }
  },
  advance: { type: String, default: '' },
  advance_linked: { type: String, default: '' },
  injury: { type: Number, default: 0 }
}, { timestamps: true, collection: COLLECTION });

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
function createEvent(data) {
  if (!data) return Promise.reject(new Error('No data provided for creating event'));
  return Event.create(data).then(created => created._id);
}

function getEventById(id) {
  // populate the referenced docs
  Event.findById(id)
    .populate('entities.id')
    .then(ev => {
      // ev.entities[i].id is populated document (Roster/Member/Campaign)
    });
}

function updateEvent(id, patch = {}) {
  patch.updatedAt = new Date();
  return Event.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean().exec();
}

function findEvents(filter = {}, options = {}) {
  return Event.find(filter, null, options).populate('entities.id').lean().exec();
}

function deleteEvent(id) {
  return Event.findByIdAndDelete(id).lean().exec();
}

module.exports = { createEvent, getEventById, updateEvent, findEvents, deleteEvent, COLLECTION };