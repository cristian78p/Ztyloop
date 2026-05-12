import { Request, Response, NextFunction } from "express";
import { PostService } from "../services/post.service";
import { ApiResponse } from "../utils/api-response";
import type { CreatePostDto, UpdatePostDto } from "../validators/post.validator";

export class PostController {
  private postService = new PostService();

  getFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
      res.json(ApiResponse.success(await this.postService.getFeed(page, limit)));
    } catch (error) { next(error); }
  };

  getFollowingFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
      res.json(ApiResponse.success(await this.postService.getFollowingFeed(req.user!.id, page, limit)));
    } catch (error) { next(error); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(ApiResponse.success(await this.postService.getById(String(req.params.id))));
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const post = await this.postService.create({ ...(req.body as CreatePostDto), authorId: req.user!.id });
      res.status(201).json(ApiResponse.success(post, "Post publicado"));
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const post = await this.postService.update(
        String(req.params.id),
        req.user!.id,
        req.body as UpdatePostDto,
      );
      res.json(ApiResponse.success(post, "Post actualizado"));
    } catch (error) { next(error); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.postService.delete(String(req.params.id), req.user!.id);
      res.json(ApiResponse.success(null, "Post eliminado"));
    } catch (error) { next(error); }
  };
}
