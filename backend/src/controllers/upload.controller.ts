import { Request, Response, NextFunction } from 'express';
import { UploadService } from '../services/upload.service';
import { ApiResponse } from '../utils/api-response';

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
}
