import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { VoteButton } from './VoteButton';
import { SaveButton } from './SaveButton';
import { formatDistanceToNow } from '@/utils/date';
import type { Post } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  CASUAL: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  FORMAL: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  COSPLAY: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  STREETWEAR: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  MINIMALIST: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  VINTAGE: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  AESTHETIC: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  GOTHIC: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  Y2K: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  PREPPY: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
};

const CATEGORY_LABELS: Record<string, string> = {
  CASUAL: 'Casual', FORMAL: 'Formal', COSPLAY: 'Cosplay',
  STREETWEAR: 'Streetwear', MINIMALIST: 'Minimalist', VINTAGE: 'Vintage',
  AESTHETIC: 'Aesthetic', GOTHIC: 'Gothic', Y2K: 'Y2K', PREPPY: 'Preppy',
};

export function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const [imgHovered, setImgHovered] = useState(false);
  const firstImage = Array.isArray(post.media) ? (post.media as string[])[0] : null;
  const isCarousel = Array.isArray(post.media) && post.media.length > 1;
  const comments = post._count?.comments ?? post.commentsCount ?? 0;
  const votes = post.upvotes ?? 0;
  const catColor = post.category ? CATEGORY_COLORS[post.category] : undefined;

  return (
    <article className="card overflow-hidden animate-slide-up group/card transition-shadow hover:shadow-lg">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <Link
          to={`/profile/${post.author.username}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="relative">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold ring-2 ring-primary/20">
              {post.author.avatarUrl ? (
                <img src={post.author.avatarUrl} className="h-9 w-9 rounded-full object-cover" alt="" />
              ) : (
                post.author.displayName[0]?.toUpperCase()
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">{post.author.displayName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">@{post.author.username}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {post.category && (
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${catColor}`}>
              {CATEGORY_LABELS[post.category] ?? post.category}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{formatDistanceToNow(post.publishedAt)}</span>
        </div>
      </div>

      {/* ── Image ──────────────────────────────────────── */}
      {firstImage && (
        <Link
          to={`/post/${post.id}`}
          className="relative block overflow-hidden aspect-[4/5] bg-muted"
          onMouseEnter={() => setImgHovered(true)}
          onMouseLeave={() => setImgHovered(false)}
        >
          <img
            src={firstImage}
            alt={post.caption ?? 'Outfit'}
            className={`h-full w-full object-cover object-center transition-transform duration-700 ${imgHovered ? 'scale-105' : 'scale-100'}`}
            loading="lazy"
          />

          {/* Hover overlay */}
          <div className={`absolute inset-0 flex items-end transition-all duration-400 ${imgHovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-full bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4">
              <div className="flex items-center gap-4 text-white text-sm font-semibold">
                <span className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {votes}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {comments} {comments === 1 ? 'comentario' : 'comentarios'}
                </span>
              </div>
            </div>
          </div>

          {isCarousel && (
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="7" width="15" height="15" rx="2" /><path d="M17 2h3a2 2 0 0 1 2 2v15" />
              </svg>
              {(post.media as string[]).length}
            </span>
          )}
        </Link>
      )}

      {/* ── Engagement bar ─────────────────────────────── */}
      <div className="flex items-center gap-0.5 px-3 pt-2 pb-1">
        <VoteButton
          postId={post.id}
          upvotes={post.upvotes ?? 0}
          downvotes={post.downvotes ?? 0}
        />
        <Link
          to={`/post/${post.id}`}
          className="btn-ghost gap-1.5 text-xs ml-1"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {comments > 0 && <span className="tabular-nums">{comments}</span>}
        </Link>
        {user && <SaveButton postId={post.id} className="ml-auto" />}
      </div>

      {/* ── Caption ────────────────────────────────────── */}
      {post.caption ? (
        <div className="px-4 pb-4 pt-1">
          <p className="text-sm leading-relaxed">
            <Link
              to={`/profile/${post.author.username}`}
              className="mr-1 font-semibold hover:text-primary transition-colors"
            >
              {post.author.username}
            </Link>
            {post.caption}
          </p>
        </div>
      ) : (
        <div className="pb-3" />
      )}
    </article>
  );
}
