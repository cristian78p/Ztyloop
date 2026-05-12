import { Router } from 'express';
import { authRouter } from './auth.routes';
import { postRouter } from './post.routes';
import { userRouter } from './user.routes';

// Router raíz. Todos los endpoints quedan bajo /api/v1/...
export const router = Router();

router.use('/auth', authRouter);
router.use('/posts', postRouter);
router.use('/users', userRouter);
