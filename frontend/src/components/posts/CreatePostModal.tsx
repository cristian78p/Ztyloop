import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePost } from '@/hooks/usePosts';
import { uploadImages } from '@/services/post.service';
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

const MAX_FILES = 10;
const MAX_SIZE_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const schema = z.object({
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
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [activePreview, setActivePreview] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!open) {
      reset(); setStep('image'); setTags([]); setPendingTag(null);
      setFiles([]); setPreviews([]); setActivePreview(0);
      setUploading(false); setUploadError(null); setDragOver(false);
    }
  }, [open, reset]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    setActivePreview(0);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const valid: File[] = [];
    const errorMsgs: string[] = [];

    for (const file of fileArray) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errorMsgs.push(`${file.name}: formato no soportado`);
      } else if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        errorMsgs.push(`${file.name}: excede ${MAX_SIZE_MB}MB`);
      } else {
        valid.push(file);
      }
    }

    setFiles((prev) => {
      const total = [...prev, ...valid].slice(0, MAX_FILES);
      if (prev.length + valid.length > MAX_FILES) errorMsgs.push(`Máximo ${MAX_FILES} imágenes`);
      return total;
    });

    if (errorMsgs.length > 0) setUploadError(errorMsgs.join('. '));
    else setUploadError(null);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadError(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  }, [addFiles]);

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
      imageIndex: activePreview,
    }]);
    setPendingTag(null);
  };

  const onSubmit = async (data: FormData) => {
    if (files.length === 0) return;
    try {
      setUploading(true);
      setUploadError(null);
      const urls = await uploadImages(files);
      const hashtags = data.hashtags
        ? data.hashtags.split(/[\s,]+/).filter(Boolean).map((t) => t.replace(/^#/, ''))
        : undefined;

      createPost({
        media: urls,
        type: urls.length > 1 ? 'CAROUSEL' : 'IMAGE',
        caption: data.caption || undefined,
        category: data.category || undefined,
        hashtags,
        outfitItems: tags.length > 0 ? tags : undefined,
      }, { onSuccess: () => onClose() });
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir imágenes');
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  const STEPS: Step[] = ['image', 'details', 'tags'];
  const stepIdx = STEPS.indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      <div className="card relative w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <h2 className="font-serif text-base font-semibold">Nuevo outfit</h2>
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              {STEPS.map((s, i) => (
                <div key={s} className={cn('h-1.5 w-6 rounded-full transition-colors', i <= stepIdx ? 'bg-primary' : 'bg-muted')} />
              ))}
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
        </div>

        {/* Step 1: Image Upload */}
        {step === 'image' && (
          <div className="p-5 space-y-4">
            <div
              className={cn(
                'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors',
                dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
                files.length > 0 ? 'p-3' : 'p-8 cursor-pointer',
              )}
              onClick={() => files.length === 0 && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
              />

              {files.length === 0 ? (
                <>
                  <div className="mb-3 rounded-full bg-muted p-3">
                    <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium">Arrastra tus fotos aquí</p>
                  <p className="text-xs text-muted-foreground mt-1">o haz clic para seleccionar</p>
                  <p className="text-xs text-muted-foreground mt-2">JPG, PNG, WebP o GIF — máx. {MAX_SIZE_MB}MB</p>
                </>
              ) : (
                <div className="w-full">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {previews.map((src, i) => (
                      <div
                        key={i}
                        className={cn(
                          'relative flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden cursor-pointer ring-2 transition-all',
                          activePreview === i ? 'ring-primary' : 'ring-transparent hover:ring-primary/40',
                        )}
                        onClick={(e) => { e.stopPropagation(); setActivePreview(i); }}
                      >
                        <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white text-[10px] hover:bg-destructive transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {files.length < MAX_FILES && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-shrink-0 h-16 w-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">{files.length} de {MAX_FILES} fotos</p>
                </div>
              )}
            </div>

            {files.length > 0 && (
              <div className="relative overflow-hidden rounded-xl bg-muted">
                <img
                  src={previews[activePreview]}
                  alt="Preview principal"
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              </div>
            )}

            {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}

            <button type="button" disabled={files.length === 0} onClick={() => setStep('details')} className="btn-primary w-full">
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
              <button type="button" onClick={() => setStep('tags')} className="btn-outline flex-1">Etiquetar</button>
              <button type="submit" disabled={isPending || uploading} className="btn-primary flex-1">
                {uploading ? 'Subiendo...' : isPending ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Tags */}
        {step === 'tags' && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">Haz clic en la imagen para etiquetar una prenda.</p>

            {files.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {previews.map((src, i) => {
                  const tagCount = tags.filter((t) => t.imageIndex === i).length;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setActivePreview(i); setPendingTag(null); }}
                      className={cn(
                        'relative flex-shrink-0 h-12 w-12 rounded-lg overflow-hidden ring-2 transition-all',
                        activePreview === i ? 'ring-primary' : 'ring-transparent hover:ring-primary/40',
                      )}
                    >
                      <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                      {tagCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold">{tagCount}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="relative cursor-crosshair overflow-hidden rounded-xl bg-muted select-none">
              <img
                ref={imgRef}
                src={previews[activePreview]}
                alt="Outfit"
                className="w-full h-auto max-h-[60vh] object-contain"
                onClick={handleImageClick}
                draggable={false}
              />
              {tags.filter((t) => t.imageIndex === activePreview).map((tag) => {
                const idx = tags.indexOf(tag);
                return (
                  <div key={idx} className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground text-xs font-bold shadow"
                    style={{ left: `${tag.x}%`, top: `${tag.y}%` }}>
                    {idx + 1}
                  </div>
                );
              })}
              {pendingTag && (
                <div className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-muted text-xs font-bold shadow animate-pulse"
                  style={{ left: `${pendingTag.x}%`, top: `${pendingTag.y}%` }}>+</div>
              )}
            </div>

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
                    <span className="font-medium">
                      {i + 1}. {ITEM_LABELS[tag.itemType]}{tag.customLabel && ` — ${tag.customLabel}`}
                      {files.length > 1 && <span className="text-muted-foreground"> (Foto {(tag.imageIndex ?? 0) + 1})</span>}
                    </span>
                    <button type="button" onClick={() => setTags((prev) => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">✕</button>
                  </div>
                ))}
              </div>
            )}

            {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep('details')} className="btn-outline flex-1">← Detalles</button>
              <button type="button" disabled={isPending || uploading} onClick={() => onSubmit(getValues())} className="btn-primary flex-1">
                {uploading ? 'Subiendo...' : isPending ? 'Publicando...' : 'Publicar outfit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
