const express = require('express');
const router = express.Router();
const accessController = require('../controllers/accessController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

/**
 * @route   POST /api/access/request
 * @desc    Request akses ke report
 * @access  Private (Consultant only)
 */
router.post('/request', auth, roleCheck('consultant'), accessController.requestAccess);

/**
 * @route   GET /api/access/requests
 * @desc    Get list access requests
 * @access  Private
 */
router.get('/requests', auth, accessController.getAccessRequests);

/**
 * @route   POST /api/access/approve/:requestId
 * @desc    Approve access request
 * @access  Private (Organization only)
 */
router.post(
  '/approve/:requestId',
  auth,
  roleCheck('organization'),
  accessController.approveAccessRequest
);

/**
 * @route   POST /api/access/reject/:requestId
 * @desc    Reject access request
 * @access  Private (Organization only)
 */
router.post(
  '/reject/:requestId',
  auth,
  roleCheck('organization'),
  accessController.rejectAccessRequest
);

/**
 * @route   POST /api/access/decrypt/:requestId
 * @desc    Decrypt report untuk consultant
 * @access  Private (Consultant only)
 */
router.post(
  '/decrypt/:requestId',
  auth,
  roleCheck('consultant'),
  accessController.decryptReportForConsultant
);

module.exports = router;
