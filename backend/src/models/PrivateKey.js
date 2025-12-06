const mongoose = require('mongoose');
const { secureConnection } = require('../config/database');

/**
 * Private Key Model - Disimpan di database terpisah untuk keamanan ekstra
 * Private key SELALU disimpan dalam bentuk terenkripsi
 */
const privateKeySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    index: true,
  },
  encryptedPrivateKey: {
    type: String,
    required: true, // RSA Private Key yang sudah dienkripsi dengan password user
  },
  salt: {
    type: String,
    required: true, // Salt untuk key derivation
  },
  iv: {
    type: String,
    required: true, // Initialization Vector untuk AES encryption
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastAccessed: {
    type: Date,
    default: Date.now,
  },
});

// Update lastAccessed setiap kali diakses
privateKeySchema.pre('findOne', function () {
  this.set({ lastAccessed: Date.now() });
});

const PrivateKey = secureConnection.model('PrivateKey', privateKeySchema);

module.exports = PrivateKey;
