import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { SaveController } from '../controllers/save.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';

export const userRouter = Router();
const user = new UserController();
const save = new SaveController();

// Own profile — must come before /:username
userRouter.get('/me/saved', authenticate, save.getSaved);
userRouter.get('/me', authenticate, user.getMe);
userRouter.patch('/me', authenticate, user.updateProfile);

// Public profile
userRouter.get('/:username', optionalAuthenticate, user.getProfile);
userRouter.get('/:username/posts', optionalAuthenticate, user.getUserPosts);
// Follow — PUT para seguir, DELETE para dejar de seguir
userRouter.put('/:username/follow', authenticate, user.follow);
userRouter.delete('/:username/follow', authenticate, user.unfollow);
