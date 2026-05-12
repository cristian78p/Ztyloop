import { z } from 'zod';

const POST_CATEGORIES = [
  'CASUAL', 'FORMAL', 'COSPLAY', 'STREETWEAR', 'MINIMALIST',
  'VINTAGE', 'AESTHETIC', 'GOTHIC', 'Y2K', 'PREPPY',
] as const;

const ITEM_TYPES = [
  'TOP', 'BOTTOM', 'SHOES', 'OUTERWEAR', 'ACCESSORY',
  'BAG', 'HEADWEAR', 'EYEWEAR', 'JEWELRY', 'OTHER',
] as const;

const outfitItemSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  imageIndex: z.number().int().min(0).default(0),
  itemType: z.enum(ITEM_TYPES),
  customLabel: z.string().max(100).optional(),
  customLink: z.string().url().optional().or(z.literal('')),
  brand: z.string().max(100).optional(),
  price: z.number().min(0).max(999_999).optional(),
});

export const createPostSchema = z.object({
  media: z.array(z.string().url('URL de imagen inválida')).min(1).max(10),
  type: z.enum(['IMAGE', 'VIDEO', 'CAROUSEL']).default('IMAGE'),
  caption: z.string().max(2000).optional(),
  category: z.enum(POST_CATEGORIES).optional(),
  visibility: z.enum(['PUBLIC', 'FOLLOWERS_ONLY', 'PRIVATE']).default('PUBLIC'),
  hashtags: z.array(z.string().max(50)).max(30).optional(),
  outfitItems: z.array(outfitItemSchema).max(20).optional(),
});

export const updatePostSchema = z.object({
  media: z.array(z.string().url('URL de imagen inválida')).min(1).max(10).optional(),
  caption: z.string().max(2000).nullable().optional(),
  category: z.enum(POST_CATEGORIES).nullable().optional(),
  visibility: z.enum(['PUBLIC', 'FOLLOWERS_ONLY', 'PRIVATE']).optional(),
  hashtags: z.array(z.string().max(50)).max(30).optional(),
  outfitItems: z.array(outfitItemSchema).max(20).optional(),
});

export type CreatePostDto = z.infer<typeof createPostSchema>;
export type UpdatePostDto = z.infer<typeof updatePostSchema>;
