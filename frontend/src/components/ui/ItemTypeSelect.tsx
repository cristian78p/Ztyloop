import { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';
import type { ItemType } from '@/types';

const ITEM_TYPES: ItemType[] = [
  'TOP','BOTTOM','SHOES','OUTERWEAR','ACCESSORY',
  'BAG','HEADWEAR','EYEWEAR','JEWELRY','OTHER',
];

const ITEM_CONFIG: Record<ItemType, { label: string }> = {
  TOP:       { label: 'Top' },
  BOTTOM:    { label: 'Parte baja' },
  SHOES:     { label: 'Zapatos' },
  OUTERWEAR: { label: 'Abrigo' },
  ACCESSORY: { label: 'Accesorio' },
  BAG:       { label: 'Bolso' },
  HEADWEAR:  { label: 'Sombrero' },
  EYEWEAR:   { label: 'Gafas' },
  JEWELRY:   { label: 'Joyería' },
  OTHER:     { label: 'Otro' },
};

interface ItemTypeSelectProps {
  value: ItemType;
  onChange: (value: ItemType) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function ItemTypeSelect({ value, onChange, className, size = 'sm' }: ItemTypeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const current = ITEM_CONFIG[value];
  const isSm = size === 'sm';

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg border border-border bg-card transition-all',
          'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          isOpen && 'border-primary ring-2 ring-primary/20',
          isSm ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm',
        )}
      >
        <span className="flex-1 text-left font-medium truncate">{current.label}</span>
        <svg
          width={isSm ? 12 : 14}
          height={isSm ? 12 : 14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn('text-muted-foreground transition-transform shrink-0', isOpen && 'rotate-180')}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className={cn(
          'absolute z-50 mt-1 w-full min-w-[180px] rounded-xl border border-border bg-card shadow-lg',
          'animate-in fade-in-0 zoom-in-95 duration-100',
          'max-h-[240px] overflow-y-auto',
        )}>
          <div className="p-1">
            {ITEM_TYPES.map((type) => {
              const config = ITEM_CONFIG[type];
              const isSelected = type === value;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => { onChange(type); setIsOpen(false); }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                    isSelected
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted',
                    isSm ? 'text-xs' : 'text-sm',
                  )}
                >
                  <span className="flex-1 font-medium">{config.label}</span>
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export { ITEM_CONFIG, ITEM_TYPES };
