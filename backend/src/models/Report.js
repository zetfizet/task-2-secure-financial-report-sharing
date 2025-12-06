const mongoose = require('mongoose');
const { mainConnection } = require('../config/database');

const reportSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  encryptedContent: {
    type: String,
    required: true, // Report content yang sudah dienkripsi dengan AES
  },
  encryptedAESKey: {
    type: String,
    required: true, // AES key yang dienkripsi dengan RSA public key organization
  },
  iv: {
    type: String,
    required: true, // Initialization Vector untuk AES encryption
  },
  fileName: {
    type: String,
  },
  fileSize: {
    type: Number, // dalam bytes
  },
  mimeType: {
    type: String,
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

// Index untuk query performance
reportSchema.index({ organizationId: 1, createdAt: -1 });

// Update timestamp sebelum save
reportSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Report = mainConnection.model('Report', reportSchema);

module.exports = Report;
