"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribe = subscribe;
exports.unsubscribe = unsubscribe;
exports.sendTest = sendTest;
exports.sendBillReminders = sendBillReminders;
const web_push_1 = __importDefault(require("web-push"));
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
// Configurar VAPID keys
web_push_1.default.setVapidDetails(process.env.VAPID_EMAIL, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
const subscribeSchema = zod_1.z.object({
    endpoint: zod_1.z.string().url(),
    keys: zod_1.z.object({
        p256dh: zod_1.z.string(),
        auth: zod_1.z.string(),
    }),
});
// ─── POST /api/notifications/subscribe ──────────────────
async function subscribe(req, res) {
    try {
        const userId = req.userId;
        const parsed = subscribeSchema.parse(req.body);
        // Upsert: si ya existe ese endpoint, lo actualiza; si no, lo crea
        await prisma.pushSubscription.upsert({
            where: { endpoint: parsed.endpoint },
            update: { p256dh: parsed.keys.p256dh, auth: parsed.keys.auth },
            create: {
                userId,
                endpoint: parsed.endpoint,
                p256dh: parsed.keys.p256dh,
                auth: parsed.keys.auth,
            },
        });
        res.json({ message: 'Suscripción guardada correctamente.' });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
// ─── DELETE /api/notifications/subscribe ────────────────
async function unsubscribe(req, res) {
    try {
        const userId = req.userId;
        const { endpoint } = req.body;
        if (!endpoint)
            return res.status(400).json({ message: 'Falta el endpoint.' });
        await prisma.pushSubscription.deleteMany({
            where: { userId, endpoint },
        });
        res.json({ message: 'Suscripción eliminada.' });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
// ─── POST /api/notifications/test ──────────────────────
async function sendTest(req, res) {
    try {
        const userId = req.userId;
        const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
        if (subscriptions.length === 0) {
            return res.status(404).json({ message: 'No tienes ninguna suscripción activa.' });
        }
        const payload = JSON.stringify({
            title: '🌾 Mi Alfolí',
            body: '¡Las notificaciones push están funcionando correctamente!',
            icon: '/icon-192.png',
        });
        const results = await Promise.allSettled(subscriptions.map((sub) => web_push_1.default.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)));
        const failed = results.filter((r) => r.status === 'rejected');
        if (failed.length > 0)
            console.warn(`[Push] ${failed.length} notificaciones fallidas.`);
        res.json({ message: `Notificación de prueba enviada a ${results.length} suscripción(es).` });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
// ─── Función de uso interno del cron ────────────────────
async function sendBillReminders() {
    try {
        console.log('[Cron] 🔔 Revisando gastos fijos próximos a vencer...');
        // Calcular días del mes actual
        const today = new Date();
        const currentDay = today.getDate();
        // Alertar facturas que vencen en los próximos 3 días
        const alertDays = [currentDay + 1, currentDay + 2, currentDay + 3];
        const bills = await prisma.monthlyBill.findMany({
            where: {
                isActive: true,
                dueDay: { in: alertDays },
            },
            include: {
                user: {
                    include: { pushSubscriptions: true },
                },
            },
        });
        for (const bill of bills) {
            const subs = bill.user.pushSubscriptions;
            if (subs.length === 0)
                continue;
            const daysLeft = bill.dueDay - currentDay;
            const payload = JSON.stringify({
                title: '🗓️ Mi Alfolí — Recordatorio',
                body: `Tu gasto "${bill.name}" vence en ${daysLeft} día(s).`,
                icon: '/icon-192.png',
                url: '/dashboard',
            });
            await Promise.allSettled(subs.map((sub) => web_push_1.default.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload).catch((err) => {
                if (err.statusCode === 410) {
                    return prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
                }
            })));
        }
        console.log(`[Cron] Recordatorios enviados para ${bills.length} gasto(s) próximo(s).`);
    }
    catch (err) {
        console.error('[Cron] Error al enviar recordatorios:', err);
    }
}
