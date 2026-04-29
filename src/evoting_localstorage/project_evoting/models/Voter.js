const mongoose = require('mongoose');
const dbConnection = require('./connection');

const VoterSchema = new mongoose.Schema({
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    name:       { type: String, required: true },
    email:      { type: String, trim: true, lowercase: true },
    voter_id:   { type: String, required: true },
    vote:       { type: Boolean, default: false, required: true },
    election_id:{ type: Number, required: true },
    token_id:   { type: String, default: "" },
    time_stamp: { type: Date, index: true }
});

const Voter = dbConnection.model('Voter', VoterSchema);

module.exports = Voter;
