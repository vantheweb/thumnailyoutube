import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'db.json');
const LOG_FILE = path.join(__dirname, 'payments.log');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

// Initialize "database"
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: [] }, null, 2));
}

// Payment logging helper
const logPayment = (email: string, name: string, packageType: string) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] User: ${name} (${email}) - Package: ${packageType}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const getDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  const saveDB = (data: any) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

  // --- API Routes ---

  // Auth: Register
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;
    const dbData = getDB();
    
    if (dbData.users.find((u: any) => u.email === email)) {
      return res.status(400).json({ error: 'Email đã tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      name,
      role: 'user',
      isApproved: false,
      subscribedUntil: null,
      createdAt: new Date().toISOString()
    };

    dbData.users.push(newUser);
    saveDB(dbData);

    res.status(201).json({ message: 'Đăng ký thành công. Vui lòng chờ admin phê duyệt.' });
  });

  // Auth: Login
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const dbData = getDB();
    const user = dbData.users.find((u: any) => u.email === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  });

  // Payments: Process (Simulated)
  app.post('/api/payments/subscribe', async (req, res) => {
    const { userId, months, name, email } = req.body;
    const dbData = getDB();
    const userIndex = dbData.users.findIndex((u: any) => u.id === userId);

    if (userIndex === -1) return res.status(404).json({ error: 'Không tìm thấy user' });

    const now = new Date();
    const currentExpiry = dbData.users[userIndex].subscribedUntil 
      ? new Date(dbData.users[userIndex].subscribedUntil)
      : now;
    
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + parseInt(months));

    dbData.users[userIndex].subscribedUntil = newExpiry.toISOString();
    saveDB(dbData);

    logPayment(email, name, `${months} tháng`);

    res.json({ message: 'Thanh toán thành công', subscribedUntil: newExpiry });
  });

  // Admin: Get Users
  app.get('/api/admin/users', (req, res) => {
    const dbData = getDB();
    res.json(dbData.users.map(({ password, ...u }: any) => u));
  });

  // Admin: Toggle Approval
  app.post('/api/admin/approve', (req, res) => {
    const { userId, status } = req.body;
    const dbData = getDB();
    const userIndex = dbData.users.findIndex((u: any) => u.id === userId);

    if (userIndex !== -1) {
      dbData.users[userIndex].isApproved = status;
      saveDB(dbData);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
