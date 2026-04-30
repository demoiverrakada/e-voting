const mongoose = require('mongoose');
const dbConnection = require('./connection');

const CandidateSchema = new mongoose.Schema({
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    election_id:          { type: Number, required: true },
    election_name:        { type: String, required: true },
    name:                 { type: String, required: true },
    entry_number:         { type: String, required: true },
    cand_id:              { type: String, required: true },
    election_type:        { type: String, required: true },
    number_of_preferences:{ type: Number, required: true }
});
CandidateSchema.index({ org_id: 1, election_id: 1, cand_id: 1 }, { unique: true });

const Candidate = dbConnection.model('Candidate', CandidateSchema);

module.exports = Candidate;
