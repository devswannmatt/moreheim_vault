const mongoose = require('mongoose');
const player = require('./player');
const roster = require('./roster');

const COLLECTION = 'campaigns';

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  players: { type: [mongoose.Schema.Types.ObjectId], ref: 'Player', default: [] },
  rosters: { type: [mongoose.Schema.Types.ObjectId], ref: 'Roster', default: [] }
}, { timestamps: true, collection: COLLECTION });

const Campaign = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);

function createCampaign(data = {}) {
  const doc = {
    name: data.name || 'Untitled Campaign',
    description: data.description || '',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  return Campaign.create(doc).then(created => created._id);
}

function getCampaignById(id, { populate = false } = {}) {
  const _id = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
  return Campaign.findById(id).lean().exec();
}

function addPlayerToCampaign(campaignId, playerId) {
    return new Promise((resolve, reject) => {
        const campaignObjectId = typeof campaignId === 'string' ? new mongoose.Types.ObjectId(campaignId) : campaignId;
        player.getPlayerById(playerId).then(p => {
            if (!p) return reject(new Error('Player not found'));
            
            Campaign.findById(campaignObjectId).then(c => {
                if (!c) return reject(new Error('Campaign not found'));
                if (Array.isArray(c.players) && c.players.some(existing => existing.toString() === playerId.toString())) {
                    const err = new Error('Player already in campaign');
                    err.status = 400;
                    return reject(err);
                }
                c.players.push(playerId);
                c.updatedAt = new Date();
                return c.save().then(() => playerId);
            }).catch(err => reject(err));
        });
    });
}

function removePlayerFromCampaign(campaignId, playerId) {
  const cId = typeof campaignId === 'string' ? new mongoose.Types.ObjectId(campaignId) : campaignId;
  const pId = typeof playerId === 'string' ? new mongoose.Types.ObjectId(playerId) : playerId;
  return Campaign.updateOne({ _id: cId }, { $pull: { players: pId }, $set: { updatedAt: new Date() } }).then(() => {});
}

function addRosterToCampaign(campaignId, rosterId) {
    return new Promise((resolve, reject) => {
        const campaignObjectId = typeof campaignId === 'string' ? new mongoose.Types.ObjectId(campaignId) : campaignId;
        roster.getRosterById(rosterId).then(r => {
            if (!r) return reject(new Error('Roster not found'));
            
            Campaign.findById(campaignObjectId).then(c => {
                if (!c) return reject(new Error('Campaign not found'));
                if (Array.isArray(c.rosters) && c.rosters.some(existing => existing.toString() === rosterId.toString())) {
                    const err = new Error('Roster already in campaign');
                    err.status = 400;
                    return reject(err);
                }
                c.rosters.push(rosterId);
                c.updatedAt = new Date();
                return c.save().then(() => rosterId);
            }).catch(err => reject(err));
        });
    });
}

function removeRosterFromCampaign(campaignId, rosterId) {
  const cId = typeof campaignId === 'string' ? new mongoose.Types.ObjectId(campaignId) : campaignId;
  const rId = typeof rosterId === 'string' ? new mongoose.Types.ObjectId(rosterId) : rosterId;
  return Campaign.updateOne({ _id: cId }, { $pull: { rosters: rId }, $set: { updatedAt: new Date() } }).then(() => {});
}

function updateCampaign(id, patch = {}) {
  const _id = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
  patch.updatedAt = new Date();
  return Campaign.updateOne({ _id }, { $set: patch }).then(() => getCampaignById(_id));
}

function findCampaigns(filter = {}, options = {}) {
  return Campaign.find(filter, null, options).lean().exec();
}

module.exports = {
  createCampaign,
  getCampaignById,
  addPlayerToCampaign,
  removePlayerFromCampaign,
  addRosterToCampaign,
  removeRosterFromCampaign,
  updateCampaign,
  findCampaigns,
  COLLECTION
};
