const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dbConnection = require('./connection');

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

const Admin = dbConnection.model('Admin', AdminSchema);

module.exports = Admin;
