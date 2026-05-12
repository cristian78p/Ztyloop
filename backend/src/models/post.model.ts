import { prisma } from '../config/database';

type OutfitItemInput = {
  x: number; y: number; imageIndex: number; itemType: string;
  customLabel?: string; customLink?: string; brand?: string; price?: number;
};

type UpdateFields = {
  caption?: string | null;
  category?: string | null;
  visibility?: string;
  media?: unknown;
};

export const PostModel = {
  findById: (id: string) =>
    prisma.post.findUnique({
      where: { id },
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

      return tx.post.update({
        where: { id },
        data: {
          ...(fields.caption !== undefined && { caption: fields.caption }),
          ...(fields.category !== undefined && { category: fields.category as never }),
          ...(fields.visibility !== undefined && { visibility: fields.visibility as never }),
          ...(fields.media !== undefined && { media: fields.media }),
          editedAt: new Date(),
          ...(hashtags !== undefined && {
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
          ...(outfitItems !== undefined && {
            outfitItems: {
              create: outfitItems.map((item, idx) => ({ ...item, position: idx })),
            },
          }),
        },
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          outfitItems: { orderBy: { position: 'asc' } },
          hashtags: { include: { hashtag: true } },
          _count: { select: { votes: true, comments: true } },
        },
      });
    }),

  delete: (id: string) => prisma.post.delete({ where: { id } }),
};
