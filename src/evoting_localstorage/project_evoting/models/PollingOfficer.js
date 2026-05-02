const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dbConnection = require('./connection');
const PollingOfficerSchema = new mongoose.Schema({
  org_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  created_at:   { type: Date, default: Date.now },
});
PollingOfficerSchema.index({ org_id: 1, email: 1 }, { unique: true });
PollingOfficerSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});
PollingOfficerSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};
module.exports = dbConnection.model('PollingOfficer', PollingOfficerSchema);
