const mongoose = require('mongoose');
const {mongoUrl}=require('../keys')

const FirstConnection=mongoose.createConnection(mongoUrl[0],{
    useNewUrlParser:true,
    useUnifiedTopology:true
})
//stores final voter receipt
const SecondConnection=mongoose.createConnection(mongoUrl[1],
{
    useNewUrlParser:true,
    useUnifiedTopology:true
})
FirstConnection.on('connected', () => {
    console.log('Connected to first');
});
SecondConnection.on('connected', () => {
    console.log('Connected to second');
});
FirstConnection.on('error', (err) => {
    console.log('Error from the first MongoDB instance', err);
});
SecondConnection.on('error', (err) => {
    console.log('Error from the second MongoDB instance', err);
});
// votes uploaded schema 
const votesSchema = new mongoose.Schema({
    voter_id:
    {
        type:String,
        unique:true,
        required:true,
    },
    ballot_id: {
        type: String,
        unique: true,
        required: true,
    },
    preference: 
    {
        type:Number,
        required:true
    }
});
//voter schema
const VoterSchema=new mongoose.Schema(
    {
        name:{
            type:String,
            required:true
        },
        entryNum:{
            type:String,
            required:true
        },
        vote:
        {
            type:Boolean,
            default:false,
            required:true
        },
        ballot_id: {
            type: String,
            unique: true,
            required: true,
        }

    }
);

module.exports={
    Votes :FirstConnection.model('Votes', votesSchema),
    Voter:SecondConnection.model('Voter',VoterSchema),
}