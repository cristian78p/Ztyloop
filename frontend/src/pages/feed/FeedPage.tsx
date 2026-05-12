import { useState } from 'react';
import { useFeed, useFollowingFeed } from '@/hooks/usePosts';
import { PostCard } from '@/components/posts/PostCard';
import { cn } from '@/utils/cn';

type Tab = 'forYou' | 'following';

export function FeedPage() {
  const [tab, setTab] = useState<Tab>('forYou');

  const forYou = useFeed();
  const following = useFollowingFeed();

  const { data, isLoading, isError } = tab === 'forYou' ? forYou : following;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="sticky top-14 z-30 -mx-4 flex border-b border-border bg-background/95 backdrop-blur-md px-4">
        {(['forYou', 'following'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              tab === t
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'forYou' ? 'Para ti' : 'Siguiendo'}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-80 animate-pulse rounded-xl bg-card" />)}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-sm text-destructive">
          No se pudo cargar el feed.
        </div>
      )}

      {!isLoading && !isError && data?.posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {!isLoading && !isError && data?.posts.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          <p className="mb-3 text-4xl">👗</p>
          <p className="font-serif text-lg font-semibold text-foreground">
            {tab === 'following' ? 'Sigue a creadores para ver su contenido' : 'Aún no hay outfits'}
          </p>
          <p className="mt-1 text-sm">
            {tab === 'following' ? 'Ve a Explorar para encontrar gente interesante' : '¡Sé el primero en publicar!'}
          </p>
        </div>
      )}
    </div>
  );
}
