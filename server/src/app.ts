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

// ── Security Middleware ──────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));
const corsMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const origin = req.headers.origin;
  
  // Lista de origenes siempre permitidos:
  const isVercel = origin && origin.includes('mi-alfoli');
  const isLocal = origin && (origin === 'http://localhost:3000' || origin.includes('192.168.') || origin.includes('10.'));
  const isFrontendEnv = origin === (process.env.FRONTEND_URL || '').replace(/\/$/, '');

  if (isVercel || isLocal || isFrontendEnv || !origin) {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*'); // Fallback para Postman y crons sin origin
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cachear preflight por 24 horas y reducir latencia

  // Interceptar Preflights Options para que nunca toquen el enrutador
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
};

app.use(corsMiddleware);

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

// ── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Ruta ${req.path} no encontrada` });
});

// ── Error Handler ─────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ message: 'Error interno del servidor', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

export default app;
