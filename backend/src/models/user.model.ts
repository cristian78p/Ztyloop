import { prisma } from '../config/database';

// Data Access Object para User.
// Solo expone los campos que existen en schema.prisma → User.
export const UserModel = {
  findByEmail: (email: string) =>
    prisma.user.findUnique({ where: { email } }),

  findByUsername: (username: string) =>
    prisma.user.findUnique({ where: { username } }),

  findById: (id: string) =>
    prisma.user.findUnique({ where: { id } }),

  create: (data: {
    email: string;
    username: string;
    displayName: string;
    passwordHash: string;
  }) => prisma.user.create({ data }),

  updateProfile: (
    id: string,
    data: Partial<{
      displayName: string;
      bio: string;
      avatarUrl: string;
      bannerUrl: string;
    }>,
  ) => prisma.user.update({ where: { id }, data }),
};
