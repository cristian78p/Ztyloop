import { prisma } from '../config/database';
import { AppError } from '../utils/app-error';

const AUTHOR_SELECT = { id: true, username: true, displayName: true, avatarUrl: true } as const;

export class CommentService {
  async getComments(postId: string) {
    return prisma.comment.findMany({
      where: { postId, parentId: null, deletedAt: null },
      include: {
        author: { select: AUTHOR_SELECT },
        replies: {
          where: { deletedAt: null },
          include: { author: { select: AUTHOR_SELECT } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(postId: string, authorId: string, content: string, parentId?: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError('Post no encontrado', 404);

    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent || parent.postId !== postId) throw new AppError('Comentario padre inválido', 404);
    }

    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: { postId, authorId, content, parentId },
        include: { author: { select: AUTHOR_SELECT } },
      }),
      prisma.post.update({ where: { id: postId }, data: { commentsCount: { increment: 1 } } }),
    ]);

    return comment;
  }

  async delete(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new AppError('Comentario no encontrado', 404);
    if (comment.authorId !== userId) throw new AppError('Sin permiso para eliminar', 403);
    if (comment.deletedAt) throw new AppError('Ya eliminado', 409);

    await prisma.$transaction([
      prisma.comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } }),
      prisma.post.update({ where: { id: comment.postId }, data: { commentsCount: { decrement: 1 } } }),
    ]);
  }
}
