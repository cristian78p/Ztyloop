import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { authLimiter, registerLimiter } from '../middlewares/rate-limit.middleware';

// Las rutas SOLO definen endpoints y qué middlewares/controller los atienden.
// No contienen lógica de negocio.
export const authRouter = Router();
const ctrl = new AuthController();

authRouter.post('/register', registerLimiter, validate(registerSchema), ctrl.register);
authRouter.post('/login', authLimiter, validate(loginSchema), ctrl.login);
authRouter.delete('/logout', authenticate, ctrl.logout);
authRouter.get('/me', authenticate, ctrl.me);
authRouter.post('/refresh', ctrl.refresh);
