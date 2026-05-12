import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  email: z.string().email('Email inválido'),
  username: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guión bajo'),
  displayName: z.string().max(50).optional(),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe tener una mayúscula')
    .regex(/[0-9]/, 'Debe tener un número'),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data);
      navigate('/feed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear la cuenta';
      setError('root', { message: msg });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-semibold">Crear cuenta</h2>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Email</label>
        <input
          {...register('email')}
          type="email"
          autoComplete="email"
          className="field-input"
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Usuario</label>
        <input
          {...register('username')}
          placeholder="mi_usuario"
          autoComplete="username"
          className="field-input"
        />
        {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Nombre para mostrar{' '}
          <span className="text-muted-foreground text-xs">(opcional)</span>
        </label>
        <input {...register('displayName')} className="field-input" />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Contraseña</label>
        <input
          {...register('password')}
          type="password"
          autoComplete="new-password"
          className="field-input"
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      {errors.root && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? 'Creando cuenta...' : 'Registrarse'}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-foreground hover:text-accent transition-colors">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
