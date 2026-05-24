import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/user.service';
import { uploadAvatar, uploadBanner } from '@/services/post.service';

const schema = z.object({
  displayName: z.string().min(1, 'El nombre es obligatorio').max(60),
  bio: z.string().max(300).optional(),
});

type FormData = z.infer<typeof schema>;

export function EditProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl ?? null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(user?.bannerUrl ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      setUploadError(null);
      let avatarUrl = user?.avatarUrl ?? undefined;
      let bannerUrl = user?.bannerUrl ?? undefined;

      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile);
      }
      if (bannerFile) {
        bannerUrl = await uploadBanner(bannerFile);
      }

      return userService.updateProfile({
        ...data,
        avatarUrl: avatarUrl || undefined,
        bannerUrl: bannerUrl || undefined,
      });
    },
    onSuccess: (updatedProfile) => {
      updateUser({
        displayName: updatedProfile.displayName,
        avatarUrl: updatedProfile.avatarUrl,
        bannerUrl: updatedProfile.bannerUrl,
        bio: updatedProfile.bio,
      });
      qc.invalidateQueries({ queryKey: ['profile', user?.username] });
      navigate(`/profile/${user?.username}`);
    },
    onError: (err: Error) => {
      setUploadError(err.message || 'Error al guardar los cambios');
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
      bio: user?.bio ?? '',
    },
  });

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`La imagen excede el límite de 10MB (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setUploadError(null);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`La imagen excede el límite de 10MB (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    setUploadError(null);
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 animate-slide-up">
      <h1 className="font-serif text-2xl font-bold">Editar perfil</h1>

      <form onSubmit={handleSubmit((d) => mutate(d))} className="card p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">Banner</label>
          <div
            onClick={() => bannerInputRef.current?.click()}
            className="relative h-36 w-full cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted"
          >
            {bannerPreview ? (
              <img src={bannerPreview} alt="Banner" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="text-xs">Haz clic para subir banner</span>
              </div>
            )}
            {bannerPreview && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/40">
                <span className="text-sm font-medium text-white opacity-0 transition-opacity hover:opacity-100">
                  Cambiar banner
                </span>
              </div>
            )}
          </div>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleBannerChange}
            className="hidden"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Avatar</label>
          <div className="flex items-center gap-4">
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-primary/50"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="btn-outline text-xs px-3 py-1.5"
              >
                {avatarPreview ? 'Cambiar foto' : 'Subir foto'}
              </button>
              <p className="text-[11px] text-muted-foreground">JPG, PNG, WebP o GIF. Máx 5MB</p>
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

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

        {uploadError && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {uploadError}
          </p>
        )}

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
