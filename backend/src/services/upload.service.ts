import { cloudinary } from '../config/cloudinary';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

const MAX_POST_FILE_SIZE = 5 * 1024 * 1024;
const MAX_PROFILE_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export class UploadService {
  async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new AppError('Debes subir al menos una imagen', 400);
    }

    if (files.length > 10) {
      throw new AppError('Máximo 10 imágenes por publicación', 400);
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.mimetype)) {
        throw new AppError(
          `Formato no permitido: ${file.originalname}. Usa JPG, PNG, WebP o GIF`,
          400,
        );
      }
      if (file.size > MAX_POST_FILE_SIZE) {
        throw new AppError(
          `${file.originalname} excede el límite de 5MB`,
          400,
        );
      }
    }

    const uploadPromises = files.map((file) => this.uploadToCloudinary(file));
    const results = await Promise.all(uploadPromises);
    return results;
  }

  async uploadAvatar(file: Express.Multer.File): Promise<string> {
    this.validateSingleFile(file);
    return this.uploadToCloudinaryWithOptions(file, {
      folder: 'ztyloop/avatars',
      transformation: [
        { width: 400, height: 400, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
      ],
    });
  }

  async uploadBanner(file: Express.Multer.File): Promise<string> {
    this.validateSingleFile(file);
    return this.uploadToCloudinaryWithOptions(file, {
      folder: 'ztyloop/banners',
      transformation: [
        { width: 1200, height: 400, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
      ],
    });
  }

  private validateSingleFile(file: Express.Multer.File): void {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new AppError(
        `Formato no permitido: ${file.originalname}. Usa JPG, PNG, WebP o GIF`,
        400,
      );
    }
    if (file.size > MAX_PROFILE_FILE_SIZE) {
      throw new AppError(`${file.originalname} excede el límite de 10MB`, 400);
    }
  }

  private uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    return this.uploadToCloudinaryWithOptions(file, {
      folder: 'ztyloop/posts',
      transformation: [
        { width: 1080, height: 1350, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
      ],
    });
  }

  private uploadToCloudinaryWithOptions(
    file: Express.Multer.File,
    options: Record<string, unknown>,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            logger.error({ err: error, folder: options.folder }, 'Cloudinary upload failed');
            reject(new AppError(error.message || 'Error al subir imagen a Cloudinary', 500));
            return;
          }
          if (!result) {
            reject(new AppError('Cloudinary no retornó resultado', 500));
            return;
          }
          resolve(result.secure_url);
        },
      );

      stream.on('error', (err) => {
        logger.error({ err, folder: options.folder }, 'Cloudinary stream error');
        reject(new AppError('Error de conexión con Cloudinary', 500));
      });

      stream.end(file.buffer);
    });
  }
}
