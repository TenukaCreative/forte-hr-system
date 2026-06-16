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

// Resolve the storage container + blob folder for a given container type.
//   'docs'   → forte-hr-docs    (employeeDocs/)
//   'photos' → forte-hr-photos  (profilePhotos/)
//   'leaves' → fortehrleaves    (leaveDocs/)
const resolveContainer = (containerType) => {
  if (containerType === 'photos') return process.env.AZURE_STORAGE_PHOTOS_CONTAINER;
  if (containerType === 'leaves') return process.env.AZURE_STORAGE_LEAVES_CONTAINER || 'forte-hr-leaves';
  return process.env.AZURE_STORAGE_CONTAINER_NAME;
};

const folderFor = (containerType) => {
  if (containerType === 'photos') return 'profilePhotos';
  if (containerType === 'leaves') return 'leaveDocs';
  return 'employeeDocs';
};

const uploadToBlob = async (fileName, fileBuffer, mimeType, containerType = 'docs') => {
  const containerName = resolveContainer(containerType);
  const folder = folderFor(containerType);
  const blobName = `${folder}/${crypto.randomUUID()}-${fileName}`;
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

const generateSasUrl = (fileUrl, containerType = 'docs') => {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCESS_KEY;
  const containerName = resolveContainer(containerType);

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
