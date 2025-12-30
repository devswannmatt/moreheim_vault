const mongoose = require('mongoose');
const { connect: dbConnect } = require('./db');

// Connect to MongoDB (uses the shared DB helper and mongoose)
async function connect() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const mongoDbName = process.env.MONGODB_DB || 'moreheim_vault';
  try {
    // connect native driver helper
    await dbConnect(mongoUri, mongoDbName);
    // connect mongoose
    await mongoose.connect(mongoUri, { dbName: mongoDbName });
    console.log(`[START] Connected to ${mongoUri}/${mongoDbName}`);
  } catch (err) {
    console.error('[ERROR] Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}

module.exports = { connect };