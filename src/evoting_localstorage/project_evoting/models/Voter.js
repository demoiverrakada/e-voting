const mongoose = require('mongoose');
const dbConnection = require('./connection');

const VoterSchema = new mongoose.Schema({
    name:       { type: String, required: true },
    voter_id:   { type: String, required: true },
    vote:       { type: Boolean, default: false, required: true },
    election_id:{ type: Number, required: true },
    token_id:   { type: String, default: "" },
    time_stamp: { type: Date, index: true }
});

const Voter = dbConnection.model('Voter', VoterSchema);

module.exports = Voter;
