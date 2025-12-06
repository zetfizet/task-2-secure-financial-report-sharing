const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

/**
 * @route   POST /api/reports
 * @desc    Upload dan enkripsi report (dengan file)
 * @access  Private (Organization only)
 */
router.post(
  '/',
  auth,
  roleCheck('organization'),
  reportController.uploadMiddleware,
  reportController.uploadReport
);

/**
 * @route   GET /api/reports
 * @desc    Get list reports
 * @access  Private
 */
router.get('/', auth, reportController.getReports);

/**
 * @route   GET /api/reports/:reportId
 * @desc    Get report detail
 * @access  Private
 */
router.get('/:reportId', auth, reportController.getReportById);

/**
 * @route   POST /api/reports/:reportId/decrypt
 * @desc    Decrypt report (organization pemilik report)
 * @access  Private (Organization only)
 */
router.post(
  '/:reportId/decrypt',
  auth,
  roleCheck('organization'),
  reportController.decryptReport
);

module.exports = router;