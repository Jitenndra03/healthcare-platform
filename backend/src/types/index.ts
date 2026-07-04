export type Role = 'patient' | 'doctor' | 'admin';

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

export interface AuthRequest extends Express.Request {
  user?: JwtPayload;
}

// Extend Express Request globally
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
