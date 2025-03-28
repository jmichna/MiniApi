import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallbackSecret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'fallbackSecret';

interface User {
  id: number;
  login: string;
  password: string;
  role: string;
}

interface JwtPayload {
  userId: number;
  role: string;
  iat?: number;
  exp?: number;
}

interface LoginBody {
  login: string;
  password: string;
}

interface RefreshBody {
  refreshToken: string;
}

router.post(
  '/login',
  (req: Request<unknown, unknown, LoginBody>, res: Response): void => {
    const { login, password } = req.body;

    const users: User[] = req.app.locals.users;

    const user = users.find(u => u.login === login && u.password === password);
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const payload = {
      userId: user.id,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

    res.json({ accessToken, refreshToken });
  }
);

router.post(
  '/refresh',
  (req: Request<unknown, unknown, RefreshBody>, res: Response): void => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ message: 'No refresh token provided' });
      return;
    }

    jwt.verify(refreshToken, REFRESH_SECRET, (err, decoded) => {
      if (err) {
        res.status(401).json({ message: 'Invalid refresh token' });
        return;
      }

      const { userId, role } = decoded as JwtPayload;
      const newAccessToken = jwt.sign({ userId, role }, JWT_SECRET, {
        expiresIn: '15m',
      });

      res.json({ accessToken: newAccessToken });
    });
  }
);

router.get('/me', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token' });
    return;
  }
  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    const { userId } = decoded as JwtPayload;

    const users: User[] = req.app.locals.users;
    const user = users.find(u => u.id === userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const { password, ...rest } = user;
    res.json(rest);
  });
});

export default router;