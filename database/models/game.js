const mongoose = require('mongoose');

const COLLECTION = 'games';

const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
  rosters: { type: [mongoose.Schema.Types.ObjectId], ref: 'Roster', default: [] }
}, { timestamps: true, collection: COLLECTION });

const Game = mongoose.models.Game || mongoose.model('Game', gameSchema);

function createGame(data = {}) {
  const doc = {
    name: data.name || 'Untitled Game',
    description: data.description || '',
    campaign: data.campaign || null,
    rosters: Array.isArray(data.rosters) ? data.rosters : []
  };
  return Game.create(doc).then(created => created._id);
}

function getGameById(id) {
  return Game.findById(id)
    .populate('campaign')
    .populate({ path: 'rosters', populate: ['player', 'warband'] })
    .lean()
    .exec();
}

function updateGame(id, patch = {}) {
  patch.updatedAt = new Date();
  return Game.findByIdAndUpdate(id, { $set: patch }, { new: true })
    .populate('campaign')
    .populate({ path: 'rosters', populate: ['player', 'warband'] })
    .lean()
    .exec();
}

function findGames(filter = {}, options = {}) {
  return Game.find(filter, null, options)
    .populate('campaign')
    .populate({ path: 'rosters', populate: ['player', 'warband'] })
    .lean()
    .exec();
}

function deleteGame(id) {
  return Game.findByIdAndDelete(id).lean().exec();
}

module.exports = {
  createGame,
  getGameById,
  updateGame,
  findGames,
  deleteGame,
  COLLECTION
};