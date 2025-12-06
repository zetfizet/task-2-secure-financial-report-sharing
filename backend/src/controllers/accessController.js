const AccessRequest = require('../models/AccessRequest');
const Report = require('../models/Report');
const User = require('../models/User');
const PrivateKey = require('../models/PrivateKey');
const CryptoService = require('../services/cryptoService');

/**
 * Request akses ke report (Consultant)
 */
exports.requestAccess = async (req, res) => {
  try {
    const { reportId, requestMessage } = req.body;

    // Validasi input
    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: 'Report ID harus diisi.',
      });
    }

    // Pastikan user adalah consultant
    if (req.userRole !== 'consultant') {
      return res.status(403).json({
        success: false,
        message: 'Hanya consultant yang dapat request akses.',
      });
    }

    // Cek apakah report exists
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report tidak ditemukan.',
      });
    }

    // Cek apakah sudah pernah request
    const existingRequest = await AccessRequest.findOne({
      reportId,
      consultantId: req.userId,
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah pernah request akses ke report ini.',
        data: {
          existingRequest: {
            id: existingRequest._id,
            status: existingRequest.status,
            requestedAt: existingRequest.requestedAt,
          },
        },
      });
    }

    // Buat access request baru
    const accessRequest = new AccessRequest({
      reportId,
      consultantId: req.userId,
      organizationId: report.organizationId,
      requestMessage: requestMessage || 'Meminta akses ke report ini.',
    });

    await accessRequest.save();

    res.status(201).json({
      success: true,
      message: 'Request akses berhasil dikirim.',
      data: {
        accessRequest: {
          id: accessRequest._id,
          reportId: accessRequest.reportId,
          status: accessRequest.status,
          requestMessage: accessRequest.requestMessage,
          requestedAt: accessRequest.requestedAt,
        },
      },
    });
  } catch (error) {
    console.error('Request access error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat request akses.',
      error: error.message,
    });
  }
};

/**
 * Get list access requests
 * Organization: request untuk report miliknya
 * Consultant: request yang dia buat
 */
exports.getAccessRequests = async (req, res) => {
  try {
    let query = {};

    if (req.userRole === 'organization') {
      query.organizationId = req.userId;
    } else if (req.userRole === 'consultant') {
      query.consultantId = req.userId;
    }

    const { status } = req.query;
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const accessRequests = await AccessRequest.find(query)
      .populate('reportId', 'title description')
      .populate('consultantId', 'name email')
      .populate('organizationId', 'name email')
      .sort({ requestedAt: -1 });

    res.json({
      success: true,
      data: {
        accessRequests: accessRequests.map((request) => ({
          id: request._id,
          report: request.reportId,
          consultant: request.consultantId,
          organization: request.organizationId,
          status: request.status,
          requestMessage: request.requestMessage,
          responseMessage: request.responseMessage,
          requestedAt: request.requestedAt,
          respondedAt: request.respondedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get access requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil access requests.',
      error: error.message,
    });
  }
};

/**
 * Approve access request (Organization)
 * ALUR KUNCI:
 * 1. Decrypt AES key report menggunakan private key organization
 * 2. Encrypt AES key menggunakan public key consultant
 * 3. Simpan encrypted AES key untuk consultant
 */
exports.approveAccessRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { password, responseMessage } = req.body;

    // Validasi input
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password harus diisi untuk approve request.',
      });
    }

    // Pastikan user adalah organization
    if (req.userRole !== 'organization') {
      return res.status(403).json({
        success: false,
        message: 'Hanya organization yang dapat approve request.',
      });
    }

    // Cari access request
    const accessRequest = await AccessRequest.findById(requestId)
      .populate('reportId')
      .populate('consultantId');

    if (!accessRequest) {
      return res.status(404).json({
        success: false,
        message: 'Access request tidak ditemukan.',
      });
    }

    // Pastikan request untuk report milik organization ini
    if (accessRequest.organizationId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke request ini.',
      });
    }

    // Cek status request
    if (accessRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request sudah ${accessRequest.status}.`,
      });
    }

    // Ambil encrypted private key organization dari secure database
    const privateKeyDoc = await PrivateKey.findOne({ userId: req.userId });
    if (!privateKeyDoc) {
      return res.status(404).json({
        success: false,
        message: 'Private key tidak ditemukan.',
      });
    }

    // Decrypt private key organization
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

    // Decrypt AES key dari report menggunakan private key organization
    const report = accessRequest.reportId;
    const aesKeyBuffer = CryptoService.decryptRSA(
      report.encryptedAESKey,
      organizationPrivateKey
    );

    // Ambil public key consultant
    const consultantPublicKey = accessRequest.consultantId.publicKey;

    // Encrypt AES key menggunakan public key consultant
    const encryptedKeyForConsultant = CryptoService.encryptRSA(
      aesKeyBuffer,
      consultantPublicKey
    );

    // Update access request
    accessRequest.status = 'approved';
    accessRequest.encryptedKeyForConsultant = encryptedKeyForConsultant;
    accessRequest.responseMessage =
      responseMessage || 'Akses ke report telah disetujui.';
    accessRequest.respondedAt = Date.now();

    await accessRequest.save();

    res.json({
      success: true,
      message: 'Access request berhasil di-approve.',
      data: {
        accessRequest: {
          id: accessRequest._id,
          status: accessRequest.status,
          responseMessage: accessRequest.responseMessage,
          respondedAt: accessRequest.respondedAt,
        },
      },
    });
  } catch (error) {
    console.error('Approve access request error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat approve request.',
      error: error.message,
    });
  }
};

/**
 * Reject access request (Organization)
 */
exports.rejectAccessRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { responseMessage } = req.body;

    // Pastikan user adalah organization
    if (req.userRole !== 'organization') {
      return res.status(403).json({
        success: false,
        message: 'Hanya organization yang dapat reject request.',
      });
    }

    // Cari access request
    const accessRequest = await AccessRequest.findById(requestId);

    if (!accessRequest) {
      return res.status(404).json({
        success: false,
        message: 'Access request tidak ditemukan.',
      });
    }

    // Pastikan request untuk report milik organization ini
    if (accessRequest.organizationId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke request ini.',
      });
    }

    // Cek status request
    if (accessRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request sudah ${accessRequest.status}.`,
      });
    }

    // Update access request
    accessRequest.status = 'rejected';
    accessRequest.responseMessage =
      responseMessage || 'Akses ke report ditolak.';
    accessRequest.respondedAt = Date.now();

    await accessRequest.save();

    res.json({
      success: true,
      message: 'Access request berhasil di-reject.',
      data: {
        accessRequest: {
          id: accessRequest._id,
          status: accessRequest.status,
          responseMessage: accessRequest.responseMessage,
          respondedAt: accessRequest.respondedAt,
        },
      },
    });
  } catch (error) {
    console.error('Reject access request error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat reject request.',
      error: error.message,
    });
  }
};

/**
 * Decrypt AES key dan report (Consultant)
 * ALUR KUNCI:
 * 1. Ambil encrypted AES key untuk consultant dari access request
 * 2. Decrypt AES key menggunakan private key consultant
 * 3. Decrypt report menggunakan AES key
 */
// ... (kode sebelumnya sama)

/**
 * Decrypt AES key dan report (Consultant)
 */
exports.decryptReportForConsultant = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password harus diisi untuk decrypt report.',
      });
    }

    if (req.userRole !== 'consultant') {
      return res.status(403).json({
        success: false,
        message: 'Hanya consultant yang dapat decrypt report.',
      });
    }

    const accessRequest = await AccessRequest.findById(requestId).populate('reportId');

    if (!accessRequest) {
      return res.status(404).json({
        success: false,
        message: 'Access request tidak ditemukan.',
      });
    }

    if (accessRequest.consultantId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke request ini.',
      });
    }

    if (accessRequest.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Access request belum di-approve.',
      });
    }

    const privateKeyDoc = await PrivateKey.findOne({ userId: req.userId });
    if (!privateKeyDoc) {
      return res.status(404).json({
        success: false,
        message: 'Private key tidak ditemukan.',
      });
    }

    let consultantPrivateKey;
    try {
      consultantPrivateKey = CryptoService.decryptPrivateKey(
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

    const aesKeyBuffer = CryptoService.decryptRSA(
      accessRequest.encryptedKeyForConsultant,
      consultantPrivateKey
    );

    const report = accessRequest.reportId;
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
    console.error('Decrypt report for consultant error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat decrypt report.',
      error: error.message,
    });
  }
};