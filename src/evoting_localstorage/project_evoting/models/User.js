const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { mongoUrl } = require('../keys');

const dbConnection = mongoose.createConnection(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// ── Schemas (define BEFORE models so syncIndexes can reference them) ──────────

const AdminSchema = new mongoose.Schema({
    email:    { type: String, unique: true, required: true },
    password: { type: String, required: true }
});

AdminSchema.pre('save', function (next) {
    const user = this;
    if (!user.isModified('password')) return next();
    bcrypt.genSalt(10, (err, salt) => {
        if (err) return next(err);
        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});

AdminSchema.methods.comparePassword = function (candidatePassword) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
            if (err) return reject(err);
            resolve(isMatch);
        });
    });
};

const VotesSchema = new mongoose.Schema({
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
VotesSchema.index({ voter_id: 1, election_id: 1, pref_id: 1 }, { unique: true });

const CandidateSchema = new mongoose.Schema({
    election_id:          { type: Number, required: true },
    election_name:        { type: String, required: true },
    name:                 { type: String, required: true },
    entry_number:         { type: String, required: true },
    cand_id:              { type: String, required: true },
    election_type:        { type: String, required: true },
    number_of_preferences:{ type: Number, required: true }
});
CandidateSchema.index({ election_id: 1, cand_id: 1 }, { unique: true });

const VoterSchema = new mongoose.Schema({
    name:       { type: String, required: true },
    voter_id:   { type: String, required: true },
    vote:       { type: Boolean, default: false, required: true },
    election_id:{ type: Number, required: true },
    token_id:   { type: String, default: "" },
    time_stamp: { type: Date, index: true }
});

const ReceiptSchema = new mongoose.Schema({
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

const BulletinSchema = new mongoose.Schema({
    election_id: { type: Number, required: true },
    voter_id:    { type: String, required: true },
    booth_num:   { type: Number, required: true },
    commitment:  { type: String, required: true },
    pref_id:     { type: String, required: true },
    hash_value:  { type: String, required: true },
    timestamp:   { type: Date,   required: true, index: true }
});
BulletinSchema.index({ voter_id: 1, election_id: 1, pref_id: 1 }, { unique: true });

const keysSchema = new mongoose.Schema({
    election_id:          { type: Number, unique: true, required: true },
    alpha:                { type: String, required: true },
    pai_pk:               { type: [mongoose.Schema.Types.Mixed], required: true },
    _pai_sklist:          { type: [mongoose.Schema.Types.Mixed], required: true },
    pai_pklist_single:    { type: [mongoose.Schema.Types.Mixed], required: true },
    _pai_sklist_single:   { type: [mongoose.Schema.Types.Mixed], required: true },
    elg_pk:               { type: [mongoose.Schema.Types.Mixed], required: true },
    _elg_sklist:          { type: [mongoose.Schema.Types.Mixed], required: true },
    ck:                   { type: [mongoose.Schema.Types.Mixed], required: true },
    ck_fo:                { type: [mongoose.Schema.Types.Mixed], required: true },
    _pi:                  { type: [mongoose.Schema.Types.Mixed], required: true },
    _re_pi:               { type: [mongoose.Schema.Types.Mixed], required: true },
    _svecperm:            { type: [mongoose.Schema.Types.Mixed], required: true },
    permcomm:             { type: [mongoose.Schema.Types.Mixed], required: true },
    beaver_a_shares:      { type: [mongoose.Schema.Types.Mixed], required: true },
    beaver_b_shares:      { type: [mongoose.Schema.Types.Mixed], required: true },
    beaver_c_shares:      { type: [mongoose.Schema.Types.Mixed], required: true }
});

const generatorSchema = new mongoose.Schema({
    election_id: { type: Number, unique: true, required: true },
    g1:          { type: String, required: true },
    f2:          { type: String, required: true },
    eg1f2:       { type: String, required: true },
    ef1f2:       { type: String, required: true },
    f1:          { type: String, required: true },
    h1:          { type: String, required: true },
    eh1f2:       { type: String, required: true },
    idenT:       { type: String, required: true },
    inveh1f2:    { type: String, required: true },
    inveg1f2:    { type: String, required: true },
    fT:          { type: String, required: true }
});

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

// ── Models ────────────────────────────────────────────────────────────────────
const Votes       = dbConnection.model('Votes',       VotesSchema);
const Admin       = dbConnection.model('Admin',       AdminSchema);
const Candidate   = dbConnection.model('Candidate',   CandidateSchema);
const Voter       = dbConnection.model('Voter',       VoterSchema);
const Receipt     = dbConnection.model('Receipt',     ReceiptSchema);
const Bulletin    = dbConnection.model('Bulletin',    BulletinSchema);
const Keys        = dbConnection.model('Keys',        keysSchema);
const Dec         = dbConnection.model('Dec',         decSchema);
const Generator   = dbConnection.model('Generator',   generatorSchema);
const BMDPublicKey= dbConnection.model('BMDPublicKey',BMDPublicKeySchema);
const ServerKey   = dbConnection.model('ServerKey',   ServerKeySchema);
const AESKey      = dbConnection.model('AESKey',      AESKeySchema);

// ── Sync indexes on connect (replaces old manual dropIndex) ───────────────────
dbConnection.on('connected', async () => {
    console.log('Connected to MongoDB');

    try {
        await Bulletin.syncIndexes();
        console.log('Bulletin indexes synced');
    } catch (err) {
        console.log('Bulletin index sync error:', err.message);
    }

    try {
        await Votes.syncIndexes();
        console.log('Votes indexes synced');
    } catch (err) {
        console.log('Votes index sync error:', err.message);
    }
});

dbConnection.on('error', (err) => {
    console.log('Error connecting to MongoDB', err);
});

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
    Votes,
    Admin,
    Candidate,
    Voter,
    Receipt,
    Bulletin,
    Keys,
    Dec,
    Generator,
    BMDPublicKey,
    ServerKey,
    AESKey
};
