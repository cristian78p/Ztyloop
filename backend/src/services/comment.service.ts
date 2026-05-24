import { prisma } from '../config/database';
import { AppError } from '../utils/app-error';

const AUTHOR_SELECT = { id: true, username: true, displayName: true, avatarUrl: true } as const;

export class CommentService {
  async getComments(postId: string, userId?: string) {
    const comments = await prisma.comment.findMany({
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

    if (!userId || comments.length === 0) {
      return comments.map((c) => ({
        ...c,
        userVote: 0,
        replies: c.replies.map((r) => ({ ...r, userVote: 0 })),
      }));
    }

    const allIds: string[] = [];
    for (const c of comments) {
      allIds.push(c.id);
      for (const r of c.replies) {
        allIds.push(r.id);
      }
    }

    const votes = await prisma.vote.findMany({
      where: { userId, targetType: 'COMMENT', targetId: { in: allIds } },
      select: { targetId: true, value: true },
    });

    const voteMap = new Map(votes.map((v) => [v.targetId, v.value]));

    return comments.map((c) => ({
      ...c,
      userVote: voteMap.get(c.id) ?? 0,
      replies: c.replies.map((r) => ({
        ...r,
        userVote: voteMap.get(r.id) ?? 0,
      })),
    }));
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
