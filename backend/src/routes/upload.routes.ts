import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth.middleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
});

const ctrl = new UploadController();

export const uploadRouter = Router();

// POST /api/v1/uploads — Subir imágenes (requiere autenticación)
uploadRouter.post('/', authenticate, upload.array('images', 10), ctrl.uploadImages);
