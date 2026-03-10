"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_routes_1 = require("./routes/auth.routes");
const transactions_routes_1 = require("./routes/transactions.routes");
const categories_routes_1 = require("./routes/categories.routes");
const percentages_routes_1 = require("./routes/percentages.routes");
const bills_routes_1 = require("./routes/bills.routes");
const accounts_routes_1 = require("./routes/accounts.routes");
const notifications_routes_1 = require("./routes/notifications.routes");
const billReminder_job_1 = require("./jobs/billReminder.job");
const savings_routes_1 = require("./routes/savings.routes");
const app = (0, express_1.default)();
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
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// ── Headers CORS ya controlados por el middleware absoluto arriba ────────
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// ── Rate Limiting ────────────────────────────────────────
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minuto
    max: 100,
    message: { message: 'Demasiadas solicitudes, intenta en un momento.' },
});
app.use('/api/', limiter);
const authLimiter = (0, express_rate_limit_1.default)({
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
app.use('/api/auth', authLimiter, auth_routes_1.authRoutes);
app.use('/api/transactions', transactions_routes_1.transactionRoutes);
app.use('/api/categories', categories_routes_1.categoryRoutes);
app.use('/api/percentages', percentages_routes_1.percentageRoutes);
app.use('/api/bills', bills_routes_1.billRoutes);
app.use('/api/accounts', accounts_routes_1.accountRoutes);
app.use('/api/notifications', notifications_routes_1.notificationRoutes);
app.use('/api/savings', savings_routes_1.savingsRoutes);
// ── Start Background Jobs ─────────────────────────────────
(0, billReminder_job_1.startBillReminderCron)();
const prisma_1 = require("./lib/prisma");
app.get('/api/debug', async (req, res) => {
    try {
        const memory = process.memoryUsage();
        // Ping to database
        const start = Date.now();
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        const latency = Date.now() - start;
        res.json({ status: 'Database OK', latency_ms: latency, memory: { rss_mb: Math.round(memory.rss / 1024 / 1024), heap_mb: Math.round(memory.heapUsed / 1024 / 1024) }, env: { PORT: process.env.PORT, DATABASE_URL: Boolean(process.env.DATABASE_URL) } });
    }
    catch (err) {
        res.status(500).json({ status: 'Database Failed', error: err.message, stack: err.stack, code: err.code });
    }
});
// ── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: `Ruta ${req.path} no encontrada` });
});
// ── Error Handler ─────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[Global Error - Crash Prevented]', err.message);
    if (err.stack)
        console.error(err.stack);
    res.status(500).json({
        message: 'Error interno o de conexión a la base de datos',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Unhandled timeout / db error'
    });
});
exports.default = app;
