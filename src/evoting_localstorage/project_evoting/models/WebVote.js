const mongoose = require('mongoose');
const dbConnection = require('./connection');

const EncryptedPayloadSchema = new mongoose.Schema({
  algorithm: { type: String, required: true },
  iv: { type: String, required: true },
  ciphertext: { type: String, required: true },
  key_id: { type: String },
}, { _id: false });

const WebVoteSchema = new mongoose.Schema({
  org_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  election_id: { type: Number, required: true, index: true },
  voter_id: { type: String, required: true },
  encrypted_vote: { type: EncryptedPayloadSchema, required: true },
  selection_hash: { type: String, required: true },
  ballot_type: { type: String, enum: ['fptp', 'preferential', 'block'], required: true },
  receipt_id: { type: String, required: true, unique: true },
  receipt_hash: { type: String, required: true },
  client_receipt_nonce: { type: String, required: true },
  submitted_at: { type: Date, default: Date.now, index: true },
});

WebVoteSchema.index({ org_id: 1, election_id: 1, voter_id: 1 }, { unique: true });

const WebVote = dbConnection.model('WebVote', WebVoteSchema);

module.exports = WebVote;
