const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PrivateKey = require('../models/PrivateKey');
const CryptoService = require('../services/cryptoService');

/**
 * Register user baru
 */
exports.register = async (req, res) => {
  try {
    const { name, password, role } = req.body;

    // Validasi input
    if (!name || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi.',
      });
    }

    // Validasi role
    if (!['organization', 'consultant'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role harus "organization" atau "consultant".',
      });
    }

    // Cek apakah name sudah terdaftar
    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Nama sudah terdaftar.',
      });
    }

    // Generate RSA Key Pair
    const { publicKey, privateKey } = CryptoService.generateRSAKeyPair();

    // Hash password
    const hashedPassword = CryptoService.hashPassword(password);

    // Encrypt private key dengan password user
    const { encryptedPrivateKey, salt, iv } = CryptoService.encryptPrivateKey(
      privateKey,
      password
    );

    // Buat user baru
    const user = new User({
      name,
      password: hashedPassword,
      role,
      publicKey,
    });

    await user.save();

    // Simpan encrypted private key di database terpisah
    const privateKeyDoc = new PrivateKey({
      userId: user._id,
      encryptedPrivateKey,
      salt,
      iv,
    });

    await privateKeyDoc.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil.',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat registrasi.',
      error: error.message,
    });
  }
};

/**
 * Login user
 */
exports.login = async (req, res) => {
  try {
    const { name, password } = req.body;

    // Validasi input
    if (!name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan password harus diisi.',
      });
    }

    // Cari user berdasarkan name
    const user = await User.findOne({ name });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Nama atau password salah.',
      });
    }

    // Verify password
    const isPasswordValid = CryptoService.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Nama atau password salah.',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: 'Login berhasil.',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat login.',
      error: error.message,
    });
  }
};

/**
 * Get current user profile
 */
exports.getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toJSON(),
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil profil.',
      error: error.message,
    });
  }
};