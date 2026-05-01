const mongoose = require('mongoose');
const dbConnection = require('./connection');

const ElectionSchema = new mongoose.Schema({
  org_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  election_id: {
    type: Number,
    required: true,
  },
  election_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  election_type: {
    type: String,
    enum: ['fptp', 'preferential', 'block'],
    required: true,
  },
  number_of_preferences: {
    type: Number,
    default: 1,
  },
  status: {
    type: String,
    enum: ['draft', 'open', 'closed'],
    default: 'draft',
  },
  total_voters: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  opened_at: {
    type: Date,
  },
  closed_at: {
    type: Date,
  },
});

ElectionSchema.index({ org_id: 1, election_id: 1 }, { unique: true });

const Election = dbConnection.model('Election', ElectionSchema);

module.exports = Election;
