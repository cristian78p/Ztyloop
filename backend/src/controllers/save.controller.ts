import { Request, Response, NextFunction } from 'express';
import { SaveService } from '../services/save.service';
import { ApiResponse } from '../utils/api-response';

export class SaveController {
  private saveService = new SaveService();

  toggle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.saveService.toggle(req.user!.id, String(req.params.id));
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };

  getSaved = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
      const result = await this.saveService.getSaved(req.user!.id, page, limit);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };
}
