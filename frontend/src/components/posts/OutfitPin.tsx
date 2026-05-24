import { useState, useEffect, useRef } from 'react';

const ITEM_LABELS: Record<string, string> = {
  TOP: 'Top', BOTTOM: 'Parte baja', SHOES: 'Zapatos', OUTERWEAR: 'Abrigo',
  ACCESSORY: 'Accesorio', BAG: 'Bolso', HEADWEAR: 'Sombrero', EYEWEAR: 'Gafas',
  JEWELRY: 'Joyería', OTHER: 'Otro',
};

interface OutfitPinProps {
  index: number;
  x: number;
  y: number;
  itemType: string;
  customLabel?: string | null;
  brand?: string | null;
  price?: number | null;
  customLink?: string | null;
}

export function OutfitPin({ index, x, y, itemType, customLabel, brand, price, customLink }: OutfitPinProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const goDown = y < 25;
  const goRight = x > 70;
  const goLeft = x < 30;

  const label = customLabel ?? ITEM_LABELS[itemType] ?? itemType;

  return (
    <div
      ref={ref}
      className="absolute z-10"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={`
          flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-lg cursor-pointer
          transition-all duration-200
          ${open
            ? 'bg-primary text-primary-foreground scale-110 ring-2 ring-primary/40'
            : 'bg-black/60 text-white border-2 border-white/80 hover:bg-primary hover:border-primary hover:scale-110'
          }
        `}
      >
        {index}
      </button>

      {open && (
        <div
          ref={tooltipRef}
          className={`
            absolute z-20 w-56 rounded-xl bg-card border border-border shadow-xl
            animate-fade-in
            ${goDown ? 'top-full mt-2' : 'bottom-full mb-2'}
            ${goRight ? 'right-0' : goLeft ? 'left-0' : 'left-1/2 -translate-x-1/2'}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`
            absolute w-3 h-3 bg-card border border-border rotate-45
            ${goDown
              ? '-top-1.5 border-r-0 border-b-0'
              : '-bottom-1.5 border-l-0 border-t-0'
            }
            ${goRight ? 'right-4' : goLeft ? 'left-4' : 'left-1/2 -translate-x-1/2'}
          `} />

          <div className="relative p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wide">
                {ITEM_LABELS[itemType] ?? itemType}
              </span>
            </div>

            {customLabel && (
              <p className="text-sm font-medium text-foreground leading-snug">{customLabel}</p>
            )}

            {(brand || price != null) && (
              <div className="flex items-center gap-2">
                {brand && (
                  <span className="text-xs text-muted-foreground">{brand}</span>
                )}
                {price != null && (
                  <span className="text-sm font-bold text-primary">
                    ${price.toLocaleString()}
                  </span>
                )}
              </div>
            )}

            {customLink && (
              <a
                href={customLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Comprar aquí
              </a>
            )}

            {!customLabel && !brand && price == null && !customLink && (
              <p className="text-xs text-muted-foreground">{label}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
