const mongoose = require('mongoose');
const dbConnection = require('./connection');

const VotesSchema = new mongoose.Schema({
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    election_id:        { type: Number, required: true },
    voter_id:           { type: String, required: true },
    pref_id:            { type: String, required: true },
    ov_hash:            { type: String, required: true },
    enc_hash:           { type: String, required: true },
    enc_msg:            { type: [mongoose.Schema.Types.Mixed], required: true },
    comm:               { type: [mongoose.Schema.Types.Mixed], required: true },
    enc_msg_share:      { type: [mongoose.Schema.Types.Mixed], required: true },
    enc_rand_share:     { type: [mongoose.Schema.Types.Mixed], required: true },
    pfcomm:             { type: String, required: true },
    enc_rand:           { type: [mongoose.Schema.Types.Mixed], required: true },
    pf_encmsg:          { type: String, required: true },
    pf_encrand:         { type: String, required: true },
    pfs_enc_msg_share:  { type: String, required: true },
    pfs_enc_rand_share: { type: String, required: true }
});
VotesSchema.index({ org_id: 1, voter_id: 1, election_id: 1, pref_id: 1 }, { unique: true });

const Votes = dbConnection.model('Votes', VotesSchema);

module.exports = Votes;
