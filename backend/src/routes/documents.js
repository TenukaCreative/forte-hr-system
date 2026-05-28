const express = require('express');
const router = express.Router();
const { upload, uploadDocument, getDocuments, deleteDocument } = require('../controllers/documentController');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.post('/upload', auth, authorize('HR_MANAGER'), upload.single('file'), uploadDocument);
router.get('/:employeeId', auth, authorize('HR_MANAGER'), getDocuments);
router.delete('/:documentId', auth, authorize('HR_MANAGER'), deleteDocument);

module.exports = router;
