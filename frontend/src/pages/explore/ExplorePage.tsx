import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { postService } from '@/services/post.service';
import { PostCard } from '@/components/posts/PostCard';
import type { PostCategory } from '@/types';

const CATEGORIES: { value: PostCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todo' },
  { value: 'STREETWEAR', label: 'Streetwear' },
  { value: 'CASUAL', label: 'Casual' },
  { value: 'FORMAL', label: 'Formal' },
  { value: 'AESTHETIC', label: 'Aesthetic' },
  { value: 'Y2K', label: 'Y2K' },
  { value: 'GOTHIC', label: 'Gothic' },
  { value: 'VINTAGE', label: 'Vintage' },
  { value: 'MINIMALIST', label: 'Minimalist' },
  { value: 'PREPPY', label: 'Preppy' },
  { value: 'COSPLAY', label: 'Cosplay' },
];

export function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState<PostCategory | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['explore', activeCategory],
    queryFn: () => postService.getFeed(1, 50),
  });

  const query = search.trim().toLowerCase().replace(/^#/, '');

  const posts = data?.posts.filter((p) => {
    const matchCategory = activeCategory === 'ALL' || p.category === activeCategory;
    if (!query) return matchCategory;
    const matchCaption = p.caption?.toLowerCase().includes(query) ?? false;
    const matchTag = p.hashtags?.some((h) => h.hashtag.name.toLowerCase().includes(query)) ?? false;
    return matchCategory && (matchCaption || matchTag);
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Explorar</h1>

      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por #etiqueta o descripción..."
          className="field-input pl-9"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveCategory(value)}
            className={
              activeCategory === value
                ? 'shrink-0 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground'
                : 'shrink-0 rounded-full border border-border bg-transparent px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            }
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">
          Error al cargar los posts. Intenta de nuevo.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-4">
          {posts && posts.length > 0 ? (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-4xl mb-3">👗</p>
              <p className="font-medium">
                {query ? `Sin resultados para "${query}"` : 'No hay outfits en esta categoría aún'}
              </p>
              <p className="text-sm mt-1">
                {query ? 'Prueba con otra etiqueta o descripción' : '¡Sé el primero en publicar!'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
