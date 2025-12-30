const { MongoClient } = require('mongodb');

let client;
let dbInstance;

async function connect(uri, dbName = 'moreheim_vault') {
  if (dbInstance) return dbInstance;
  client = new MongoClient(uri, { useUnifiedTopology: true });
  await client.connect();
  dbInstance = client.db(dbName);
  return dbInstance;
}

function getDb() {
  if (!dbInstance) throw new Error('Database not connected. Call connect() first.');
  return dbInstance;
}

async function close() {
  if (client) await client.close();
  client = null;
  dbInstance = null;
}

module.exports = { connect, getDb, close };
