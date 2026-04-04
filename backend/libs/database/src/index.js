const { getDb } = require('./client');
const schema = require('./schema/index');

module.exports = { getDb, ...schema };
