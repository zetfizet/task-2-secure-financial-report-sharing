const mongoose = require('mongoose');
const { mainConnection } = require('../config/database');

const accessRequestSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true,
    index: true,
  },
  consultantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  encryptedKeyForConsultant: {
    type: String,
    // AES key yang sudah dienkripsi dengan RSA public key consultant
    // Diisi ketika request di-approve
  },
  requestMessage: {
    type: String,
    maxlength: 500,
  },
  responseMessage: {
    type: String,
    maxlength: 500,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  respondedAt: {
    type: Date,
  },
});

// Compound index untuk mencegah duplicate request
accessRequestSchema.index({ reportId: 1, consultantId: 1 }, { unique: true });

// Index untuk query performance
accessRequestSchema.index({ organizationId: 1, status: 1 });
accessRequestSchema.index({ consultantId: 1, status: 1 });

const AccessRequest = mainConnection.model('AccessRequest', accessRequestSchema);

module.exports = AccessRequest;
