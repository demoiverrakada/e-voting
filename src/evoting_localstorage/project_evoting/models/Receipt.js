const mongoose = require('mongoose');
const dbConnection = require('./connection');

const ReceiptSchema = new mongoose.Schema({
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    election_id:        { type: Number, required: true },
    ov_hash:            { type: String, required: true },
    enc_hash:           { type: String, required: true },
    enc_msg:            { type: String, required: true },
    comm:               { type: String, required: true },
    enc_msg_shares:     { type: String, required: true },
    enc_rand_shares:    { type: String, required: true },
    pfcomm:             { type: String, required: true },
    enc_rand:           { type: String, required: true },
    pf_encmsg:          { type: String, required: true },
    pf_encrand:         { type: String, required: true },
    pf_enc_msg_shares:  { type: String, required: true },
    pf_enc_rand_shares: { type: String, required: true },
    accessed:           { type: Boolean, required: true }
});

const Receipt = dbConnection.model('Receipt', ReceiptSchema);

module.exports = Receipt;
