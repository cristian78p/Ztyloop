import { prisma } from '../config/database';
import { AppError } from '../utils/app-error';

const POST_SELECT = {
  id: true,
  caption: true,
  media: true,
  type: true,
  category: true,
  hotScore: true,
  publishedAt: true,
  upvotes: true,
  downvotes: true,
  commentsCount: true,
  author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  _count: { select: { votes: true, comments: true } },
} as const;

export class SaveService {
  async save(userId: string, postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError('Post no encontrado', 404);

    const existing = await prisma.save.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) return { saved: true }; // ya guardado, idempotente

    await prisma.$transaction([
      prisma.save.create({ data: { userId, postId } }),
      prisma.post.update({ where: { id: postId }, data: { savesCount: { increment: 1 } } }),
    ]);
    return { saved: true };
  }

  async unsave(userId: string, postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError('Post no encontrado', 404);

    const existing = await prisma.save.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (!existing) return { saved: false }; // ya no guardado, idempotente

    await prisma.$transaction([
      prisma.save.delete({ where: { userId_postId: { userId, postId } } }),
      prisma.post.update({ where: { id: postId }, data: { savesCount: { decrement: 1 } } }),
    ]);
    return { saved: false };
  }

  async getSaved(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [saves, total] = await Promise.all([
      prisma.save.findMany({
        where: { userId },
        include: { post: { select: POST_SELECT } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.save.count({ where: { userId } }),
    ]);

    return {
      posts: saves.map((s) => s.post),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async isSaved(userId: string, postId: string): Promise<boolean> {
    const save = await prisma.save.findUnique({ where: { userId_postId: { userId, postId } } });
    return !!save;
  }
}
