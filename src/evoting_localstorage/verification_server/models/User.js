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
    }
});


const BulletinSchema=new mongoose.Schema({
    voter_id:{
        type:String,
        required:true,
        unique:true
    },
    booth_num:{
        type:Number,
        required:true
    },
    commitment:{
        type:String,
        unique:true,
        required:true
    }
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

const keysSchema=new mongoose.Schema({
    alpha:{type:String,required:true},
    pai_pk:{type: [[String, Array]],required:true},
    _pai_sklist:{type:String,required:true},
    pai_pklist_single:{type:[[String, Array]],required:true},
    _pai_sklist_single:{type:String,required:true},
    elg_pk:{type:[[String, Array]],required:true},
    _elg_sklist:{type:String,required:true},
    ck:{type:String,required:true},
    ck_fo:{type:String,required:true},
    _pi:{type:String,required:true},
    _re_pi:{type:String,required:true},
    _svecperm:{type:String,required:true},
    permcomm:{type:String,required:true},
    beaver_a_shares:{type:String,required:true},
    beaver_b_shares:{type:String,required:true},
    beaver_c_shares:{type:String,required:true}
});

const generatorSchema=new mongoose.Schema({
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