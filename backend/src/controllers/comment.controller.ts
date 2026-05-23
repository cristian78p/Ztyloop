import { Request, Response, NextFunction } from 'express';
import { CommentService } from '../services/comment.service';
import { ApiResponse } from '../utils/api-response';
import { z } from 'zod';

const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

export class CommentController {
  private commentService = new CommentService();

  getByPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const comments = await this.commentService.getComments(String(req.params.id), req.user?.id);
      res.json(ApiResponse.success(comments));
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { content, parentId } = createCommentSchema.parse(req.body);
      const comment = await this.commentService.create(
        String(req.params.id),
        req.user!.id,
        content,
        parentId,
      );
      res.status(201).json(ApiResponse.success(comment, 'Comentario publicado'));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.commentService.delete(String(req.params.commentId), req.user!.id);
      res.json(ApiResponse.success(null, 'Comentario eliminado'));
    } catch (error) {
      next(error);
    }
  };
}
