const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} = require('@azure/storage-blob');
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

  if (!client || !containerName || !fileUrl || fileUrl.startsWith('http://dev-placeholder')) {
    console.log('Skipping blob delete:', fileUrl);
    return;
  }

  try {
    const url = new URL(fileUrl);
    const blobName = decodeURIComponent(
      url.pathname.replace(`/${containerName}/`, '').replace(/^\//, '')
    );

    console.log('Deleting blob:', blobName);

    const containerClient = client.getContainerClient(containerName);
    await containerClient.getBlockBlobClient(blobName).deleteIfExists();

    console.log('Blob deleted:', blobName);
  } catch (err) {
    console.warn('Blob delete warning:', err.message);
    // Don't throw — let DB deletion proceed
  }
};

const generateSasUrl = (fileUrl) => {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCESS_KEY;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

  // Dev placeholder URLs — return as-is
  if (!accountName || !accountKey || !containerName || fileUrl.startsWith('http://dev-placeholder')) {
    return fileUrl;
  }

  const credential = new StorageSharedKeyCredential(accountName, accountKey);

  const url = new URL(fileUrl);
  const blobName = decodeURIComponent(
    url.pathname.replace(`/${containerName}/`, '').replace(/^\//, '')
  );

  const expiresOn = new Date(Date.now() + 60 * 60 * 1000);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse('r'),
      expiresOn,
    },
    credential
  ).toString();

  return `${fileUrl}?${sasToken}`;
};

module.exports = { uploadToBlob, deleteFromBlob, generateSasUrl };
