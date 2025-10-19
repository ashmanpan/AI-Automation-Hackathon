import * as fs from 'fs';
import * as path from 'path';
import { uploadToMinIO, uploadBufferToMinIO, getPresignedUrl, deleteFromMinIO } from '../config/minio';
import {
  uploadToS3,
  uploadBufferToS3,
  getS3PresignedUrl,
  deleteFromS3
} from '../config/s3';

// Detect storage backend based on environment
const USE_AWS = !!(
  process.env.AWS_ACCESS_KEY_ID ||
  process.env.AWS_REGION ||
  process.env.USE_AWS_S3 === 'true'
);
const USE_MINIO = process.env.USE_MINIO !== 'false' && !USE_AWS; // Default to MinIO if not AWS

export type StorageType = 'local' | 'minio' | 's3';

export interface FileUploadResult {
  fileName: string;
  fileUrl: string;
  storage: StorageType;
}

/**
 * Get the currently configured storage type
 * @returns Current storage type
 */
export const getStorageType = (): StorageType => {
  if (USE_AWS) return 's3';
  if (USE_MINIO) return 'minio';
  return 'local';
};

/**
 * Upload file to storage (AWS S3, MinIO, or local)
 * @param file Express multer file object
 * @param folder Folder/prefix for organization
 * @returns Upload result with URL
 */
export const uploadFile = async (
  file: Express.Multer.File,
  folder: string = 'submissions'
): Promise<FileUploadResult> => {
  const timestamp = Date.now();
  const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${folder}/${timestamp}-${sanitizedName}`;

  // Try AWS S3 first if configured
  if (USE_AWS) {
    try {
      // Upload to AWS S3
      const fileUrl = await uploadToS3(fileName, file.path, {
        'content-type': file.mimetype,
        'original-name': file.originalname,
      });

      // Delete local temp file
      fs.unlinkSync(file.path);

      return {
        fileName,
        fileUrl,
        storage: 's3',
      };
    } catch (error) {
      console.error('AWS S3 upload failed, falling back to local storage:', error);
      return uploadFileLocally(file, folder);
    }
  }

  // Try MinIO if configured
  if (USE_MINIO) {
    try {
      // Upload to MinIO
      const fileUrl = await uploadToMinIO(fileName, file.path, {
        'Content-Type': file.mimetype,
        'Original-Name': file.originalname,
      });

      // Delete local temp file
      fs.unlinkSync(file.path);

      return {
        fileName,
        fileUrl,
        storage: 'minio',
      };
    } catch (error) {
      console.error('MinIO upload failed, falling back to local storage:', error);
      return uploadFileLocally(file, folder);
    }
  }

  // Default to local storage
  return uploadFileLocally(file, folder);
};

/**
 * Upload file buffer to storage (AWS S3, MinIO, or local)
 * @param buffer File buffer
 * @param originalName Original file name
 * @param mimetype File mimetype
 * @param folder Folder/prefix for organization
 * @returns Upload result
 */
export const uploadFileBuffer = async (
  buffer: Buffer,
  originalName: string,
  mimetype: string,
  folder: string = 'submissions'
): Promise<FileUploadResult> => {
  const timestamp = Date.now();
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${folder}/${timestamp}-${sanitizedName}`;

  // Try AWS S3 first if configured
  if (USE_AWS) {
    try {
      const fileUrl = await uploadBufferToS3(fileName, buffer, mimetype, {
        'original-name': originalName,
      });

      return {
        fileName,
        fileUrl,
        storage: 's3',
      };
    } catch (error) {
      console.error('AWS S3 buffer upload failed, falling back to local storage:', error);
      return uploadBufferLocally(buffer, originalName, folder);
    }
  }

  // Try MinIO if configured
  if (USE_MINIO) {
    try {
      const fileUrl = await uploadBufferToMinIO(fileName, buffer, buffer.length, {
        'Content-Type': mimetype,
        'Original-Name': originalName,
      });

      return {
        fileName,
        fileUrl,
        storage: 'minio',
      };
    } catch (error) {
      console.error('MinIO buffer upload failed, falling back to local storage:', error);
      return uploadBufferLocally(buffer, originalName, folder);
    }
  }

  // Default to local storage
  return uploadBufferLocally(buffer, originalName, folder);
};

/**
 * Get file URL (generates presigned URL for AWS S3 or MinIO)
 * @param fileName File name/path
 * @param expirySeconds Expiry time in seconds
 * @returns File URL
 */
export const getFileUrl = async (
  fileName: string,
  expirySeconds: number = 24 * 60 * 60
): Promise<string> => {
  // Try AWS S3 first if configured
  if (USE_AWS) {
    try {
      return await getS3PresignedUrl(fileName, expirySeconds);
    } catch (error) {
      console.error('Failed to get S3 presigned URL:', error);
      throw error;
    }
  }

  // Try MinIO if configured
  if (USE_MINIO) {
    try {
      return await getPresignedUrl(fileName, expirySeconds);
    } catch (error) {
      console.error('Failed to get MinIO presigned URL:', error);
      throw error;
    }
  }

  // For local storage, return relative path
  return `/uploads/${fileName}`;
};

/**
 * Delete file from storage (AWS S3, MinIO, or local)
 * @param fileName File name/path
 */
export const deleteFile = async (fileName: string): Promise<void> => {
  // Try AWS S3 first if configured
  if (USE_AWS) {
    try {
      await deleteFromS3(fileName);
      return;
    } catch (error) {
      console.error('Failed to delete from S3:', error);
      throw error;
    }
  }

  // Try MinIO if configured
  if (USE_MINIO) {
    try {
      await deleteFromMinIO(fileName);
      return;
    } catch (error) {
      console.error('Failed to delete from MinIO:', error);
      throw error;
    }
  }

  // Delete from local storage
  const localPath = path.join(process.cwd(), 'uploads', fileName);
  if (fs.existsSync(localPath)) {
    fs.unlinkSync(localPath);
  }
};

/**
 * Upload file locally (fallback)
 */
function uploadFileLocally(
  file: Express.Multer.File,
  folder: string
): FileUploadResult {
  const timestamp = Date.now();
  const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${folder}/${timestamp}-${sanitizedName}`;
  const uploadDir = path.join(process.cwd(), 'uploads', folder);

  // Ensure directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const newPath = path.join(process.cwd(), 'uploads', fileName);

  // Move file
  fs.renameSync(file.path, newPath);

  return {
    fileName,
    fileUrl: `/uploads/${fileName}`,
    storage: 'local',
  };
}

/**
 * Upload buffer locally (fallback)
 */
function uploadBufferLocally(
  buffer: Buffer,
  originalName: string,
  folder: string
): FileUploadResult {
  const timestamp = Date.now();
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${folder}/${timestamp}-${sanitizedName}`;
  const uploadDir = path.join(process.cwd(), 'uploads', folder);

  // Ensure directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(process.cwd(), 'uploads', fileName);
  fs.writeFileSync(filePath, buffer);

  return {
    fileName,
    fileUrl: `/uploads/${fileName}`,
    storage: 'local',
  };
}

export default {
  uploadFile,
  uploadFileBuffer,
  getFileUrl,
  deleteFile,
  getStorageType,
};
