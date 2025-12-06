const Report = require('../models/Report');
const PrivateKey = require('../models/PrivateKey');
const User = require('../models/User');
const CryptoService = require('../services/cryptoService');
const multer = require('multer');

// Setup multer untuk file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types
    cb(null, true);
  },
});

/**
 * Middleware untuk upload file
 */
exports.uploadMiddleware = upload.single('file');

/**
 * Upload dan enkripsi report (dengan file)
 */
exports.uploadReport = async (req, res) => {
  try {
    const { title, description, password } = req.body;
    const file = req.file;

    // Validasi input
    if (!title || !password) {
      return res.status(400).json({
        success: false,
        message: 'Title dan password harus diisi.',
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'File harus diupload.',
      });
    }

    // Pastikan user adalah organization
    if (req.userRole !== 'organization') {
      return res.status(403).json({
        success: false,
        message: 'Hanya organization yang dapat upload report.',
      });
    }

    // Ambil encrypted private key dari secure database
    const privateKeyDoc = await PrivateKey.findOne({ userId: req.userId });
    if (!privateKeyDoc) {
      return res.status(404).json({
        success: false,
        message: 'Private key tidak ditemukan.',
      });
    }

    // Decrypt private key menggunakan password user
    let organizationPrivateKey;
    try {
      organizationPrivateKey = CryptoService.decryptPrivateKey(
        privateKeyDoc.encryptedPrivateKey,
        password,
        privateKeyDoc.salt,
        privateKeyDoc.iv
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Password salah.',
      });
    }

    // Generate random AES key dan IV
    const aesKey = CryptoService.generateAESKey();
    const iv = CryptoService.generateIV();

    // Convert file buffer to base64 string
    const fileContent = file.buffer.toString('base64');

    // Encrypt file content dengan AES
    const encryptedContent = CryptoService.encryptAES(fileContent, aesKey, iv);

    // Encrypt AES key dengan RSA public key organization
    const organizationPublicKey = req.user.publicKey;
    const encryptedAESKey = CryptoService.encryptRSA(aesKey, organizationPublicKey);

    // Buat report baru
    const report = new Report({
      organizationId: req.userId,
      title,
      description: description || '',
      encryptedContent,
      encryptedAESKey,
      iv: iv.toString('base64'),
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    await report.save();

    res.status(201).json({
      success: true,
      message: 'File berhasil diupload dan dienkripsi.',
      data: {
        report: {
          id: report._id,
          title: report.title,
          description: report.description,
          fileName: report.fileName,
          fileSize: report.fileSize,
          mimeType: report.mimeType,
          createdAt: report.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Upload report error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat upload file.',
      error: error.message,
    });
  }
};

/**
 * Get list reports
 */
exports.getReports = async (req, res) => {
  try {
    let query = {};

    // Jika organization, hanya tampilkan report miliknya
    if (req.userRole === 'organization') {
      query.organizationId = req.userId;
    }

    const reports = await Report.find(query)
      .populate('organizationId', 'name')
      .sort({ createdAt: -1 })
      .select('-encryptedContent -encryptedAESKey');

    res.json({
      success: true,
      data: {
        reports: reports.map((report) => ({
          id: report._id,
          title: report.title,
          description: report.description,
          organization: report.organizationId,
          fileName: report.fileName,
          fileSize: report.fileSize,
          mimeType: report.mimeType,
          createdAt: report.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil reports.',
      error: error.message,
    });
  }
};

/**
 * Get report detail
 */
exports.getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId)
      .populate('organizationId', 'name')
      .select('-encryptedContent -encryptedAESKey');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      data: {
        report: {
          id: report._id,
          title: report.title,
          description: report.description,
          organization: report.organizationId,
          fileName: report.fileName,
          fileSize: report.fileSize,
          mimeType: report.mimeType,
          createdAt: report.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Get report by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil report.',
      error: error.message,
    });
  }
};

/**
 * Decrypt report dan download file
 */
exports.decryptReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password harus diisi.',
      });
    }

    // Cari report
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report tidak ditemukan.',
      });
    }

    // Pastikan user adalah pemilik report
    if (report.organizationId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke report ini.',
      });
    }

    // Ambil encrypted private key
    const privateKeyDoc = await PrivateKey.findOne({ userId: req.userId });
    if (!privateKeyDoc) {
      return res.status(404).json({
        success: false,
        message: 'Private key tidak ditemukan.',
      });
    }

    // Decrypt private key
    let organizationPrivateKey;
    try {
      organizationPrivateKey = CryptoService.decryptPrivateKey(
        privateKeyDoc.encryptedPrivateKey,
        password,
        privateKeyDoc.salt,
        privateKeyDoc.iv
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Password salah.',
      });
    }

    // Decrypt AES key
    const aesKeyBuffer = CryptoService.decryptRSA(
      report.encryptedAESKey,
      organizationPrivateKey
    );

    // Decrypt content
    const iv = Buffer.from(report.iv, 'base64');
    const decryptedContentBase64 = CryptoService.decryptAES(
      report.encryptedContent,
      aesKeyBuffer,
      iv
    );

    // Convert base64 back to buffer
    const fileBuffer = Buffer.from(decryptedContentBase64, 'base64');

    // Set headers untuk download
    res.setHeader('Content-Type', report.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
    res.setHeader('Content-Length', fileBuffer.length);

    // Send file
    res.send(fileBuffer);
  } catch (error) {
    console.error('Decrypt report error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mendekripsi report.',
      error: error.message,
    });
  }
};