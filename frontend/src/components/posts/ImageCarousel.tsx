import { useState, useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  className?: string;
  renderOverlay?: (imageIndex: number) => React.ReactNode;
}

export function ImageCarousel({ images, alt = 'Imagen', className, renderOverlay }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [ratio, setRatio] = useState(4 / 5);
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (images.length === 0) return;
    const img = new Image();
    img.onload = () => {
      const r = img.width / img.height;
      const clamped = Math.max(0.667, Math.min(1.78, r));
      setRatio(clamped);
    };
    img.src = images[current];
  }, [current, images]);

  if (images.length === 0) return null;

  const prev = () => setCurrent((c) => (c > 0 ? c - 1 : c));
  const next = () => setCurrent((c) => (c < images.length - 1 ? c + 1 : c));
  const isCarousel = images.length > 1;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden bg-black/5 dark:bg-white/5 group/carousel transition-[aspect-ratio] duration-300', className)}
      style={{ aspectRatio: `${ratio}` }}
    >
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((src, i) => (
          <div key={i} className="relative h-full w-full flex-shrink-0">
            {brokenImages.has(i) ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="3" x2="21" y2="21" />
                </svg>
                <span className="text-xs">Imagen no disponible</span>
              </div>
            ) : (
              <img
                src={src}
                alt={`${alt} ${i + 1}`}
                className="h-full w-full object-contain"
                loading={i === 0 ? 'eager' : 'lazy'}
                draggable={false}
                onError={() => setBrokenImages((prev) => new Set(prev).add(i))}
              />
            )}
            {renderOverlay?.(i)}
          </div>
        ))}
      </div>

      {isCarousel && (
        <>
          {current > 0 && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); prev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black/70"
              aria-label="Anterior"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          {current < images.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); next(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black/70"
              aria-label="Siguiente"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </>
      )}

      {isCarousel && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent(i); }}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70',
              )}
              aria-label={`Imagen ${i + 1}`}
            />
          ))}
        </div>
      )}

      {isCarousel && (
        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
          {current + 1}/{images.length}
        </span>
      )}
    </div>
  );
}
