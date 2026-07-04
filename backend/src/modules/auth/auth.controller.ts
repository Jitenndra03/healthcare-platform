import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { registerUser, loginUser } from './auth.service';
import { query } from '../../config/db';
import { oauth2Client } from '../../config/google';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await registerUser(req.body);
  res.status(201).json({ status: 'success', data: user });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await loginUser(email, password);
  res.json({ status: 'success', data: result });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const result = await query(
    'SELECT id, name, email, role, phone, created_at FROM users WHERE id = $1',
    [req.user!.id]
  );
  res.json({ status: 'success', data: result.rows[0] });
});

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const { code, state } = req.query as { code: string; state: string };
  const { tokens } = await oauth2Client.getToken(code);
  // Store refresh token against the user (state = userId)
  await query(
    'UPDATE users SET google_refresh_token = $1 WHERE id = $2',
    [tokens.refresh_token, state]
  );
  res.redirect(`${process.env.FRONTEND_URL}/calendar-connected`);
});
