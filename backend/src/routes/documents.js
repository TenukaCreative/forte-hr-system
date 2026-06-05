const express = require('express');
const router = express.Router();
const { upload, uploadDocument, getDocuments, deleteDocument, getDownloadUrl } = require('../controllers/documentController');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/:documentId/download', auth, getDownloadUrl);
router.post('/upload', auth, authorize('HR_MANAGER', 'SUPER_ADMIN'), upload.single('file'), uploadDocument);
router.get('/:employeeId', auth, authorize('HR_MANAGER', 'SUPER_ADMIN'), getDocuments);
router.delete('/:documentId', auth, authorize('HR_MANAGER', 'SUPER_ADMIN'), deleteDocument);

module.exports = router;
