import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePost } from '@/hooks/usePosts';
import { cn } from '@/utils/cn';
import type { ItemType, PostCategory } from '@/types';
import type { OutfitItemInput } from '@/services/post.service';

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

const schema = z.object({
  mediaUrl: z.string().url('Debe ser una URL válida'),
  caption: z.string().max(500).optional(),
  category: z.enum(['CASUAL','FORMAL','COSPLAY','STREETWEAR','MINIMALIST','VINTAGE','AESTHETIC','GOTHIC','Y2K','PREPPY'] as const).optional(),
  hashtags: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

type Step = 'image' | 'details' | 'tags';

interface PendingTag {
  x: number; y: number;
  itemType: ItemType;
  customLabel: string;
  customLink: string;
}

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreatePostModal({ open, onClose }: CreatePostModalProps) {
  const { mutate: createPost, isPending } = useCreatePost();
  const [step, setStep] = useState<Step>('image');
  const [tags, setTags] = useState<OutfitItemInput[]>([]);
  const [pendingTag, setPendingTag] = useState<PendingTag | null>(null);
  const [cropPosition, setCropPosition] = useState<'top' | 'center' | 'bottom'>('center');
  const imgRef = useRef<HTMLImageElement>(null);

  const { register, handleSubmit, reset, watch, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const mediaUrl = watch('mediaUrl');

  useEffect(() => { if (!open) { reset(); setStep('image'); setTags([]); setPendingTag(null); setCropPosition('center'); } }, [open, reset]);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = imgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingTag({ x, y, itemType: 'TOP', customLabel: '', customLink: '' });
  };

  const confirmTag = () => {
    if (!pendingTag) return;
    setTags((prev) => [...prev, {
      x: pendingTag.x, y: pendingTag.y,
      itemType: pendingTag.itemType,
      customLabel: pendingTag.customLabel || undefined,
      customLink: pendingTag.customLink || undefined,
      imageIndex: 0,
    }]);
    setPendingTag(null);
  };

  const onSubmit = (data: FormData) => {
    const hashtags = data.hashtags
      ? data.hashtags.split(/[\s,]+/).filter(Boolean).map((t) => t.replace(/^#/, ''))
      : undefined;

    createPost({
      media: [data.mediaUrl],
      caption: data.caption || undefined,
      category: data.category || undefined,
      hashtags,
      outfitItems: tags.length > 0 ? tags : undefined,
    }, { onSuccess: () => onClose() });
  };

  if (!open) return null;

  const STEPS: Step[] = ['image', 'details', 'tags'];
  const stepIdx = STEPS.indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      <div className="card relative w-full max-w-lg animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-serif text-base font-semibold">Nuevo outfit</h2>
          <div className="flex items-center gap-4">
            {/* Step indicators */}
            <div className="flex gap-1.5">
              {STEPS.map((s, i) => (
                <div key={s} className={cn('h-1.5 w-6 rounded-full transition-colors', i <= stepIdx ? 'bg-primary' : 'bg-muted')} />
              ))}
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
        </div>

        {/* Step 1: Image */}
        {step === 'image' && (
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">URL de la imagen *</label>
              <input {...register('mediaUrl')} placeholder="https://ejemplo.com/foto.jpg" className="field-input" />
              {errors.mediaUrl && <p className="text-xs text-destructive">{errors.mediaUrl.message}</p>}
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
            <button type="button" disabled={!mediaUrl || !!errors.mediaUrl} onClick={() => setStep('details')} className="btn-primary w-full">
              Siguiente →
            </button>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 'details' && (
          <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Caption</label>
              <textarea {...register('caption')} rows={3} placeholder="Describe tu outfit..." className="field-input resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Categoría</label>
                <select {...register('category')} className="field-input">
                  <option value="">Sin categoría</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Hashtags</label>
                <input {...register('hashtags')} placeholder="#ootd #style" className="field-input" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep('image')} className="btn-outline flex-1">← Atrás</button>
              <button type="button" onClick={() => setStep('tags')} className="btn-outline flex-1">Etiquetar prendas</button>
              <button type="submit" disabled={isPending} className="btn-primary flex-1">{isPending ? 'Publicando...' : 'Publicar'}</button>
            </div>
          </form>
        )}

        {/* Step 3: Outfit Tagger */}
        {step === 'tags' && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">Haz clic en la imagen para etiquetar una prenda.</p>
            <div className="relative aspect-[4/5] cursor-crosshair overflow-hidden rounded-xl bg-muted select-none">
              <img
                ref={imgRef}
                src={mediaUrl}
                alt="Outfit"
                className={`h-full w-full object-cover object-${cropPosition}`}
                onClick={handleImageClick}
                draggable={false}
              />
              {/* Existing tags */}
              {tags.map((tag, i) => (
                <div key={i} className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground text-xs font-bold shadow"
                  style={{ left: `${tag.x}%`, top: `${tag.y}%` }}>
                  {i + 1}
                </div>
              ))}
              {/* Pending tag */}
              {pendingTag && (
                <div className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-muted text-xs font-bold shadow animate-pulse"
                  style={{ left: `${pendingTag.x}%`, top: `${pendingTag.y}%` }}>+</div>
              )}
            </div>

            {/* Pending tag form */}
            {pendingTag && (
              <div className="card p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nueva prenda</p>
                <div className="grid grid-cols-2 gap-2">
                  <select value={pendingTag.itemType} onChange={(e) => setPendingTag({ ...pendingTag, itemType: e.target.value as ItemType })} className="field-input text-xs">
                    {ITEM_TYPES.map((t) => <option key={t} value={t}>{ITEM_LABELS[t]}</option>)}
                  </select>
                  <input value={pendingTag.customLabel} onChange={(e) => setPendingTag({ ...pendingTag, customLabel: e.target.value })} placeholder="Etiqueta (opcional)" className="field-input text-xs" />
                </div>
                <input value={pendingTag.customLink} onChange={(e) => setPendingTag({ ...pendingTag, customLink: e.target.value })} placeholder="URL de compra (opcional)" className="field-input text-xs" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPendingTag(null)} className="btn-ghost flex-1 text-xs">Cancelar</button>
                  <button type="button" onClick={confirmTag} className="btn-primary flex-1 text-xs">Añadir etiqueta</button>
                </div>
              </div>
            )}

            {tags.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prendas etiquetadas ({tags.length})</p>
                {tags.map((tag, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-muted px-3 py-1.5 text-xs">
                    <span className="font-medium">{i + 1}. {ITEM_LABELS[tag.itemType]}{tag.customLabel && ` — ${tag.customLabel}`}</span>
                    <button type="button" onClick={() => setTags((prev) => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep('details')} className="btn-outline flex-1">← Detalles</button>
              <button type="button" disabled={isPending} onClick={() => onSubmit(getValues())} className="btn-primary flex-1">
                {isPending ? 'Publicando...' : 'Publicar outfit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
