import { prisma } from '../config/database';
import { PostModel } from '../models/post.model';
import { AppError } from '../utils/app-error';
import type { CreatePostDto, UpdatePostDto } from '../validators/post.validator';

interface CreatePostInput extends CreatePostDto {
  authorId: string;
}

export class PostService {
  async getFeed(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([PostModel.findPublicFeed(skip, limit), PostModel.countPublic()]);
    return { posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getFollowingFeed(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const follows = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });

    if (follows.length === 0) return { posts: [], pagination: { page, limit, total: 0, totalPages: 0 } };

    const ids = follows.map((f) => f.followingId);
    const where = {
      authorId: { in: ids },
      visibility: { in: ['PUBLIC', 'FOLLOWERS_ONLY'] as ('PUBLIC' | 'FOLLOWERS_ONLY')[] },
      deletedAt: null,
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
    return { posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string) {
    const post = await PostModel.findById(id);
    if (!post) throw new AppError('Post no encontrado', 404);
    return post;
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
