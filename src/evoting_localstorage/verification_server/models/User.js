const mongoose = require('mongoose');
const { mongoUrl } = require('../keys');


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


const BulletinSchema=new mongoose.Schema({
    election_id:{
        type:Number,
        required:true
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
BulletinSchema.index({ voter_id: 1, election_id: 1 }, { unique: true });

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


// Create models for each schema
const Voter = dbConnection.model('Voter', VoterSchema);
const Bulletin=dbConnection.model('Bulletin',BulletinSchema);
const Keys=dbConnection.model('Keys',keysSchema);
const Generator=dbConnection.model('Generator',generatorSchema);
module.exports = {
    Voter,
    Bulletin,
    Keys,
    Generator
};