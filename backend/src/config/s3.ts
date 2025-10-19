import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

// AWS S3 Client Configuration
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined, // Use IAM role if credentials not provided
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET || 'hackathon-files';

/**
 * Upload file to S3
 * @param fileName Name of the file in S3
 * @param filePath Local file path
 * @param metadata Optional metadata
 * @returns File URL
 */
export const uploadToS3 = async (
  fileName: string,
  filePath: string,
  metadata?: Record<string, string>
): Promise<string> => {
  try {
    const fileContent = fs.readFileSync(filePath);

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileName,
      Body: fileContent,
      Metadata: metadata || {},
    });

    await s3Client.send(command);

    // Generate presigned URL (valid for 7 days)
    const getCommand = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileName,
    });

    const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 7 * 24 * 60 * 60 });
    return url;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw error;
  }
};

/**
 * Upload file buffer to S3
 * @param fileName Name of the file in S3
 * @param buffer File buffer
 * @param contentType Content type
 * @param metadata Optional metadata
 * @returns File URL
 */
export const uploadBufferToS3 = async (
  fileName: string,
  buffer: Buffer,
  contentType: string,
  metadata?: Record<string, any>
): Promise<string> => {
  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata || {},
    });

    await s3Client.send(command);

    // Generate presigned URL
    const getCommand = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileName,
    });

    const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 7 * 24 * 60 * 60 });
    return url;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw error;
  }
};

/**
 * Download file from S3
 * @param fileName Name of the file in S3
 * @returns File stream
 */
export const downloadFromS3 = async (fileName: string): Promise<any> => {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileName,
    });

    const response = await s3Client.send(command);
    return response.Body;
  } catch (error) {
    console.error('S3 download error:', error);
    throw error;
  }
};

/**
 * Get presigned URL for a file
 * @param fileName Name of the file in S3
 * @param expirySeconds Expiry time in seconds (default: 24 hours)
 * @returns Presigned URL
 */
export const getS3PresignedUrl = async (
  fileName: string,
  expirySeconds: number = 24 * 60 * 60
): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileName,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: expirySeconds });
    return url;
  } catch (error) {
    console.error('S3 presigned URL error:', error);
    throw error;
  }
};

/**
 * Delete file from S3
 * @param fileName Name of the file in S3
 */
export const deleteFromS3 = async (fileName: string): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileName,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('S3 delete error:', error);
    throw error;
  }
};

/**
 * Check if file exists in S3
 * @param fileName Name of the file in S3
 * @returns Boolean
 */
export const fileExistsInS3 = async (fileName: string): Promise<boolean> => {
  try {
    const command = new HeadObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileName,
    });

    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
};

/**
 * Initialize S3 (check bucket access)
 */
export const initS3 = async (): Promise<void> => {
  try {
    // Just try to list objects to verify access
    const { HeadBucketCommand } = await import('@aws-sdk/client-s3');
    const command = new HeadBucketCommand({ Bucket: S3_BUCKET });
    await s3Client.send(command);
    console.log(`✓ S3 bucket '${S3_BUCKET}' is accessible`);
  } catch (error) {
    console.error('S3 initialization error:', error);
    throw error;
  }
};

export default s3Client;
