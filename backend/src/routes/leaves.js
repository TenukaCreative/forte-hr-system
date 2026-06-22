const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const auth = require('../middleware/auth');
const { authorize, authorizePermission } = require('../middleware/rbac');
const {
  assignEntitlement,
  getEntitlement,
  getMyEntitlement,
  submitRequest,
  getMyRequests,

  
  getPendingForManager,
  managerReview,
  getPendingApproval,
  finalReview,
  getAllRequests,
  getTeamApprovedLeaves,
  uploadLeaveDocument,
  getLeaveDocument,
  deleteLeaveRequest,
} = require('../controllers/leaveController');

// Entitlements
// Current user's own entitlement — must come before the :employeeId param route
router.get('/entitlement/me', auth, getMyEntitlement);
// HR / Super Admin only
router.post('/entitlement', auth, authorize('HR_MANAGER', 'SUPER_ADMIN'), assignEntitlement);
router.get('/entitlement/:employeeId', auth, authorize('HR_MANAGER', 'SUPER_ADMIN'), getEntitlement);

// Employee routes — all authenticated users
router.post('/request', auth, authorizePermission('leave_management'), submitRequest);
router.get('/my', auth, authorizePermission('leave_management'), getMyRequests);

// Leave documents — employee uploads to own request; review pages fetch a SAS URL.
// Declared before the other /:id routes to keep param handling predictable.
router.post('/:id/document', auth, upload.single('file'), uploadLeaveDocument);
router.get('/:id/document', auth, getLeaveDocument);

// Manager Step 1 review — any authenticated user (controller checks managerId)
router.patch('/:id/manager-review', auth, managerReview);

// Employee cancels their own request — controller verifies ownership
router.delete('/:id', auth, deleteLeaveRequest);

// HR / Super Admin Step 2
router.get('/pending-approval', auth, authorize('HR_MANAGER', 'SUPER_ADMIN'), authorizePermission('leave_overview'), getPendingApproval);
router.patch('/:id/final-review', auth, authorize('HR_MANAGER', 'SUPER_ADMIN'), authorizePermission('leave_overview'), finalReview);

// All requests — HR / Super Admin
router.get('/all', auth, authorize('HR_MANAGER', 'SUPER_ADMIN'), authorizePermission('leave_overview'), getAllRequests);

// Pending for manager — any authenticated user
router.get('/pending-manager', auth, getPendingForManager);

// Team members on approved leave today — any authenticated user (manager scoped)
router.get('/team-approved', auth, getTeamApprovedLeaves);

module.exports = router;
