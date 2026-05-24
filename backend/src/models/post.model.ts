import { Prisma, type ItemType } from '@prisma/client';
import { prisma } from '../config/database';

type OutfitItemInput = {
  x: number; y: number; imageIndex: number; itemType: ItemType;
  customLabel?: string; customLink?: string; brand?: string; price?: number;
};

type UpdateFields = {
  caption?: string | null;
  category?: string | null;
  visibility?: string;
  media?: Prisma.InputJsonValue;
};

export const PostModel = {
  findById: (id: string) =>
    prisma.post.findFirst({
      where: { id, deletedAt: null },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        outfitItems: { orderBy: { position: 'asc' } },
        hashtags: { include: { hashtag: true } },
        _count: { select: { votes: true, comments: true } },
      },
    }),

  findPublicFeed: (skip: number, take: number) =>
    prisma.post.findMany({
      where: { visibility: 'PUBLIC', deletedAt: null },
      orderBy: [{ hotScore: 'desc' }, { publishedAt: 'desc' }],
      skip,
      take,
      select: {
        id: true, authorId: true, caption: true, media: true, type: true,
        category: true, hotScore: true, publishedAt: true,
        upvotes: true, downvotes: true, commentsCount: true,
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        hashtags: { select: { hashtag: { select: { id: true, name: true } } } },
        _count: { select: { votes: true, comments: true } },
      },
    }),

  countPublic: () => prisma.post.count({ where: { visibility: 'PUBLIC', deletedAt: null } }),

  update: (id: string, fields: UpdateFields, hashtags?: string[], outfitItems?: OutfitItemInput[]) =>
    prisma.$transaction(async (tx) => {
      if (hashtags !== undefined) {
        await tx.postHashtag.deleteMany({ where: { postId: id } });
      }
      if (outfitItems !== undefined) {
        await tx.outfitItem.deleteMany({ where: { postId: id } });
      }

      const data: Prisma.PostUpdateInput = { editedAt: new Date() };

      if (fields.caption !== undefined) data.caption = fields.caption;
      if (fields.category !== undefined) data.category = fields.category as Prisma.PostUpdateInput['category'];
      if (fields.visibility !== undefined) data.visibility = fields.visibility as Prisma.PostUpdateInput['visibility'];
      if (fields.media !== undefined) data.media = fields.media;

      if (hashtags !== undefined) {
        data.hashtags = {
          create: hashtags.map((tag) => ({
            hashtag: {
              connectOrCreate: {
                where: { name: tag.toLowerCase() },
                create: { name: tag.toLowerCase() },
              },
            },
          })),
        };
      }

      if (outfitItems !== undefined) {
        data.outfitItems = {
          create: outfitItems.map((item, idx) => ({ ...item, position: idx })),
        };
      }

      return tx.post.update({
        where: { id },
        data,
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          outfitItems: { orderBy: { position: 'asc' } },
          hashtags: { include: { hashtag: true } },
          _count: { select: { votes: true, comments: true } },
        },
      });
    }),

  delete: (id: string) => prisma.post.update({ where: { id }, data: { deletedAt: new Date() } }),
};
