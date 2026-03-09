"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
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
// ── Security Middleware ──────────────────────────────────
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
}));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Permitir: sin origen (apps nativas/Postman), localhost, o red local (192.168.x.x / 10.x / 172.x)
        if (!origin)
            return callback(null, true);
        const allowed = [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'http://localhost:3000',
        ];
        const isLocalNetwork = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin);
        if (allowed.includes(origin) || isLocalNetwork) {
            return callback(null, true);
        }
        return callback(new Error(`CORS bloqueado: ${origin}`));
    },
    credentials: true,
}));
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
// ── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: `Ruta ${req.path} no encontrada` });
});
// ── Error Handler ─────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[Error]', err.message);
    res.status(500).json({ message: 'Error interno del servidor', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});
exports.default = app;
