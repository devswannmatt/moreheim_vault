const mongoose = require('mongoose');
const player = require('./player');

const COLLECTION = 'campaigns';

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  players: { type: [mongoose.Schema.Types.ObjectId], ref: 'Player', default: [] }
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
  updateCampaign,
  findCampaigns,
  COLLECTION
};
