import { cloudinary } from '../config/cloudinary';
import { AppError } from '../utils/app-error';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export class UploadService {
  async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new AppError('Debes subir al menos una imagen', 400);
    }

    if (files.length > 10) {
      throw new AppError('Máximo 10 imágenes por publicación', 400);
    }

    // Validar cada archivo
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.mimetype)) {
        throw new AppError(
          `Formato no permitido: ${file.originalname}. Usa JPG, PNG, WebP o GIF`,
          400,
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new AppError(
          `${file.originalname} excede el límite de 5MB`,
          400,
        );
      }
    }

    // Subir todas las imágenes en paralelo
    const uploadPromises = files.map((file) => this.uploadToCloudinary(file));
    const results = await Promise.all(uploadPromises);
    return results;
  }

  private uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'ztyloop/posts',
          transformation: [
            { width: 1080, height: 1350, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error || !result) {
            reject(new AppError('Error al subir imagen a Cloudinary', 500));
          } else {
            resolve(result.secure_url);
          }
        },
      );
      stream.end(file.buffer);
    });
  }
}
