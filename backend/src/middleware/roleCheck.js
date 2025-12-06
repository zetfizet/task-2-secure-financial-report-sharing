/**
 * Middleware untuk memeriksa role user
 */
const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        message: 'User tidak terautentikasi.',
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Role yang diizinkan: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = roleCheck;
