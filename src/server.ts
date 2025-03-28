import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const users = [
  { id: 1, login: 'admin', password: 'admin123', role: 'admin' },
  { id: 2, login: 'dev', password: 'dev123', role: 'developer' },
];

(app.locals as any).users = users;

app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});