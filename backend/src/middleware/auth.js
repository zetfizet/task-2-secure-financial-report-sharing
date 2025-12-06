const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware untuk autentikasi JWT
 */
const auth = async (req, res, next) => {
  try {
    // Ambil token dari header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cari user
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    // Simpan user di request object
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token sudah kadaluarsa.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat autentikasi.',
      error: error.message,
    });
  }
};

module.exports = auth;
