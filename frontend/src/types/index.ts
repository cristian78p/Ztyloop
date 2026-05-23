export type PostCategory =
  | 'CASUAL' | 'FORMAL' | 'COSPLAY' | 'STREETWEAR' | 'MINIMALIST'
  | 'VINTAGE' | 'AESTHETIC' | 'GOTHIC' | 'Y2K' | 'PREPPY';

export type ItemType =
  | 'TOP' | 'BOTTOM' | 'SHOES' | 'OUTERWEAR' | 'ACCESSORY'
  | 'BAG' | 'HEADWEAR' | 'EYEWEAR' | 'JEWELRY' | 'OTHER';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: 'USER' | 'CREATOR' | 'BRAND' | 'MODERATOR' | 'ADMIN';
  _count?: { followers: number; following: number; posts: number };
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  role: 'USER' | 'CREATOR' | 'BRAND' | 'MODERATOR' | 'ADMIN';
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
  isFollowing?: boolean;
}

export interface OutfitItem {
  id: string;
  postId: string;
  x: number;
  y: number;
  imageIndex: number;
  itemType: ItemType;
  customLabel: string | null;
  customLink: string | null;
  brand: string | null;
  price: number | null;
  position: number;
}

export interface Post {
  id: string;
  authorId: string;
  caption: string | null;
  media: string[];
  type: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  category: PostCategory | null;
  visibility: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';
  hotScore: number;
  publishedAt: string;
  upvotes: number;
  downvotes: number;
  commentsCount: number;
  savesCount?: number;
  userVote?: number;
  isSaved?: boolean;
  author: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  outfitItems?: OutfitItem[];
  hashtags?: { hashtag: { id: string; name: string } }[];
  _count?: { votes: number; comments: number };
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
  userVote?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  replies?: Comment[];
}

export interface PaginatedResponse<T> {
  posts: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ApiError {
  success: false;
  error: string;
  details?: Record<string, string[]>;
}
