const mongoose = require('mongoose');
const dbConnection = require('./connection');

const BulletinSchema = new mongoose.Schema({
  election_id: {
    type: Number,
    required: true,
  },
  voter_id: {
    type: String,
    required: true,
  },
  booth_num: {
    type: Number,
    required: true,
  },
  commitment: {
    type: String,
    required: true,
  },
  pref_id: {
    type: String,
    required: true,
  },
  hash_value: {
    type: String,
    required: true,
  },
});
BulletinSchema.index({ voter_id: 1, election_id: 1 }, { unique: true });

const Bulletin = dbConnection.model('Bulletin', BulletinSchema);

module.exports = Bulletin;
