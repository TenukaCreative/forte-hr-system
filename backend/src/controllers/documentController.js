const multer = require('multer');
const { Document } = require('../models');
const { uploadToBlob, deleteFromBlob, generateSasUrl } = require('../utils/azureBlob');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadDocument = async (req, res, next) => {
  try {
    const { employeeId } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file provided' });
    if (!employeeId) return res.status(400).json({ message: 'employeeId is required' });

    const fileUrl = await uploadToBlob(req.file.originalname, req.file.buffer, req.file.mimetype);

    const doc = await Document.create({
      employeeId,
      fileName: req.file.originalname,
      fileUrl,
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
    });

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

const getDocuments = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const docs = await Document.findAll({
      where: { employeeId },
      order: [['uploadedAt', 'DESC']],
    });
    res.json(docs);
  } catch (err) {
    next(err);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const doc = await Document.findByPk(documentId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    await deleteFromBlob(doc.fileUrl);
    await doc.destroy();

    res.json({ message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
};

const getDownloadUrl = async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.documentId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const downloadUrl = generateSasUrl(doc.fileUrl);
    res.json({ downloadUrl });
  } catch (err) {
    console.error('SAS error:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { upload, uploadDocument, getDocuments, deleteDocument, getDownloadUrl };
