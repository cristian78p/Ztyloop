import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth.middleware';

const postUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
});

const profileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

const ctrl = new UploadController();

export const uploadRouter = Router();

uploadRouter.post('/', authenticate, postUpload.array('images', 10), ctrl.uploadImages);
uploadRouter.post('/avatar', authenticate, profileUpload.single('avatar'), ctrl.uploadAvatar);
uploadRouter.post('/banner', authenticate, profileUpload.single('banner'), ctrl.uploadBanner);
