const mongoose = require('mongoose');
const dbConnection = require('./connection');
const OtpVerificationSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true },
  name:         { type: String, required: true },
  slug:         { type: String, required: true },
  passwordHash: { type: String, required: true },
  otpHash:      { type: String, required: true },
  expiresAt:    { type: Date, required: true, index: { expires: 0 } },
});
module.exports = dbConnection.model('OtpVerification', OtpVerificationSchema);
