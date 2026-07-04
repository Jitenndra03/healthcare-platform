import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../config/db';
import { AppError } from '../../utils/AppError';

export async function registerUser(data: {
  name: string; email: string; password: string;
  role: string; phone?: string;
}) {
  const existing = await query('SELECT id FROM users WHERE email = $1', [data.email]);
  if (existing.rows.length > 0) throw new AppError('Email already registered', 409);

  const hashed = await bcrypt.hash(data.password, 12);
  const result = await query(
    `INSERT INTO users (name, email, password, role, phone)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role`,
    [data.name, data.email, hashed, data.role, data.phone ?? null]
  );
  return result.rows[0];
}

export async function loginUser(email: string, password: string) {
  const result = await query(
    'SELECT id, name, email, password, role FROM users WHERE email = $1',
    [email]
  );
  const user = result.rows[0];
  if (!user) throw new AppError('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError('Invalid credentials', 401);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const { password: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
}
