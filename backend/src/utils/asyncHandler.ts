import { Request, Response, NextFunction } from 'express';

// Wraps async route handlers so you don't need try/catch in every controller
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
