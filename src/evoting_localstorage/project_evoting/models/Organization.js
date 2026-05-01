const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dbConnection = require('./connection');

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  plan: {
    type: String,
    enum: ['free', 'paid'],
    default: 'free',
  },
  elections_created: {
    type: Number,
    default: 0,
  },
  razorpay_payment_id: {
    type: String,
    default: null,
  },
  plan_activated_at: {
    type: Date,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

OrganizationSchema.pre('save', function (next) {
  const org = this;
  if (!org.isModified('passwordHash')) return next();
  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);
    bcrypt.hash(org.passwordHash, salt, (err, hash) => {
      if (err) return next(err);
      org.passwordHash = hash;
      next();
    });
  });
});

OrganizationSchema.methods.comparePassword = function (candidatePassword) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, this.passwordHash, (err, isMatch) => {
      if (err) return reject(err);
      resolve(isMatch);
    });
  });
};

const Organization = dbConnection.model('Organization', OrganizationSchema);

module.exports = Organization;
