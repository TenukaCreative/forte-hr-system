const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const crypto = require('crypto');

const getClient = () => {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCESS_KEY;
  if (!accountName || !accountKey) return null;
  const credential = new StorageSharedKeyCredential(accountName, accountKey);
  return new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, credential);
};

const uploadToBlob = async (fileName, fileBuffer, mimeType) => {
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
  const blobName = `employeeDocs/${crypto.randomUUID()}-${fileName}`;
  const client = getClient();

  // Dev fallback: Azure credentials not yet configured
  if (!client || !containerName) {
    return `http://dev-placeholder.local/${blobName}`;
  }

  const containerClient = client.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: { blobContentType: mimeType },
  });
  return blockBlobClient.url;
};

const deleteFromBlob = async (fileUrl) => {
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
  const client = getClient();

  // Dev placeholder URLs — nothing to delete
  if (!client || !containerName || fileUrl.startsWith('http://dev-placeholder')) return;

  const url = new URL(fileUrl);
  const blobName = url.pathname.replace(`/${containerName}/`, '').replace(/^\//, '');
  const containerClient = client.getContainerClient(containerName);
  await containerClient.getBlockBlobClient(blobName).delete();
};

module.exports = { uploadToBlob, deleteFromBlob };
