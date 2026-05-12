import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserService } from '../services/user.service';
import { ApiResponse } from '../utils/api-response';

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(60).optional(),
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  bannerUrl: z.string().url().optional().or(z.literal('')),
});

export class UserController {
  private userService = new UserService();

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await this.userService.getProfile(String(req.params.username));
      // Attach isFollowing if authenticated
      let isFollowing = false;
      if (req.user) {
        isFollowing = await this.userService.isFollowing(req.user.id, String(req.params.username));
      }
      res.json(ApiResponse.success({ ...profile, isFollowing }));
    } catch (error) {
      next(error);
    }
  };

  getUserPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
      const result = await this.userService.getUserPosts(String(req.params.username), page, limit);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };

  toggleFollow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.userService.toggleFollow(req.user!.id, String(req.params.username));
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = updateProfileSchema.parse(req.body);
      const user = await this.userService.updateProfile(req.user!.id, data);
      res.json(ApiResponse.success(user, 'Perfil actualizado'));
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.getMe(req.user!.id);
      res.json(ApiResponse.success(user));
    } catch (error) {
      next(error);
    }
  };
}
