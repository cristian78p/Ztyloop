import { Request, Response, NextFunction } from 'express';
import { UploadService } from '../services/upload.service';
import { ApiResponse } from '../utils/api-response';
import { logger } from '../utils/logger';

export class UploadController {
  private uploadService = new UploadService();

  uploadImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      const urls = await this.uploadService.uploadImages(files);
      res.status(201).json(ApiResponse.success({ urls }, 'Imágenes subidas exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  uploadAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;
      logger.info({ hasFile: !!file, mimetype: file?.mimetype, size: file?.size }, 'Avatar upload request');
      if (!file) {
        res.status(400).json(ApiResponse.error('Debes subir una imagen'));
        return;
      }
      const url = await this.uploadService.uploadAvatar(file);
      res.status(201).json(ApiResponse.success({ url }, 'Avatar subido exitosamente'));
    } catch (error) {
      logger.error({ err: error }, 'Avatar upload controller error');
      next(error);
    }
  };

  uploadBanner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;
      logger.info({ hasFile: !!file, mimetype: file?.mimetype, size: file?.size }, 'Banner upload request');
      if (!file) {
        res.status(400).json(ApiResponse.error('Debes subir una imagen'));
        return;
      }
      const url = await this.uploadService.uploadBanner(file);
      res.status(201).json(ApiResponse.success({ url }, 'Banner subido exitosamente'));
    } catch (error) {
      logger.error({ err: error }, 'Banner upload controller error');
      next(error);
    }
  };
}
