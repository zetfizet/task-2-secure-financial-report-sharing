const mongoose = require('mongoose');

// Koneksi database utama
const mainConnection = mongoose.createConnection(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Koneksi database terpisah untuk private keys (lebih aman)
const secureConnection = mongoose.createConnection(process.env.MONGODB_SECURE_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mainConnection.on('connected', () => {
  console.log('✅ Connected to main database');
});

mainConnection.on('error', (err) => {
  console.error('❌ Main database connection error:', err);
});

secureConnection.on('connected', () => {
  console.log('🔐 Connected to secure database (private keys)');
});

secureConnection.on('error', (err) => {
  console.error('❌ Secure database connection error:', err);
});

module.exports = {
  mainConnection,
  secureConnection,
};
