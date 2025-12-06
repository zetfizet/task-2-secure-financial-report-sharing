const mongoose = require('mongoose');
const { mainConnection } = require('../config/database');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['organization', 'consultant'],
    required: true,
  },
  publicKey: {
    type: String,
    required: true, // RSA Public Key (PEM format)
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp sebelum save
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Method untuk mendapatkan user info tanpa password
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mainConnection.model('User', userSchema);

module.exports = User;