import { Router } from 'express';
import { authRouter } from './auth.routes';
import { postRouter } from './post.routes';
import { userRouter } from './user.routes';
import { uploadRouter } from './upload.routes';

export const router = Router();

router.use('/auth', authRouter);
router.use('/posts', postRouter);
router.use('/users', userRouter);
router.use('/uploads', uploadRouter);
