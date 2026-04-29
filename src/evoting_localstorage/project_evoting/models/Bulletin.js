const mongoose = require('mongoose');
const dbConnection = require('./connection');

const BulletinSchema = new mongoose.Schema({
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    election_id: { type: Number, required: true },
    voter_id:    { type: String, required: true },
    booth_num:   { type: Number, required: true },
    commitment:  { type: String, required: true },
    pref_id:     { type: String, required: true },
    hash_value:  { type: String, required: true },
    timestamp:   { type: Date,   required: true, index: true }
});
BulletinSchema.index({ org_id: 1, voter_id: 1, election_id: 1, pref_id: 1 }, { unique: true });

const Bulletin = dbConnection.model('Bulletin', BulletinSchema);

module.exports = Bulletin;
