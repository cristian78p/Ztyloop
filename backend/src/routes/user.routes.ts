import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { SaveController } from '../controllers/save.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const userRouter = Router();
const user = new UserController();
const save = new SaveController();

// Own profile — must come before /:username
userRouter.get('/me/saved', authenticate, save.getSaved);
userRouter.get('/me', authenticate, user.getMe);
userRouter.patch('/me', authenticate, user.updateProfile);

// Public profile
userRouter.get('/:username', user.getProfile);
userRouter.get('/:username/posts', user.getUserPosts);
userRouter.post('/:username/follow', authenticate, user.toggleFollow);
