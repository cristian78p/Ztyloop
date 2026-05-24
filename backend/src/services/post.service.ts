import { prisma } from '../config/database';
import { PostModel } from '../models/post.model';
import { AppError } from '../utils/app-error';
import type { CreatePostDto, UpdatePostDto } from '../validators/post.validator';

interface CreatePostInput extends CreatePostDto {
  authorId: string;
}

export class PostService {

  private async enrichWithUserData<T extends { id: string }>(
    posts: T[],
    userId?: string,
  ): Promise<(T & { userVote: number; isSaved: boolean })[]> {
    if (!userId || posts.length === 0) {
      return posts.map((p) => ({ ...p, userVote: 0, isSaved: false }));
    }

    const postIds = posts.map((p) => p.id);

    const [votes, saves] = await Promise.all([
      prisma.vote.findMany({
        where: { userId, targetType: 'POST', targetId: { in: postIds } },
        select: { targetId: true, value: true },
      }),
      prisma.save.findMany({
        where: { userId, postId: { in: postIds } },
        select: { postId: true },
      }),
    ]);

    const voteMap = new Map(votes.map((v) => [v.targetId, v.value]));
    const saveSet = new Set(saves.map((s) => s.postId));

    return posts.map((p) => ({
      ...p,
      userVote: voteMap.get(p.id) ?? 0,
      isSaved: saveSet.has(p.id),
    }));
  }

  async getFeed(page: number, limit: number, userId?: string) {
    const skip = (page - 1) * limit;

    const where = userId
      ? {
          deletedAt: null,
          OR: [
            { visibility: 'PUBLIC' as const },
            { authorId: userId },
          ],
        }
      : { visibility: 'PUBLIC' as const, deletedAt: null };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: [{ hotScore: 'desc' }, { publishedAt: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true, authorId: true, caption: true, media: true, type: true,
          category: true, hotScore: true, publishedAt: true,
          upvotes: true, downvotes: true, commentsCount: true,
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          hashtags: { select: { hashtag: { select: { id: true, name: true } } } },
          _count: { select: { votes: true, comments: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const enriched = await this.enrichWithUserData(posts, userId);
    return { posts: enriched, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getFollowingFeed(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const follows = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
    const followingIds = follows.map((f) => f.followingId);

    const where = {
      deletedAt: null,
      OR: [
        {
          authorId: { in: followingIds },
          visibility: { in: ['PUBLIC', 'FOLLOWERS_ONLY'] as ('PUBLIC' | 'FOLLOWERS_ONLY')[] },
        },
        { authorId: userId },
      ],
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true, caption: true, media: true, type: true, category: true,
          hotScore: true, publishedAt: true, upvotes: true, downvotes: true, commentsCount: true,
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          _count: { select: { votes: true, comments: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);
    const enriched = await this.enrichWithUserData(posts, userId);
    return { posts: enriched, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string, userId?: string) {
    const post = await PostModel.findById(id);
    if (!post) throw new AppError('Post no encontrado', 404);

    if (post.visibility !== 'PUBLIC') {
      const isOwner = userId === post.authorId;

      if (!isOwner && post.visibility === 'PRIVATE') {
        throw new AppError('Post no encontrado', 404);
      }

      if (!isOwner && post.visibility === 'FOLLOWERS_ONLY') {
        if (!userId) throw new AppError('Post no encontrado', 404);
        const isFollower = await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: userId, followingId: post.authorId } },
        });
        if (!isFollower) throw new AppError('Post no encontrado', 404);
      }
    }

    const [enriched] = await this.enrichWithUserData([post], userId);
    return enriched;
  }

  async create(input: CreatePostInput) {
    const { authorId, hashtags, outfitItems, media, ...rest } = input;
    const initialHotScore = 1 / Math.pow(2, 1.8);

    const post = await prisma.post.create({
      data: {
        authorId,
        media,
        hotScore: initialHotScore,
        ...rest,
        ...(outfitItems && {
          outfitItems: { create: outfitItems.map((item, idx) => ({ ...item, position: idx })) },
        }),
        ...(hashtags && {
          hashtags: {
            create: hashtags.map((tag) => ({
              hashtag: {
                connectOrCreate: {
                  where: { name: tag.toLowerCase() },
                  create: { name: tag.toLowerCase() },
                },
              },
            })),
          },
        }),
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        outfitItems: true,
      },
    });

    await prisma.user.update({ where: { id: authorId }, data: { postsCount: { increment: 1 } } });
    return post;
  }

  async update(postId: string, userId: string, dto: UpdatePostDto) {
    const existing = await PostModel.findById(postId);
    if (!existing) throw new AppError('Post no encontrado', 404);
    if (existing.authorId !== userId) throw new AppError('No tienes permiso para editar este post', 403);

    const { hashtags, outfitItems, ...fields } = dto;
    return PostModel.update(postId, fields, hashtags, outfitItems);
  }

  async delete(postId: string, userId: string) {
    const post = await PostModel.findById(postId);
    if (!post) throw new AppError('Post no encontrado', 404);
    if (post.authorId !== userId) throw new AppError('No tienes permiso para eliminar este post', 403);
    await PostModel.delete(postId);
    await prisma.user.update({ where: { id: userId }, data: { postsCount: { decrement: 1 } } });
  }
}
