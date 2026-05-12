import { Request, Response, NextFunction } from 'express';
import { VoteService } from '../services/vote.service';
import { ApiResponse } from '../utils/api-response';
import { z } from 'zod';

const voteSchema = z.object({ value: z.union([z.literal(1), z.literal(-1)]) });

export class VoteController {
  private voteService = new VoteService();

  castPostVote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { value } = voteSchema.parse(req.body);
      const result = await this.voteService.castVote(req.user!.id, 'POST', String(req.params.id), value);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };

  castCommentVote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { value } = voteSchema.parse(req.body);
      const result = await this.voteService.castVote(req.user!.id, 'COMMENT', String(req.params.id), value);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };
}
