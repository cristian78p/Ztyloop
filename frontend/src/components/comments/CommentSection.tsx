import { useState } from 'react';
import { useComments, useCreateComment, useDeleteComment } from '@/hooks/useComments';
import { useCommentVote } from '@/hooks/useVotes';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from '@/utils/date';
import { cn } from '@/utils/cn';
import type { Comment } from '@/types';

function CommentVote({ comment, postId }: { comment: Comment; postId: string }) {
  const { user } = useAuth();
  const [localUpvotes, setLocalUpvotes] = useState(comment.upvotes);
  const [localVote, setLocalVote] = useState((comment.userVote ?? 0) > 0 ? 1 : 0);
  const { mutate } = useCommentVote(postId, comment.id);

  if (!user) return null;

  const handleVote = () => {
    const prev = localVote;
    const prevUpvotes = localUpvotes;

    if (prev === 1) {
      setLocalVote(0);
      setLocalUpvotes((v) => v - 1);
    } else {
      setLocalVote(1);
      setLocalUpvotes((v) => v + 1);
    }

    mutate(1, {
      onError: () => {
        setLocalVote(prev);
        setLocalUpvotes(prevUpvotes);
      },
      onSuccess: (data) => {
        setLocalVote(data.finalValue > 0 ? 1 : 0);
        setLocalUpvotes(data.upvotes);
      },
    });
  };

  return (
    <button
      onClick={handleVote}
      className={cn(
        'flex items-center gap-1 text-xs transition-colors',
        localVote === 1 ? 'text-primary' : 'text-muted-foreground hover:text-primary',
      )}
      title={localVote === 1 ? 'Quitar me gusta' : 'Me gusta'}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill={localVote === 1 ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {localUpvotes > 0 && <span>{localUpvotes}</span>}
    </button>
  );
}

function CommentCard({
  comment,
  postId,
  onReply,
}: {
  comment: Comment;
  postId: string;
  onReply: (id: string, username: string) => void;
}) {
  const { user } = useAuth();
  const { mutate: del } = useDeleteComment(postId);

  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
        {comment.author.avatarUrl ? (
          <img src={comment.author.avatarUrl} className="h-7 w-7 rounded-full object-cover" alt="" />
        ) : (
          comment.author.displayName[0]?.toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{comment.author.username}</span>
          <span className="text-xs text-muted-foreground">{formatDistanceToNow(comment.createdAt)}</span>
        </div>
        <p className="mt-0.5 text-sm text-foreground leading-relaxed">{comment.content}</p>
        <div className="mt-1.5 flex items-center gap-3">
          <CommentVote comment={comment} postId={postId} />
          <button
            onClick={() => onReply(comment.id, comment.author.username)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Responder
          </button>
          {user?.id === comment.authorId && (
            <button
              onClick={() => del(comment.id)}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Eliminar
            </button>
          )}
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3 border-l-2 border-border pl-3">
            {comment.replies.map((reply) => (
              <CommentCard key={reply.id} comment={reply} postId={postId} onReply={onReply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentSection({ postId }: { postId: string }) {
  const { data: comments, isLoading } = useComments(postId);
  const { mutate: createComment, isPending } = useCreateComment(postId);
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    createComment(
      { content: text.trim(), parentId: replyTo?.id },
      {
        onSuccess: () => {
          setText('');
          setReplyTo(null);
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="font-serif text-base font-semibold">
        Comentarios{comments && comments.length > 0 ? ` (${comments.length})` : ''}
      </h3>

      {user && (
        <form onSubmit={handleSubmit} className="space-y-2">
          {replyTo && (
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground">
              Respondiendo a @{replyTo.username}
              <button type="button" onClick={() => setReplyTo(null)} className="ml-auto hover:text-foreground">✕</button>
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe un comentario..."
              rows={2}
              className="field-input resize-none text-sm"
            />
            <button type="submit" disabled={isPending || !text.trim()} className="btn-primary shrink-0 self-end px-4 py-2 text-xs">
              {isPending ? '...' : 'Enviar'}
            </button>
          </div>
        </form>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}
        </div>
      )}

      {!isLoading && comments && (
        <div className="space-y-4">
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground">Sé el primero en comentar.</p>
          )}
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              postId={postId}
              onReply={(id, username) => setReplyTo({ id, username })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
