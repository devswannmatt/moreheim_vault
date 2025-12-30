const { ObjectId } = require('mongodb');
const { getDb } = require('../db');
const playerModel = require('./player');

const COLLECTION = 'campaigns';

function normalizePlayerRef(p) {
  if (!p) return null;
  if (typeof p === 'string') return new ObjectId(p);
  if (p instanceof ObjectId) return p;
  if (p._id) return typeof p._id === 'string' ? new ObjectId(p._id) : p._id;
  return null;
}

function createCampaign(data = {}) {
  const db = getDb();
  const players = (data.players || []).map(normalizePlayerRef).filter(Boolean);
  const doc = {
    name: data.name || 'Untitled Campaign',
    description: data.description || '',
    players,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  return db.collection(COLLECTION).insertOne(doc).then(result => result.insertedId);
}

function getCampaignById(id, { populate = false } = {}) {
  const db = getDb();
  const _id = typeof id === 'string' ? new ObjectId(id) : id;
  return db.collection(COLLECTION).findOne({ _id }).then(campaign => {
    if (!campaign) return null;
    if (populate && Array.isArray(campaign.players) && campaign.players.length) {
      const ids = campaign.players.map(p => (typeof p === 'string' ? new ObjectId(p) : p));
      return db.collection(playerModel.COLLECTION).find({ _id: { $in: ids } }).toArray().then(players => {
        campaign.players = players;
        return campaign;
      });
    }
    return campaign;
  });
}

function addPlayerToCampaign(campaignId, playerData = {}) {
  const db = getDb();
  const campaignObjectId = typeof campaignId === 'string' ? new ObjectId(campaignId) : campaignId;
  return playerModel.createPlayer(playerData).then(playerId => {
    return db.collection(COLLECTION)
      .updateOne({ _id: campaignObjectId }, { $push: { players: playerId }, $set: { updatedAt: new Date() } })
      .then(() => playerId);
  });
}

function removePlayerFromCampaign(campaignId, playerId) {
  const db = getDb();
  const cId = typeof campaignId === 'string' ? new ObjectId(campaignId) : campaignId;
  const pId = typeof playerId === 'string' ? new ObjectId(playerId) : playerId;
  return db.collection(COLLECTION).updateOne({ _id: cId }, { $pull: { players: pId }, $set: { updatedAt: new Date() } }).then(() => {});
}

function updateCampaign(id, patch = {}) {
  const db = getDb();
  const _id = typeof id === 'string' ? new ObjectId(id) : id;
  patch.updatedAt = new Date();
  return db.collection(COLLECTION).updateOne({ _id }, { $set: patch }).then(() => getCampaignById(_id));
}

function findCampaigns(filter = {}, options = {}) {
  const db = getDb();
  return db.collection(COLLECTION).find(filter, options).toArray();
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
