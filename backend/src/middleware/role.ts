import { Request, Response, NextFunction } from 'express';
import { Role } from '../types';
import { AppError } from '../utils/AppError';

export const requireRole = (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Access denied: insufficient permissions', 403));
    }
    next();
  };
