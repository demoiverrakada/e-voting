const Votes = require('./Vote');
const Admin = require('./Admin');
const Organization = require('./Organization');
const OtpVerification = require('./OtpVerification');
const Election = require('./Election');
const PollingOfficer = require('./PollingOfficer');
const PollingBooth = require('./PollingBooth');
const Candidate = require('./Candidate');
const Voter = require('./Voter');
const WebVote = require('./WebVote');
const Receipt = require('./Receipt');
const Bulletin = require('./Bulletin');
const { Keys, Generator } = require('./Keys');
const Dec = require('./Crypto');
const { BMDPublicKey, ServerKey, AESKey } = require('./ServerKey');

module.exports = {
    Votes,
    Admin,
    Organization,
    OtpVerification,
    Election,
    PollingOfficer,
    PollingBooth,
    Candidate,
    Voter,
    WebVote,
    Receipt,
    Bulletin,
    Keys,
    Dec,
    Generator,
    BMDPublicKey,
    ServerKey,
    AESKey
};

