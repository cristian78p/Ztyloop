import { useSavedPosts } from '@/hooks/useSaves';
import { PostCard } from '@/components/posts/PostCard';

export function SavedPage() {
  const { data, isLoading, isError } = useSavedPosts();

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl font-bold">Guardados</h1>

      {isLoading && (
        <div className="space-y-4">
          {[1,2,3].map((i) => <div key={i} className="h-72 animate-pulse rounded-xl bg-card" />)}
        </div>
      )}

      {isError && (
        <div className="card p-8 text-center text-sm text-destructive">
          No se pudieron cargar los guardados.
        </div>
      )}

      {!isLoading && !isError && data?.posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {!isLoading && !isError && data?.posts.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          <p className="mb-3 text-4xl">🔖</p>
          <p className="font-serif text-lg font-semibold text-foreground">Sin guardados aún</p>
          <p className="mt-1 text-sm">Guarda outfits que te inspiren para verlos aquí.</p>
        </div>
      )}
    </div>
  );
}
