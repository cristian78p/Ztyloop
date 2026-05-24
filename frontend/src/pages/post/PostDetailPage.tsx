import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePost } from '@/hooks/usePosts';
import { VoteButton } from '@/components/posts/VoteButton';
import { SaveButton } from '@/components/posts/SaveButton';
import { ImageCarousel } from '@/components/posts/ImageCarousel';
import { OutfitPin } from '@/components/posts/OutfitPin';
import { CommentSection } from '@/components/comments/CommentSection';
import { EditPostModal } from '@/components/posts/EditPostModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatDistanceToNow } from '@/utils/date';
import { useAuth } from '@/hooks/useAuth';
import { useDeletePost } from '@/hooks/usePosts';
import { useNavigate } from 'react-router-dom';

const ITEM_LABELS: Record<string, string> = {
  TOP: 'Top', BOTTOM: 'Parte baja', SHOES: 'Zapatos', OUTERWEAR: 'Abrigo',
  ACCESSORY: 'Accesorio', BAG: 'Bolso', HEADWEAR: 'Sombrero', EYEWEAR: 'Gafas',
  JEWELRY: 'Joyería', OTHER: 'Otro',
};

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: post, isLoading, isError } = usePost(id!);
  const { user } = useAuth();
  const { mutate: deletePost, isPending: deleting } = useDeletePost();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-96 animate-pulse rounded-xl bg-card" />
        <div className="h-32 animate-pulse rounded-xl bg-card" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="card p-10 text-center">
        <p className="font-serif text-lg font-semibold">Post no encontrado</p>
        <Link to="/feed" className="btn-outline mt-4 inline-flex">Volver al feed</Link>
      </div>
    );
  }

  const images = Array.isArray(post.media) ? (post.media as string[]) : [];

  const handleDelete = () => {
    deletePost(post.id, { onSuccess: () => navigate('/feed') });
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <Link to={`/profile/${post.author.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
            {post.author.avatarUrl ? (
              <img src={post.author.avatarUrl} className="h-10 w-10 rounded-full object-cover" alt="" />
            ) : (
              post.author.displayName[0]?.toUpperCase()
            )}
          </div>
          <div>
            <p className="font-semibold leading-none">{post.author.displayName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              @{post.author.username} · {formatDistanceToNow(post.publishedAt)}
            </p>
          </div>
        </Link>
        {user?.id === post.authorId && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="btn-ghost text-xs text-muted-foreground hover:text-foreground"
            >
              Editar
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              disabled={deleting}
              className="btn-ghost text-xs text-destructive hover:text-destructive"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="card overflow-hidden">
          <ImageCarousel
            images={images}
            alt={post.caption ?? 'Outfit'}
            renderOverlay={(imageIndex) => (
              <>
                {post.outfitItems?.filter((item) => item.imageIndex === imageIndex).map((item) => (
                  <OutfitPin
                    key={item.id}
                    index={post.outfitItems!.indexOf(item) + 1}
                    x={item.x}
                    y={item.y}
                    itemType={item.itemType}
                    customLabel={item.customLabel}
                    brand={item.brand}
                    price={item.price}
                    customLink={item.customLink}
                  />
                ))}
              </>
            )}
          />
        </div>
      )}

      <div className="card px-4 py-3 space-y-3">
        <div className="flex items-center gap-1">
          <VoteButton postId={post.id} upvotes={post.upvotes ?? 0} userVote={post.userVote ?? 0} />
          <span className="text-xs text-muted-foreground ml-2">
            {post.commentsCount ?? 0} comentarios
          </span>
          <SaveButton postId={post.id} saved={post.isSaved ?? false} className="ml-auto" />
        </div>

        {post.caption && (
          <p className="text-sm leading-relaxed">
            <Link to={`/profile/${post.author.username}`} className="mr-1 font-semibold hover:text-primary">
              {post.author.username}
            </Link>
            {post.caption}
          </p>
        )}

        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.hashtags.map(({ hashtag }) => (
              <span key={hashtag.id} className="badge-primary">#{hashtag.name}</span>
            ))}
          </div>
        )}

        {post.outfitItems && post.outfitItems.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prendas</p>
            <div className="space-y-2">
              {post.outfitItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                  <span className="badge shrink-0">{ITEM_LABELS[item.itemType] ?? item.itemType}</span>
                  {item.customLabel && <span className="text-sm truncate">{item.customLabel}</span>}
                  {item.brand && <span className="text-xs text-muted-foreground truncate">· {item.brand}</span>}
                  {item.price != null && <span className="text-xs text-primary font-medium">${item.price}</span>}
                  {item.customLink && (
                    <a
                      href={item.customLink}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary/12 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      Comprar aquí
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card px-4 py-4">
        <CommentSection postId={post.id} />
      </div>

      <EditPostModal post={post} open={editOpen} onClose={() => setEditOpen(false)} />

      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar publicación"
        description="Esta acción no se puede deshacer. Se eliminarán las imágenes, comentarios y etiquetas asociadas."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
