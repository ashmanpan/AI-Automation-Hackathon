import * as Minio from 'minio';
import dotenv from 'dotenv';

dotenv.config();

// MinIO Client Configuration
export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

export const MINIO_BUCKET = process.env.MINIO_BUCKET || 'hackathon-files';

/**
 * Initialize MinIO bucket
 * Creates the bucket if it doesn't exist
 */
export const initMinIO = async (): Promise<void> => {
  try {
    const bucketExists = await minioClient.bucketExists(MINIO_BUCKET);

    if (!bucketExists) {
      await minioClient.makeBucket(MINIO_BUCKET, 'us-east-1');
      console.log(`✓ MinIO bucket '${MINIO_BUCKET}' created successfully`);

      // Set bucket policy to allow public read access (optional)
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`],
          },
        ],
      };

      // Uncomment if you want public read access
      // await minioClient.setBucketPolicy(MINIO_BUCKET, JSON.stringify(policy));
    } else {
      console.log(`✓ MinIO bucket '${MINIO_BUCKET}' already exists`);
    }
  } catch (error) {
    console.error('MinIO initialization error:', error);
    throw error;
  }
};

/**
 * Upload file to MinIO
 * @param fileName Name of the file in MinIO
 * @param filePath Local file path
 * @param metadata Optional metadata
 * @returns File URL
 */
export const uploadToMinIO = async (
  fileName: string,
  filePath: string,
  metadata?: Record<string, string>
): Promise<string> => {
  try {
    await minioClient.fPutObject(
      MINIO_BUCKET,
      fileName,
      filePath,
      metadata || {}
    );

    // Generate presigned URL (valid for 7 days)
    const url = await minioClient.presignedGetObject(
      MINIO_BUCKET,
      fileName,
      7 * 24 * 60 * 60
    );

    return url;
  } catch (error) {
    console.error('MinIO upload error:', error);
    throw error;
  }
};

/**
 * Upload file buffer to MinIO
 * @param fileName Name of the file in MinIO
 * @param buffer File buffer
 * @param size File size
 * @param metadata Optional metadata
 * @returns File URL
 */
export const uploadBufferToMinIO = async (
  fileName: string,
  buffer: Buffer,
  size: number,
  metadata?: Record<string, any>
): Promise<string> => {
  try {
    await minioClient.putObject(
      MINIO_BUCKET,
      fileName,
      buffer,
      size,
      metadata || {}
    );

    // Generate presigned URL (valid for 7 days)
    const url = await minioClient.presignedGetObject(
      MINIO_BUCKET,
      fileName,
      7 * 24 * 60 * 60
    );

    return url;
  } catch (error) {
    console.error('MinIO upload error:', error);
    throw error;
  }
};

/**
 * Download file from MinIO
 * @param fileName Name of the file in MinIO
 * @returns File stream
 */
export const downloadFromMinIO = async (fileName: string): Promise<any> => {
  try {
    const stream = await minioClient.getObject(MINIO_BUCKET, fileName);
    return stream;
  } catch (error) {
    console.error('MinIO download error:', error);
    throw error;
  }
};

/**
 * Get presigned URL for a file
 * @param fileName Name of the file in MinIO
 * @param expirySeconds Expiry time in seconds (default: 24 hours)
 * @returns Presigned URL
 */
export const getPresignedUrl = async (
  fileName: string,
  expirySeconds: number = 24 * 60 * 60
): Promise<string> => {
  try {
    const url = await minioClient.presignedGetObject(
      MINIO_BUCKET,
      fileName,
      expirySeconds
    );
    return url;
  } catch (error) {
    console.error('MinIO presigned URL error:', error);
    throw error;
  }
};

/**
 * Delete file from MinIO
 * @param fileName Name of the file in MinIO
 */
export const deleteFromMinIO = async (fileName: string): Promise<void> => {
  try {
    await minioClient.removeObject(MINIO_BUCKET, fileName);
  } catch (error) {
    console.error('MinIO delete error:', error);
    throw error;
  }
};

/**
 * List all files in a prefix
 * @param prefix File prefix/folder
 * @returns List of file names
 */
export const listFiles = async (prefix: string = ''): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const files: string[] = [];
    const stream = minioClient.listObjectsV2(MINIO_BUCKET, prefix, true);

    stream.on('data', (obj) => {
      if (obj.name) {
        files.push(obj.name);
      }
    });
    stream.on('error', reject);
    stream.on('end', () => resolve(files));
  });
};

export default minioClient;
