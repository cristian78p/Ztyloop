import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdatePost } from '@/hooks/usePosts';
import { uploadImages } from '@/services/post.service';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ItemTypeSelect, ITEM_CONFIG } from '@/components/ui/ItemTypeSelect';
import { cn } from '@/utils/cn';
import type { ItemType, PostCategory, Post } from '@/types';
import type { OutfitItemInput } from '@/services/post.service';

const CATEGORIES: PostCategory[] = [
  'CASUAL','FORMAL','COSPLAY','STREETWEAR','MINIMALIST',
  'VINTAGE','AESTHETIC','GOTHIC','Y2K','PREPPY',
];
const VISIBILITY_LABELS = {
  PUBLIC: 'Público',
  FOLLOWERS_ONLY: 'Solo seguidores',
  PRIVATE: 'Privado',
} as const;

const schema = z.object({
  caption: z.string().max(2000).optional(),
  category: z.enum([
    'CASUAL','FORMAL','COSPLAY','STREETWEAR','MINIMALIST',
    'VINTAGE','AESTHETIC','GOTHIC','Y2K','PREPPY',
  ] as const).optional(),
  hashtags: z.string().optional(),
  visibility: z.enum(['PUBLIC','FOLLOWERS_ONLY','PRIVATE'] as const).default('PUBLIC'),
});
type FormData = z.infer<typeof schema>;

type Step = 'image' | 'details' | 'tags';

interface LocalTag extends OutfitItemInput {
  imageIndex: number;
}

interface PendingTag {
  x: number; y: number;
  itemType: ItemType;
  customLabel: string;
  customLink: string;
  brand: string;
  price: string;
}

interface EditPostModalProps {
  post: Post;
  open: boolean;
  onClose: () => void;
}

export function EditPostModal({ post, open, onClose }: EditPostModalProps) {
  const { mutate: updatePost, isPending } = useUpdatePost(post.id);

  const [step, setStep] = useState<Step>('image');
  const [tags, setTags] = useState<LocalTag[]>([]);
  const [pendingTag, setPendingTag] = useState<PendingTag | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [deletePhotoIdx, setDeletePhotoIdx] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, watch, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      caption: post.caption ?? '',
      category: (post.category as PostCategory | undefined) ?? undefined,
      hashtags: post.hashtags?.map((h) => `#${h.hashtag.name}`).join(' ') ?? '',
      visibility: post.visibility as 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      caption: post.caption ?? '',
      category: (post.category as PostCategory | undefined) ?? undefined,
      hashtags: post.hashtags?.map((h) => `#${h.hashtag.name}`).join(' ') ?? '',
      visibility: post.visibility as 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE',
    });
    setImages(Array.isArray(post.media) ? (post.media as string[]) : []);
    setTags(
      (post.outfitItems ?? []).map((item) => ({
        x: item.x,
        y: item.y,
        imageIndex: item.imageIndex,
        itemType: item.itemType,
        customLabel: item.customLabel ?? undefined,
        customLink: item.customLink ?? undefined,
        brand: item.brand ?? undefined,
        price: item.price ?? undefined,
      })),
    );
    setStep('image');
    setActiveImage(0);
    setPendingTag(null);
    setDeletePhotoIdx(null);
    setUploadError(null);
  }, [open]);

  const removePhoto = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setTags((prev) =>
      prev
        .filter((t) => t.imageIndex !== idx)
        .map((t) => (t.imageIndex > idx ? { ...t, imageIndex: t.imageIndex - 1 } : t)),
    );
    setActiveImage((prev) => {
      if (prev >= images.length - 1) return Math.max(0, images.length - 2);
      if (prev > idx) return prev - 1;
      return prev;
    });
    setDeletePhotoIdx(null);
  };

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const remaining = 10 - images.length;
    const toUpload = files.slice(0, remaining);
    if (toUpload.length === 0) return;

    setUploading(true);
    setUploadError(null);
    try {
      const urls = await uploadImages(toUpload);
      setImages((prev) => [...prev, ...urls]);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir imágenes');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (pendingTag) return;
    const rect = imgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingTag({ x, y, itemType: 'TOP', customLabel: '', customLink: '', brand: '', price: '' });
  };

  const confirmTag = () => {
    if (!pendingTag) return;
    const priceNum = parseFloat(pendingTag.price);
    setTags((prev) => [
      ...prev,
      {
        x: pendingTag.x,
        y: pendingTag.y,
        imageIndex: activeImage,
        itemType: pendingTag.itemType,
        customLabel: pendingTag.customLabel || undefined,
        customLink: pendingTag.customLink || undefined,
        brand: pendingTag.brand || undefined,
        price: !isNaN(priceNum) && priceNum > 0 ? priceNum : undefined,
      },
    ]);
    setPendingTag(null);
  };

  const removeTag = (idx: number) => setTags((prev) => prev.filter((_, i) => i !== idx));

  const updateTagField = (idx: number, field: keyof LocalTag, value: unknown) => {
    setTags((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));
  };

  const buildPayload = (data: FormData) => {
    const hashtagArr = data.hashtags
      ? data.hashtags.split(/[\s,]+/).filter(Boolean).map((t) => t.replace(/^#/, '').toLowerCase())
      : [];

    return {
      media: images,
      caption: data.caption || null,
      category: (data.category as PostCategory | undefined) ?? null,
      visibility: data.visibility,
      hashtags: hashtagArr,
      outfitItems: tags.length > 0 ? tags : [],
    };
  };

  const onSubmit = (data: FormData) => {
    updatePost(buildPayload(data), { onSuccess: () => onClose() });
  };

  const submitFromTagsStep = () => {
    const data = getValues();
    const result = schema.safeParse(data);
    if (!result.success) { setStep('details'); return; }
    updatePost(buildPayload(result.data), { onSuccess: () => onClose() });
  };

  if (!open) return null;

  const STEPS: Step[] = ['image', 'details', 'tags'];
  const stepIdx = STEPS.indexOf(step);
  const currentImageTags = tags.filter((t) => t.imageIndex === activeImage);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      <div className="card relative w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <div>
            <h2 className="font-serif text-base font-semibold leading-none">Editar outfit</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {step === 'image' ? 'Imágenes' : step === 'details' ? 'Detalles' : 'Prendas'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    'h-1.5 w-6 rounded-full transition-colors cursor-pointer',
                    i <= stepIdx ? 'bg-primary' : 'bg-muted',
                  )}
                  onClick={() => setStep(s)}
                />
              ))}
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">✕</button>
          </div>
        </div>

        {step === 'image' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Imágenes del post ({images.length}/10)
              </p>
              {images.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Añadir fotos
                    </>
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleAddPhotos}
              />
            </div>

            {images.length > 0 && (
              <div className="flex gap-3 overflow-x-auto py-2 px-1">
                {images.map((src, i) => (
                  <div key={i} className="relative flex-shrink-0 group/thumb">
                    <button
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={cn(
                        'h-16 w-16 rounded-lg overflow-hidden ring-2 transition-all',
                        activeImage === i ? 'ring-primary' : 'ring-transparent hover:ring-primary/40',
                      )}
                    >
                      <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDeletePhotoIdx(i); }}
                      className="absolute -top-2 -right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow-md opacity-0 group-hover/thumb:opacity-100 transition-opacity hover:scale-110"
                      title="Eliminar foto"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}

                {images.length < 10 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            )}

            {images.length > 0 && (
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
                <img
                  src={images[activeImage]}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                <div className="absolute right-3 top-3 flex items-center gap-2">
                  {images.length > 1 && (
                    <span className="rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                      {activeImage + 1}/{images.length}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeletePhotoIdx(activeImage)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-destructive transition-colors"
                    title="Eliminar esta foto"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {images.length === 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex flex-col items-center justify-center w-full py-14 rounded-xl border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                {uploading ? (
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent mb-2" />
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-50">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                )}
                <p className="text-sm font-medium">{uploading ? 'Subiendo...' : 'Añadir imágenes'}</p>
                <p className="text-xs mt-0.5">Haz clic para seleccionar fotos</p>
              </button>
            )}

            {uploadError && (
              <p className="text-xs text-destructive">{uploadError}</p>
            )}

            <button
              type="button"
              onClick={() => setStep('details')}
              disabled={images.length === 0 || uploading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Editar detalles →
            </button>

            <ConfirmDialog
              open={deletePhotoIdx !== null}
              title="Eliminar foto"
              description={
                images.length <= 1
                  ? 'Esta es la última foto del post. No puedes eliminarla, el post necesita al menos una imagen.'
                  : `¿Eliminar la foto ${(deletePhotoIdx ?? 0) + 1}? Las etiquetas de prendas en esta imagen también se eliminarán.`
              }
              confirmLabel={images.length <= 1 ? 'Entendido' : 'Eliminar foto'}
              cancelLabel={images.length <= 1 ? '' : 'Cancelar'}
              variant={images.length <= 1 ? 'default' : 'danger'}
              onConfirm={() => {
                if (images.length <= 1) {
                  setDeletePhotoIdx(null);
                  return;
                }
                removePhoto(deletePhotoIdx!);
              }}
              onCancel={() => setDeletePhotoIdx(null)}
            />
          </div>
        )}

        {step === 'details' && (
          <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Descripción</label>
              <textarea
                {...register('caption')}
                rows={3}
                placeholder="Describe tu outfit..."
                className="field-input resize-none"
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {watch('caption')?.length ?? 0}/2000
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Categoría</label>
                <select {...register('category')} className="field-input">
                  <option value="">Sin categoría</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0) + c.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Visibilidad</label>
                <select {...register('visibility')} className="field-input">
                  {Object.entries(VISIBILITY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Hashtags</label>
              <input {...register('hashtags')} placeholder="#ootd #style #vintage" className="field-input" />
              <p className="text-[10px] text-muted-foreground">Separados por espacios o comas</p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep('image')} className="btn-outline flex-1">
                ← Imágenes
              </button>
              <button type="button" onClick={() => setStep('tags')} className="btn-outline flex-1">
                Prendas →
              </button>
              <button type="submit" disabled={isPending} className="btn-primary flex-1">
                {isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}

        {step === 'tags' && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Haz clic en la imagen para etiquetar una prenda.
            </p>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => {
                  const tagCount = tags.filter((t) => t.imageIndex === i).length;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setActiveImage(i); setPendingTag(null); }}
                      className={cn(
                        'relative flex-shrink-0 h-12 w-12 rounded-lg overflow-hidden ring-2 transition-all',
                        activeImage === i ? 'ring-primary' : 'ring-transparent hover:ring-primary/40',
                      )}
                    >
                      <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                      {tagCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                          {tagCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="relative aspect-[4/5] cursor-crosshair overflow-hidden rounded-xl bg-muted select-none">
              <img
                ref={imgRef}
                src={images[activeImage]}
                alt="Outfit"
                className="h-full w-full object-cover"
                onClick={handleImageClick}
                draggable={false}
              />

              {currentImageTags.map((tag, _i) => {
                const globalIdx = tags.indexOf(tag);
                return (
                  <div
                    key={globalIdx}
                    className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground text-xs font-bold shadow"
                    style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                    title={tag.customLabel ?? ITEM_CONFIG[tag.itemType].label}
                  >
                    {globalIdx + 1}
                  </div>
                );
              })}

              {pendingTag && (
                <div
                  className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-muted text-xs font-bold shadow animate-pulse"
                  style={{ left: `${pendingTag.x}%`, top: `${pendingTag.y}%` }}
                >
                  +
                </div>
              )}

              {images.length > 1 && (
                <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                  Foto {activeImage + 1}/{images.length}
                </span>
              )}
            </div>

            {pendingTag && (
              <div className="card p-3 space-y-2 border-primary/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Nueva prenda
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <ItemTypeSelect
                    value={pendingTag.itemType}
                    onChange={(val) => setPendingTag({ ...pendingTag, itemType: val })}
                  />
                  <input
                    value={pendingTag.customLabel}
                    onChange={(e) => setPendingTag({ ...pendingTag, customLabel: e.target.value })}
                    placeholder="Nombre (ej. Blazer azul)"
                    className="field-input text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={pendingTag.brand}
                    onChange={(e) => setPendingTag({ ...pendingTag, brand: e.target.value })}
                    placeholder="Marca (ej. Zara)"
                    className="field-input text-xs"
                  />
                  <input
                    value={pendingTag.price}
                    onChange={(e) => setPendingTag({ ...pendingTag, price: e.target.value })}
                    placeholder="Precio (ej. 29.99)"
                    type="number"
                    min="0"
                    step="0.01"
                    className="field-input text-xs"
                  />
                </div>
                <input
                  value={pendingTag.customLink}
                  onChange={(e) => setPendingTag({ ...pendingTag, customLink: e.target.value })}
                  placeholder="Link de compra (opcional)"
                  className="field-input text-xs"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPendingTag(null)} className="btn-ghost flex-1 text-xs">
                    Cancelar
                  </button>
                  <button type="button" onClick={confirmTag} className="btn-primary flex-1 text-xs">
                    Añadir prenda
                  </button>
                </div>
              </div>
            )}

            {tags.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Prendas etiquetadas ({tags.length})
                </p>
                {tags.map((tag, i) => (
                  <div key={i} className="card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                          {i + 1}
                        </span>
                        <ItemTypeSelect
                          value={tag.itemType}
                          onChange={(val) => updateTagField(i, 'itemType', val)}
                          className="w-[140px]"
                        />
                        {images.length > 1 && (
                          <span className="text-[10px] text-muted-foreground">Foto {tag.imageIndex + 1}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTag(i)}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        ✕ Eliminar
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={tag.customLabel ?? ''}
                        onChange={(e) => updateTagField(i, 'customLabel', e.target.value || undefined)}
                        placeholder="Nombre de la prenda"
                        className="field-input text-xs"
                      />
                      <input
                        value={tag.brand ?? ''}
                        onChange={(e) => updateTagField(i, 'brand', e.target.value || undefined)}
                        placeholder="Marca"
                        className="field-input text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={tag.price ?? ''}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          updateTagField(i, 'price', isNaN(v) ? undefined : v);
                        }}
                        placeholder="Precio"
                        type="number"
                        min="0"
                        step="0.01"
                        className="field-input text-xs"
                      />
                      <input
                        value={tag.customLink ?? ''}
                        onChange={(e) => updateTagField(i, 'customLink', e.target.value || undefined)}
                        placeholder="Link de compra"
                        className="field-input text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep('details')} className="btn-outline flex-1">
                ← Detalles
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={submitFromTagsStep}
                className="btn-primary flex-1"
              >
                {isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
