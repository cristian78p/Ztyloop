import { prisma } from '../config/database';
import { AppError } from '../utils/app-error';

export class UserService {
  async getProfile(username: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bannerUrl: true,
        bio: true,
        role: true,
        followersCount: true,
        followingCount: true,
        postsCount: true,
        createdAt: true,
      },
    });
    if (!user) throw new AppError('Usuario no encontrado', 404);
    return user;
  }

  async getUserPosts(username: string, page = 1, limit = 12, viewerId?: string) {
    const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!user) throw new AppError('Usuario no encontrado', 404);

    // Determine which visibility levels the viewer can see
    const isOwner = viewerId === user.id;
    let visibilityFilter: object;

    if (isOwner) {
      // Owner sees all their posts
      visibilityFilter = {};
    } else if (viewerId) {
      // Logged-in user: check if they follow this user
      const isFollower = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
      });
      visibilityFilter = isFollower
        ? { visibility: { in: ['PUBLIC', 'FOLLOWERS_ONLY'] } }
        : { visibility: 'PUBLIC' };
    } else {
      // Anonymous visitor
      visibilityFilter = { visibility: 'PUBLIC' };
    }

    const where = { authorId: user.id, deletedAt: null, ...visibilityFilter };

    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        select: {
          id: true,
          caption: true,
          media: true,
          type: true,
          category: true,
          visibility: true,
          hotScore: true,
          publishedAt: true,
          upvotes: true,
          downvotes: true,
          commentsCount: true,
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          _count: { select: { votes: true, comments: true } },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    return { posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async follow(followerId: string, targetUsername: string) {
    const target = await prisma.user.findUnique({ where: { username: targetUsername } });
    if (!target) throw new AppError('Usuario no encontrado', 404);
    if (target.id === followerId) throw new AppError('No puedes seguirte a ti mismo', 400);

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: target.id } },
    });

    if (existing) return { following: true }; // ya sigue, idempotente

    await prisma.$transaction([
      prisma.follow.create({ data: { followerId, followingId: target.id } }),
      prisma.user.update({ where: { id: target.id }, data: { followersCount: { increment: 1 } } }),
      prisma.user.update({ where: { id: followerId }, data: { followingCount: { increment: 1 } } }),
    ]);
    return { following: true };
  }

  async unfollow(followerId: string, targetUsername: string) {
    const target = await prisma.user.findUnique({ where: { username: targetUsername } });
    if (!target) throw new AppError('Usuario no encontrado', 404);
    if (target.id === followerId) throw new AppError('No puedes dejar de seguirte a ti mismo', 400);

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: target.id } },
    });

    if (!existing) return { following: false }; // ya no sigue, idempotente

    await prisma.$transaction([
      prisma.follow.delete({ where: { followerId_followingId: { followerId, followingId: target.id } } }),
      prisma.user.update({ where: { id: target.id }, data: { followersCount: { decrement: 1 } } }),
      prisma.user.update({ where: { id: followerId }, data: { followingCount: { decrement: 1 } } }),
    ]);
    return { following: false };
  }

  async isFollowing(followerId: string, targetUsername: string): Promise<boolean> {
    const target = await prisma.user.findUnique({ where: { username: targetUsername }, select: { id: true } });
    if (!target) return false;
    const exists = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: target.id } },
    });
    return !!exists;
  }

  async updateProfile(userId: string, data: { displayName?: string; bio?: string; avatarUrl?: string; bannerUrl?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, username: true, displayName: true, avatarUrl: true,
        bannerUrl: true, bio: true, role: true,
      },
    });
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, username: true, displayName: true, avatarUrl: true,
        bannerUrl: true, bio: true, role: true,
        followersCount: true, followingCount: true, postsCount: true,
      },
    });
    if (!user) throw new AppError('Usuario no encontrado', 404);
    return user;
  }
}
