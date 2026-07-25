const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { R2 } = require('../../config/env');

let client = null;

function getClient() {
  if (client) return client;
  client = new S3Client({
    region: 'auto',
    endpoint: R2.endpoint,
    credentials: {
      accessKeyId: R2.accessKeyId,
      secretAccessKey: R2.secretAccessKey,
    },
  });
  return client;
}

/**
 * @param {string} key
 * @param {Buffer} body
 * @param {string} contentType
 */
async function putObject(key, body, contentType) {
  await getClient().send(new PutObjectCommand({
    Bucket: R2.bucket,
    Key: key,
    Body: body,
    ContentType: contentType || 'application/octet-stream',
  }));
}

/**
 * @param {string} key
 * @returns {Promise<{ body: import('stream').Readable, contentType: string|null, contentLength: number|null }|null>}
 */
async function getObject(key) {
  try {
    const result = await getClient().send(new GetObjectCommand({
      Bucket: R2.bucket,
      Key: key,
    }));
    return {
      body: result.Body,
      contentType: result.ContentType || null,
      contentLength: typeof result.ContentLength === 'number' ? result.ContentLength : null,
    };
  } catch (error) {
    if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * @param {string} key
 */
async function deleteObject(key) {
  await getClient().send(new DeleteObjectCommand({
    Bucket: R2.bucket,
    Key: key,
  }));
}

module.exports = {
  putObject,
  getObject,
  deleteObject,
};
