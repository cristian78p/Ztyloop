import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdatePost } from '@/hooks/usePosts';
import { cn } from '@/utils/cn';
import type { ItemType, PostCategory, Post } from '@/types';
import type { OutfitItemInput } from '@/services/post.service';

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES: PostCategory[] = [
  'CASUAL','FORMAL','COSPLAY','STREETWEAR','MINIMALIST',
  'VINTAGE','AESTHETIC','GOTHIC','Y2K','PREPPY',
];
const ITEM_TYPES: ItemType[] = [
  'TOP','BOTTOM','SHOES','OUTERWEAR','ACCESSORY',
  'BAG','HEADWEAR','EYEWEAR','JEWELRY','OTHER',
];
const ITEM_LABELS: Record<ItemType, string> = {
  TOP:'Top', BOTTOM:'Parte baja', SHOES:'Zapatos', OUTERWEAR:'Abrigo',
  ACCESSORY:'Accesorio', BAG:'Bolso', HEADWEAR:'Sombrero', EYEWEAR:'Gafas',
  JEWELRY:'Joyería', OTHER:'Otro',
};
const VISIBILITY_LABELS = {
  PUBLIC: 'Público',
  FOLLOWERS_ONLY: 'Solo seguidores',
  PRIVATE: 'Privado',
} as const;

// ─── Schema ──────────────────────────────────────────────────────────────────

const schema = z.object({
  mediaUrl: z.string().url('Debe ser una URL válida'),
  caption: z.string().max(2000).optional(),
  category: z.enum([
    'CASUAL','FORMAL','COSPLAY','STREETWEAR','MINIMALIST',
    'VINTAGE','AESTHETIC','GOTHIC','Y2K','PREPPY',
  ] as const).optional(),
  hashtags: z.string().optional(),
  visibility: z.enum(['PUBLIC','FOLLOWERS_ONLY','PRIVATE'] as const).default('PUBLIC'),
});
type FormData = z.infer<typeof schema>;

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

export function EditPostModal({ post, open, onClose }: EditPostModalProps) {
  const { mutate: updatePost, isPending } = useUpdatePost(post.id);

  const [step, setStep] = useState<Step>('image');
  const [tags, setTags] = useState<LocalTag[]>([]);
  const [pendingTag, setPendingTag] = useState<PendingTag | null>(null);
  const [cropPosition, setCropPosition] = useState<'top' | 'center' | 'bottom'>('center');
  const imgRef = useRef<HTMLImageElement>(null);

  const images = Array.isArray(post.media) ? (post.media as string[]) : [];

  const { register, handleSubmit, reset, watch, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      mediaUrl: images[0] ?? '',
      caption: post.caption ?? '',
      category: (post.category as PostCategory | undefined) ?? undefined,
      hashtags: post.hashtags?.map((h) => `#${h.hashtag.name}`).join(' ') ?? '',
      visibility: post.visibility as 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE',
    },
  });

  const mediaUrl = watch('mediaUrl');

  // Sync form + tags every time the modal opens with (possibly updated) post data
  useEffect(() => {
    if (!open) return;
    reset({
      mediaUrl: images[0] ?? '',
      caption: post.caption ?? '',
      category: (post.category as PostCategory | undefined) ?? undefined,
      hashtags: post.hashtags?.map((h) => `#${h.hashtag.name}`).join(' ') ?? '',
      visibility: post.visibility as 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE',
    });
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
    setPendingTag(null);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Image tagger handlers ────────────────────────────────────────────────

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
        imageIndex: 0,
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

  // ─── Submit ───────────────────────────────────────────────────────────────

  const buildPayload = (data: FormData) => {
    const hashtagArr = data.hashtags
      ? data.hashtags.split(/[\s,]+/).filter(Boolean).map((t) => t.replace(/^#/, '').toLowerCase())
      : [];

    return {
      media: [data.mediaUrl],
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      <div className="card relative w-full max-w-lg animate-slide-up overflow-hidden">

        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-serif text-base font-semibold leading-none">Editar outfit</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {step === 'image' ? 'Imagen' : step === 'details' ? 'Detalles' : 'Prendas'}
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
                  onClick={() => i < stepIdx && setStep(s)}
                />
              ))}
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">✕</button>
          </div>
        </div>

        {/* ── Step 1: Imagen ───────────────────────────────── */}
        {step === 'image' && (
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">URL de la imagen</label>
              <input
                {...register('mediaUrl')}
                placeholder="https://ejemplo.com/foto.jpg"
                className="field-input"
              />
              {errors.mediaUrl && (
                <p className="text-xs text-destructive">{errors.mediaUrl.message}</p>
              )}
            </div>

            {mediaUrl && !errors.mediaUrl && (
              <div className="space-y-2">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
                  <img
                    src={mediaUrl}
                    alt="Preview"
                    className={`h-full w-full object-cover transition-all duration-200 object-${cropPosition}`}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <div className="flex gap-1">
                  {(['top', 'center', 'bottom'] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setCropPosition(pos)}
                      className={cn(
                        'flex-1 rounded-lg py-1 text-xs font-medium transition-colors',
                        cropPosition === pos
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80',
                      )}
                    >
                      {pos === 'top' ? 'Arriba' : pos === 'center' ? 'Centro' : 'Abajo'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={!mediaUrl || !!errors.mediaUrl}
              onClick={() => setStep('details')}
              className="btn-primary w-full"
            >
              Siguiente →
            </button>
          </div>
        )}

        {/* ── Step 2: Detalles ────────────────────────────── */}
        {step === 'details' && (
          <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">

            {/* Caption */}
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
              {/* Category */}
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

              {/* Visibility */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Visibilidad</label>
                <select {...register('visibility')} className="field-input">
                  {Object.entries(VISIBILITY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Hashtags */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Hashtags</label>
              <input {...register('hashtags')} placeholder="#ootd #style #vintage" className="field-input" />
              <p className="text-[10px] text-muted-foreground">Separados por espacios o comas</p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep('image')} className="btn-outline flex-1">
                ← Imagen
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

        {/* ── Step 3: Prendas ─────────────────────────────── */}
        {step === 'tags' && (
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            <p className="text-sm text-muted-foreground">
              Haz clic en la imagen para etiquetar una prenda.
            </p>

            {/* Interactive image */}
            <div className="relative aspect-[4/5] cursor-crosshair overflow-hidden rounded-xl bg-muted select-none">
              <img
                ref={imgRef}
                src={mediaUrl}
                alt="Outfit"
                className={`h-full w-full object-cover object-${cropPosition}`}
                onClick={handleImageClick}
                draggable={false}
              />

              {/* Confirmed tags */}
              {tags.map((tag, i) => (
                <div
                  key={i}
                  className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground text-xs font-bold shadow"
                  style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                  title={tag.customLabel ?? ITEM_LABELS[tag.itemType]}
                >
                  {i + 1}
                </div>
              ))}

              {/* Pending tag dot */}
              {pendingTag && (
                <div
                  className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-muted text-xs font-bold shadow animate-pulse"
                  style={{ left: `${pendingTag.x}%`, top: `${pendingTag.y}%` }}
                >
                  +
                </div>
              )}
            </div>

            {/* Pending tag form */}
            {pendingTag && (
              <div className="card p-3 space-y-2 border-primary/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Nueva prenda
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={pendingTag.itemType}
                    onChange={(e) => setPendingTag({ ...pendingTag, itemType: e.target.value as ItemType })}
                    className="field-input text-xs"
                  >
                    {ITEM_TYPES.map((t) => <option key={t} value={t}>{ITEM_LABELS[t]}</option>)}
                  </select>
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

            {/* Editable tags list */}
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
                        <select
                          value={tag.itemType}
                          onChange={(e) => updateTagField(i, 'itemType', e.target.value)}
                          className="field-input text-xs py-0.5 h-auto"
                        >
                          {ITEM_TYPES.map((t) => <option key={t} value={t}>{ITEM_LABELS[t]}</option>)}
                        </select>
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
