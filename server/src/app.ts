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
app.use(cors({
  origin: (origin, callback) => {
    // Permitir: sin origen (apps nativas/Postman), localhost, o red local
    if (!origin) return callback(null, true);
    
    // Obtener la URL del frontend limpiando barras finales por seguridad
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    
    // Validar si el Origin coincide exactamente con la URL configurada
    if (origin === frontendUrl || origin === 'http://localhost:3000' || origin.includes('mi-alfoli')) {
      return callback(null, true);
    }
    
    // Validar redes locales (para pruebas en el móvil)
    const isLocalNetwork = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin);
    if (isLocalNetwork) {
      return callback(null, true);
    }
    
    return callback(new Error(`CORS bloqueado para el origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));

// Preflight universal explícito para prevenir Timeout en Koyeb
app.options('*', cors());

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
