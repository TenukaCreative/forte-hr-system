const express = require('express');
const router = express.Router();
const { upload, uploadDocument, getDocuments, deleteDocument, getDownloadUrl } = require('../controllers/documentController');
const auth = require('../middleware/auth');
const { authorizePermission } = require('../middleware/rbac');

router.get('/:documentId/download', auth, getDownloadUrl);
router.post('/upload', auth, authorizePermission('employee_management'), upload.single('file'), uploadDocument);
router.get('/:employeeId', auth, authorizePermission('employee_management'), getDocuments);
router.delete('/:documentId', auth, authorizePermission('employee_management'), deleteDocument);

module.exports = router;
