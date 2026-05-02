const mongoose = require('mongoose');
const dbConnection = require('./connection');

const PollingBoothSchema = new mongoose.Schema({
  org_id:           { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  election_id:      { type: Number, required: true },
  name:             { type: String, required: true, trim: true },
  activation_code:  { type: String, required: true, unique: true },
  session_token:    { type: String, default: null },
  is_active:        { type: Boolean, default: false },
  officer_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'PollingOfficer', default: null },
  activated_at:     { type: Date, default: null },
  deactivated_at:   { type: Date, default: null },
  votes_cast:       { type: Number, default: 0 },
  created_at:       { type: Date, default: Date.now },
});

PollingBoothSchema.index({ org_id: 1, election_id: 1 });

module.exports = dbConnection.model('PollingBooth', PollingBoothSchema);
