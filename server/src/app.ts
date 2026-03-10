import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRoutes } from './routes/auth.routes';
import { transactionRoutes } from './routes/transactions.routes';
import { categoryRoutes } from './routes/categories.routes';
import { percentageRoutes } from './routes/percentages.routes';
import { billRoutes } from './routes/bills.routes';
import { accountRoutes } from './routes/accounts.routes';
import { notificationRoutes } from './routes/notifications.routes';
import { startBillReminderCron } from './jobs/billReminder.job';
import { savingsRoutes } from './routes/savings.routes';

const app = express();
app.set('trust proxy', 1);

// ── CORTE CORTO ABSOLUTO PARA OPTIONS (PREFLIGHT) ────────
app.use((req, res, next) => {
  // Siempre y en absoluto responder a todo lo que entre antes de que otro middleware lo intercepte
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// ── Security Middleware ──────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true })); 
// ── Headers CORS ya controlados por el middleware absoluto arriba ────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting ────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  message: { message: 'Demasiadas solicitudes, intenta en un momento.' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // Aumentado a 20 para evitar falsos positivos en recargas locales
  message: { message: 'Demasiados intentos de login. Espera 1 minuto.' },
});

// ── Health Check ─────────────────────────────────────────
app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    app: 'Mi Alfolí API',
    version: '1.0.0',
    verse: 'Malaquías 3:10',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_, res) => {
  res.send('Mi Alfolí API is running. "Traed todos los diezmos al alfolí..." - Malaquías 3:10');
});

// ── Routes ───────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/percentages', percentageRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/savings', savingsRoutes);

// ── Start Background Jobs ─────────────────────────────────
startBillReminderCron();

import { prisma } from './lib/prisma';
app.get('/api/debug', async (req, res) => {
  try {
    const memory = process.memoryUsage();
    // Ping to database
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    res.json({ status: 'Database OK', latency_ms: latency, memory: { rss_mb: Math.round(memory.rss / 1024 / 1024), heap_mb: Math.round(memory.heapUsed / 1024 / 1024) }, env: { PORT: process.env.PORT, DATABASE_URL: Boolean(process.env.DATABASE_URL) } });
  } catch (err: any) {
    res.status(500).json({ status: 'Database Failed', error: err.message, stack: err.stack, code: err.code });
  }
});

// ── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Ruta ${req.path} no encontrada` });
});

// ── Error Handler ─────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Global Error - Crash Prevented]', err.message);
  if (err.stack) console.error(err.stack);
  
  res.status(500).json({ 
    message: 'Error interno o de conexión a la base de datos', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Unhandled timeout / db error' 
  });
});

export default app;
