import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

const AUTH_USERNAME = process.env.AUTH_USERNAME || '';
const AUTH_PASSWORD_HASH = process.env.AUTH_PASSWORD_HASH || '';
const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRY = '24h';

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    if (!AUTH_USERNAME || !AUTH_PASSWORD_HASH || !JWT_SECRET) {
      console.error('[Auth] Server auth environment variables not configured');
      res.status(500).json({ error: 'Server authentication not configured' });
      return;
    }

    if (username !== AUTH_USERNAME) {
      console.warn(`[Auth] Failed login attempt for username: ${username}`);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, AUTH_PASSWORD_HASH);
    if (!valid) {
      console.warn(`[Auth] Failed login attempt — wrong password for: ${username}`);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { username, iat: Math.floor(Date.now() / 1000) },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    console.log(`[Auth] Login successful for: ${username}`);
    res.json({ token, username, expiresIn: JWT_EXPIRY });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/verify', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ valid: false, error: 'No token provided' });
      return;
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    res.json({ valid: true, username: decoded.username });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid or expired token' });
  }
});

export default router;
