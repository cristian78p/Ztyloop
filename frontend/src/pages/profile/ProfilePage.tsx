import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useUserProfile, useUserPosts } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";
import { FollowButton } from "@/components/social/FollowButton";
import { EditPostModal } from "@/components/posts/EditPostModal";
import type { Post } from "@/types";

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const { data: profile, isLoading, isError } = useUserProfile(username);
  const { data: postsData, isLoading: postsLoading } = useUserPosts(username);
  const [hoveredPost, setHoveredPost] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-0">
        <div className="h-52 bg-card rounded-2xl" />
        <div className="px-4 -mt-12 space-y-3">
          <div className="h-24 w-24 rounded-full bg-muted border-4 border-background" />
          <div className="h-5 w-36 rounded bg-muted mt-3" />
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="flex gap-6 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-14 rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="card p-10 text-center">
        <p className="text-4xl mb-4">🙈</p>
        <p className="font-serif text-lg font-semibold">
          Usuario no encontrado
        </p>
        <Link to="/feed" className="btn-outline mt-4 inline-flex">
          Volver al feed
        </Link>
      </div>
    );
  }

  const isOwn = currentUser?.username === username;
  const posts = postsData?.posts ?? [];

  return (
    <div className="animate-slide-up">
      {/* ── Banner ────────────────────────────────────────── */}
      <div className="relative h-52 sm:h-64 overflow-hidden rounded-2xl">
        {profile.bannerUrl ? (
          <img
            src={profile.bannerUrl}
            alt="Banner"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="profile-banner-placeholder h-full w-full" />
        )}
        {/* gradient fade at bottom so avatar reads clearly */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* ── Avatar + action row ───────────────────────────── */}
      <div className="-mt-14 flex items-end justify-between px-1 sm:px-2">
        <div className="profile-avatar-ring">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="h-full w-full object-cover rounded-full"
            />
          ) : (
            <span className="text-primary-foreground text-3xl font-bold select-none">
              {profile.displayName[0]?.toUpperCase()}
            </span>
          )}
        </div>

        <div className="mb-1 flex items-center gap-2">
          {isOwn ? (
            <Link
              to="/profile/edit"
              className="btn-outline text-xs px-4 py-1.5"
            >
              Editar perfil
            </Link>
          ) : (
            <FollowButton
              username={profile.username}
              isFollowing={profile.isFollowing ?? false}
            />
          )}
          {isOwn && (
            <Link
              to="/feed"
              className="btn-ghost p-2 text-muted-foreground"
              title="Ver feed"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* ── Identity ──────────────────────────────────────── */}
      <div className="mt-3 px-1 sm:px-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-serif text-2xl font-bold leading-none">
            {profile.displayName}
          </h1>
          {profile.role !== "USER" && (
            <span className="badge-primary text-[10px] px-2 py-0.5">
              {profile.role}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          @{profile.username}
        </p>
        {profile.bio && (
          <p className="mt-3 text-sm leading-relaxed text-foreground/85 max-w-md">
            {profile.bio}
          </p>
        )}

        {/* ── Stats ─────────────────────────────────────────── */}
        <div className="mt-5 flex gap-7">
          {[
            { label: "Outfits", value: fmt(profile.postsCount ?? 0) },
            { label: "Seguidores", value: fmt(profile.followersCount ?? 0) },
            { label: "Siguiendo", value: fmt(profile.followingCount ?? 0) },
          ].map(({ label, value }) => (
            <div key={label} className="group cursor-default">
              <p className="text-xl font-bold text-foreground leading-none group-hover:text-primary transition-colors">
                {value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Divider ───────────────────────────────────────── */}
      <div className="mt-7 border-t border-border" />

      {/* ── Grid header ───────────────────────────────────── */}
      <div className="flex items-center justify-between px-1 py-3">
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted-foreground"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Outfits{" "}
            {posts.length > 0 && (
              <span className="text-foreground">({posts.length})</span>
            )}
          </span>
        </div>
        {isOwn && (
          <span className="text-xs text-muted-foreground">
            Solo visible para ti los privados
          </span>
        )}
      </div>

      {/* ── Grid ──────────────────────────────────────────── */}
      {postsLoading && (
        <div className="grid grid-cols-3 gap-0.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square animate-pulse bg-muted" />
          ))}
        </div>
      )}

      {!postsLoading && posts.length === 0 && (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">
            👗
          </div>
          <p className="font-serif text-base font-semibold">
            {isOwn ? "Aún no has publicado" : "Sin outfits aún"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isOwn
              ? "Comparte tu primer outfit con la comunidad"
              : "Este usuario no ha publicado nada todavía"}
          </p>
          {isOwn && (
            <Link to="/feed" className="btn-primary mt-4 inline-flex px-6">
              Publicar outfit
            </Link>
          )}
        </div>
      )}

      {!postsLoading && posts.length > 0 && (
        <div className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-xl">
          {posts.map((post) => {
            const img = Array.isArray(post.media)
              ? (post.media as string[])[0]
              : null;
            const votes = post.upvotes ?? 0;
            const comments = post._count?.comments ?? post.commentsCount ?? 0;

            return (
              <Link
                key={post.id}
                to={`/post/${post.id}`}
                className="group relative aspect-square overflow-hidden bg-muted"
                onMouseEnter={() => setHoveredPost(post.id)}
                onMouseLeave={() => setHoveredPost(null)}
              >
                {img ? (
                  <img
                    src={img}
                    alt={post.caption ?? "Outfit"}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl text-muted-foreground">
                    👗
                  </div>
                )}

                {/* Hover overlay */}
                <div
                  className={`absolute inset-0 flex items-center justify-center gap-4 bg-black/0 transition-all duration-300 ${hoveredPost === post.id ? "bg-black/45" : ""}`}
                >
                  <div
                    className={`flex items-center gap-4 text-white text-sm font-bold transition-all duration-300 ${hoveredPost === post.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
                  >
                    <span className="flex items-center gap-1.5">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                      {votes}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {comments}
                    </span>
                  </div>
                </div>

                {/* Category micro-badge */}
                {post.category && (
                  <div className="absolute top-2 left-2 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {post.category}
                  </div>
                )}

                {/* Edit button — only on own posts */}
                {isOwn && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingPost(post as Post);
                    }}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-primary/80"
                    title="Editar outfit"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* bottom breathing room */}
      <div className="h-6" />

      {editingPost && (
        <EditPostModal
          post={editingPost}
          open={!!editingPost}
          onClose={() => setEditingPost(null)}
        />
      )}
    </div>
  );
}
