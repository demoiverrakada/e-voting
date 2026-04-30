const mongoose = require('mongoose');
const dbConnection = require('./connection');

const pairingElementSchema = new mongoose.Schema({
    $binary: { type: String, required: true },
    subType:  { type: String, required: true }
});

const decSchema = new mongoose.Schema({
    election_id:  { type: Number, unique: true, required: true },
    msgs_out_dec: { type: [[[String, Array]]], required: true },
    msgs_out:     { type: [[{ pairingElement: pairingElementSchema }]], required: true },
    _msg_shares:  { type: [[{ pairingElement: pairingElementSchema }]], required: true },
    _rand_shares: { type: [[{ pairingElement: pairingElementSchema }]], required: true }
});

const Dec = dbConnection.model('Dec', decSchema);

module.exports = Dec;
