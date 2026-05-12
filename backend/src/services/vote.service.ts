import { prisma } from '../config/database';
import { AppError } from '../utils/app-error';

export class VoteService {
  async castVote(userId: string, targetType: 'POST' | 'COMMENT', targetId: string, value: 1 | -1) {
    // Verify target exists
    if (targetType === 'POST') {
      const post = await prisma.post.findUnique({ where: { id: targetId } });
      if (!post) throw new AppError('Post no encontrado', 404);
    } else {
      const comment = await prisma.comment.findUnique({ where: { id: targetId } });
      if (!comment) throw new AppError('Comentario no encontrado', 404);
    }

    const existing = await prisma.vote.findUnique({
      where: { userId_targetType_targetId: { userId, targetType, targetId } },
    });

    let finalValue: number;

    if (existing) {
      if (existing.value === value) {
        // Same value → unvote
        await prisma.vote.delete({
          where: { userId_targetType_targetId: { userId, targetType, targetId } },
        });
        finalValue = 0;
      } else {
        // Flip vote
        await prisma.vote.update({
          where: { userId_targetType_targetId: { userId, targetType, targetId } },
          data: { value },
        });
        finalValue = value;
      }
    } else {
      await prisma.vote.create({
        data: {
          userId,
          targetType,
          targetId,
          value,
          ...(targetType === 'POST' ? { postId: targetId } : { commentId: targetId }),
        },
      });
      finalValue = value;
    }

    // Recount and persist
    if (targetType === 'POST') {
      const [upvotes, downvotes, post] = await Promise.all([
        prisma.vote.count({ where: { targetType: 'POST', targetId, value: 1 } }),
        prisma.vote.count({ where: { targetType: 'POST', targetId, value: -1 } }),
        prisma.post.findUnique({ where: { id: targetId }, select: { publishedAt: true } }),
      ]);
      const score = upvotes - downvotes;
      const ageHours = post
        ? (Date.now() - post.publishedAt.getTime()) / (1000 * 60 * 60)
        : 0;
      const hotScore = (upvotes + 1) / Math.pow(ageHours + 2, 1.8);
      await prisma.post.update({ where: { id: targetId }, data: { upvotes, downvotes, score, hotScore } });
      return { finalValue, upvotes, downvotes, score };
    } else {
      const [upvotes, downvotes] = await Promise.all([
        prisma.vote.count({ where: { targetType: 'COMMENT', targetId, value: 1 } }),
        prisma.vote.count({ where: { targetType: 'COMMENT', targetId, value: -1 } }),
      ]);
      const score = upvotes - downvotes;
      await prisma.comment.update({ where: { id: targetId }, data: { upvotes, downvotes, score } });
      return { finalValue, upvotes, downvotes, score };
    }
  }

  async getUserVote(userId: string, targetType: 'POST' | 'COMMENT', targetId: string) {
    const vote = await prisma.vote.findUnique({
      where: { userId_targetType_targetId: { userId, targetType, targetId } },
    });
    return vote?.value ?? 0;
  }
}
