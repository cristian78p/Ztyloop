import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/user.service';

const schema = z.object({
  displayName: z.string().min(1).max(60),
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  bannerUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export function EditProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => userService.updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', user?.username] });
      navigate(`/profile/${user?.username}`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: user?.displayName ?? '',
      bio: (user as { bio?: string })?.bio ?? '',
    },
  });

  return (
    <div className="mx-auto max-w-lg space-y-4 animate-slide-up">
      <h1 className="font-serif text-2xl font-bold">Editar perfil</h1>

      <form onSubmit={handleSubmit((d) => mutate(d))} className="card p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nombre para mostrar *</label>
          <input {...register('displayName')} className="field-input" />
          {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Bio</label>
          <textarea {...register('bio')} rows={3} className="field-input resize-none" placeholder="Cuéntanos sobre tu estilo..." />
          {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">URL de avatar</label>
          <input {...register('avatarUrl')} className="field-input" placeholder="https://..." />
          {errors.avatarUrl && <p className="text-xs text-destructive">{errors.avatarUrl.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">URL de banner</label>
          <input {...register('bannerUrl')} className="field-input" placeholder="https://..." />
          {errors.bannerUrl && <p className="text-xs text-destructive">{errors.bannerUrl.message}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-outline flex-1">Cancelar</button>
          <button type="submit" disabled={isPending} className="btn-primary flex-1">
            {isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
