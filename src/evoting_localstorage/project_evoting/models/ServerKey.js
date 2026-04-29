const mongoose = require('mongoose');
const dbConnection = require('./connection');

const BMDPublicKeySchema = new mongoose.Schema({
    bmd_id:             { type: Number, required: true, unique: true },
    rsa_public_key_pem: { type: String, required: true },
    is_active:          { type: Boolean, required: true, default: true }
});

const ServerKeySchema = new mongoose.Schema({
    server_id:           { type: String, required: true, unique: true, default: "main_server" },
    rsa_public_key_pem:  { type: String, required: true },
    rsa_private_key_pem: { type: String, required: true },
    key_version:         { type: Number, default: 1 },
    is_active:           { type: Boolean, default: true },
    created_at:          { type: Date, default: Date.now }
});

const AESKeySchema = new mongoose.Schema({
    encrypted_aes_key: { type: String, required: true },
    nonce_base:        { type: String, required: true },
    created_at:        { type: Date, default: Date.now }
});

const BMDPublicKey = dbConnection.model('BMDPublicKey', BMDPublicKeySchema);
const ServerKey = dbConnection.model('ServerKey', ServerKeySchema);
const AESKey = dbConnection.model('AESKey', AESKeySchema);

module.exports = { BMDPublicKey, ServerKey, AESKey };
