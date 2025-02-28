const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { mongoUrl } = require('../keys');
const keys = require('../keys');

// Create a single connection to your MongoDB database
const dbConnection = mongoose.createConnection(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

dbConnection.on('connected', () => {
    console.log('Connected to MongoDB');
});

dbConnection.on('error', (err) => {
    console.log('Error connecting to MongoDB', err);
});

// Schema for Polling officer and their methods
const PollingSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    }
});

PollingSchema.pre('save', function (next) {
    const user = this;
    if (!user.isModified('password')) {
        return next();
    }
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return next(err);
        }
        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) {
                return next(err);
            }
            user.password = hash;
            next();
        });
    });
});

PollingSchema.methods.comparePassword = function (candidatePassword) {
    const user = this;
    return new Promise((resolve, reject) => {
        bcrypt.compare(candidatePassword, user.password, (err, isMatch) => {
            if (err) {
                return reject(err); 
            }
            if (!isMatch) {
                return reject(null); 
            }
            resolve(true); 
        });
    });
};

// Schema for Admin user and its methods
const AdminSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    }
});

AdminSchema.pre('save', function (next) {
    const user = this;
    if (!user.isModified('password')) {
        return next();
    }
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return next(err);
        }
        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) {
                return next(err);
            }
            user.password = hash;
            next();
        });
    });
});

AdminSchema.methods.comparePassword = function (candidatePassword) {
    const user = this;
    return new Promise((resolve, reject) => {
        bcrypt.compare(candidatePassword, user.password, (err, isMatch) => {
            if (err) {
                return reject(err);
            }
            if (!isMatch) {
                return reject(null);
            }
            resolve(true); 
        });
    });
};

// Schema to store votes on server
const VotesSchema = new mongoose.Schema({
    election_id:{type:Number,unique:true,required:true},
    voter_id: {
        type: String,
        required: true,
    },
    ov_hash:{type: String,required: true},
    enc_hash:{type: String,required: true},
    enc_msg:{type: [mongoose.Schema.Types.Mixed],required: true}, 
    comm:{type: [mongoose.Schema.Types.Mixed],required: true}, 
    enc_msg_share:{type: [mongoose.Schema.Types.Mixed],required: true}, 
    enc_rand_share:{type: [mongoose.Schema.Types.Mixed],required: true}, 
    pfcomm:{type: String,required: true}, 
    enc_rand:{type: [mongoose.Schema.Types.Mixed],required: true}, 
    pf_encmsg:{type: String,required: true}, 
    pf_encrand:{type: String,required: true}, 
    pfs_enc_msg_share:{type: String,required: true}, 
    pfs_enc_rand_share:{type: String,required: true}
});

// Schema for candidate
const CandidateSchema = new mongoose.Schema({
    election_id:{
        type:Number,
        unique:true,
        required:true
    },
    name: {
        type: String,
        required: true          
    },
    cand_id: {
        type: String,
        required: true
    }    
});

// Schema for voters
const VoterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    voter_id: {
        type: String,
        required: true
    },
    vote: {
        type: Boolean,
        default: false,
        required: true
    },
    election_id:{
        type:Number,
        required:true
    }
});

// Schema for receipts
const ReceiptSchema = new mongoose.Schema({
    election_id:{type:Number,required:true,unique:true},
    ov_hash:{type:String,required: true},
    enc_hash: {type:String,required: true},
    enc_msg:{type:String,required: true}, 
    comm:{type: String,required: true}, 
    enc_msg_shares:{type: String,required: true}, 
    enc_rand_shares:{type: String,required: true}, 
    pfcomm:{type:String,required: true}, 
    enc_rand:{type: String,required: true}, 
    pf_encmsg:{type: String,required: true}, 
    pf_encrand:{type: String,required: true}, 
    pf_enc_msg_shares:{type: String,required: true}, 
    pf_enc_rand_shares:{type: String,required: true},
    accessed:{type:Boolean,required:true}
});

const BulletinSchema=new mongoose.Schema({
    election_id:{
        type:Number,
        required:true,
        unique:true
    },
    voter_id:{
        type:String,
        required:true
    },
    booth_num:{
        type:Number,
        required:true
    },
    commitment:{
        type:String,
        unique:true,
        required:true
    },
    pref_id:{
        type:String,
        required:true
    },
    hash_value:{
        type:String,
        required:true
    }

});

const keysSchema=new mongoose.Schema({
    election_id:{type:Number,unique:true,required:true},
    alpha:{type:String,required:true},
    pai_pk:{type:[mongoose.Schema.Types.Mixed],required:true},
    _pai_sklist:{type:[mongoose.Schema.Types.Mixed],required:true},
    pai_pklist_single:{type:[mongoose.Schema.Types.Mixed],required:true},
    _pai_sklist_single:{type:[mongoose.Schema.Types.Mixed],required:true},
    elg_pk:{type:[mongoose.Schema.Types.Mixed],required:true},
    _elg_sklist:{type:[mongoose.Schema.Types.Mixed],required:true},
    ck:{type:[mongoose.Schema.Types.Mixed],required:true},
    ck_fo:{type:[mongoose.Schema.Types.Mixed],required:true},
    _pi:{type:[mongoose.Schema.Types.Mixed],required:true},
    _re_pi:{type:[mongoose.Schema.Types.Mixed],required:true},
    _svecperm:{type:[mongoose.Schema.Types.Mixed],required:true},
    permcomm:{type:[mongoose.Schema.Types.Mixed],required:true},
    beaver_a_shares:{type:[mongoose.Schema.Types.Mixed],required:true},
    beaver_b_shares:{type:[mongoose.Schema.Types.Mixed],required:true},
    beaver_c_shares:{type:[mongoose.Schema.Types.Mixed],required:true}
});

const generatorSchema=new mongoose.Schema({
    election_id:{type:Number,unique:true,required:true},
    g1:{type:String,required:true},
    f2:{type:String,required:true},
    eg1f2:{type:String,required:true},
    ef1f2:{type:String,required:true},
    f1:{type:String,required:true},
    h1:{type:String,required:true},
    eh1f2:{type:String,required:true},
    idenT:{type:String,required:true},
    inveh1f2:{type:String,required:true},
    inveg1f2:{type:String,required:true},
    fT:{type:String,required:true}
});

const pairingElementSchema = new mongoose.Schema({
    $binary: {
      type: String, // Base64 encoded binary data
      required: true
    },
    subType: {
      type: String, // Subtype, such as "00"
      required: true
    }
  });
  
  const decSchema = new mongoose.Schema({
    election_id:{type:Number,unique:true,required:true},
    msgs_out_dec: {
      type: [ [ [String, Array] ] ], // Nested arrays with type [ "builtins.list", [ [type, value], ...] ]
      required: true
    },
    msgs_out: {
      type: [[{ pairingElement: pairingElementSchema }]], // Array of arrays, each containing pairing elements
      required: true
    },
    _msg_shares: {
      type: [[{ pairingElement: pairingElementSchema }]], // Array of arrays, each containing pairing elements
      required: true
    },
    _rand_shares: {
      type: [[{ pairingElement: pairingElementSchema }]], // Array of arrays, each containing pairing elements
      required: true
    }
  });
// Create models for each schema
const PO = dbConnection.model('PO', PollingSchema);
const Votes = dbConnection.model('Votes', VotesSchema);
const Admin = dbConnection.model('Admin', AdminSchema);
const Candidate = dbConnection.model('Candidate', CandidateSchema);
const Voter = dbConnection.model('Voter', VoterSchema);
const Receipt = dbConnection.model('Receipt', ReceiptSchema);
const Bulletin=dbConnection.model('Bulletin',BulletinSchema);
const Keys=dbConnection.model('Keys',keysSchema);
const Dec=dbConnection.model('Dec',decSchema);
const Generator=dbConnection.model('Generator',generatorSchema);
module.exports = {
    PO,
    Votes,
    Admin,
    Candidate,
    Voter,
    Receipt,
    Bulletin,
    Keys,
    Dec,
    Generator
};
