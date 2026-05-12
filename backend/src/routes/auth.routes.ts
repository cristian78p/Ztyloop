import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';

// Las rutas SOLO definen endpoints y qué middlewares/controller los atienden.
// No contienen lógica de negocio.
export const authRouter = Router();
const ctrl = new AuthController();

authRouter.post('/register', validate(registerSchema), ctrl.register);
authRouter.post('/login', validate(loginSchema), ctrl.login);
authRouter.post('/logout', authenticate, ctrl.logout);
authRouter.get('/me', authenticate, ctrl.me);
authRouter.post('/refresh', ctrl.refresh);
