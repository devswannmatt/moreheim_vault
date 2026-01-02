const mongoose = require('mongoose');

const COLLECTION = 'players';

// Mongoose schema for Player
const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  warbands: { type: [mongoose.Schema.Types.ObjectId], default: [] }
}, { timestamps: true, collection: COLLECTION });

const Player = mongoose.models.Player || mongoose.model('Player', playerSchema);

function createPlayer(data) {
    if (!data) return Promise.reject(new Error('No data provided for creating player'));
    const doc = {
        name: data.name,
        meta: data.meta
    };
    return Player.create(doc).then(created => created._id);
}

function getPlayerById(id) {
  return Player.findById(id).lean().exec();
}

function findPlayers(filter = {}, options = {}) {
  return Player.find(filter, null, options).lean().exec();
}

function updatePlayer(id, patch = {}) {
  const _id = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
  patch.updatedAt = new Date();
  return Player.updateOne({ _id }, { $set: patch }).then(() => getPlayerById(_id));
}

module.exports = { createPlayer, getPlayerById, updatePlayer, findPlayers, COLLECTION };
