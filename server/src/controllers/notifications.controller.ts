import { Request, Response } from 'express';
import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Configurar VAPID keys (solo si existen, para evitar caídas en producción)
if (process.env.VAPID_EMAIL && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    const vapidEmail = process.env.VAPID_EMAIL.startsWith('mailto:') 
      ? process.env.VAPID_EMAIL 
      : 'mailto:' + process.env.VAPID_EMAIL;
      
    webpush.setVapidDetails(
      vapidEmail,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  } catch (err) {
    console.warn('⚠️ Error configurando VAPID keys:', err);
  }
} else {
  console.warn('⚠️ Variables VAPID no encontradas. Las notificaciones Push estarán deshabilitadas.');
}

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

// ─── POST /api/notifications/subscribe ──────────────────
export async function subscribe(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
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
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

// ─── DELETE /api/notifications/subscribe ────────────────
export async function unsubscribe(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { endpoint } = req.body;

    if (!endpoint) return res.status(400).json({ message: 'Falta el endpoint.' });

    await prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });

    res.json({ message: 'Suscripción eliminada.' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

// ─── POST /api/notifications/test ──────────────────────
export async function sendTest(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });

    if (subscriptions.length === 0) {
      return res.status(404).json({ message: 'No tienes ninguna suscripción activa.' });
    }

    const payload = JSON.stringify({
      title: '🌾 Mi Alfolí',
      body: '¡Las notificaciones push están funcionando correctamente!',
      icon: '/icon-192.png',
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    );

    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) console.warn(`[Push] ${failed.length} notificaciones fallidas.`);

    res.json({ message: `Notificación de prueba enviada a ${results.length} suscripción(es).` });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

// ─── Función de uso interno del cron ────────────────────
export async function sendBillReminders() {
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
      if (subs.length === 0) continue;

      const daysLeft = bill.dueDay - currentDay;
      const payload = JSON.stringify({
        title: '🗓️ Mi Alfolí — Recordatorio',
        body: `Tu gasto "${bill.name}" vence en ${daysLeft} día(s).`,
        icon: '/icon-192.png',
        url: '/dashboard',
      });

      await Promise.allSettled(
        subs.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          ).catch((err: any) => {
            if (err.statusCode === 410) {
              return prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
            }
          })
        )
      );
    }

    console.log(`[Cron] Recordatorios enviados para ${bills.length} gasto(s) próximo(s).`);
  } catch (err) {
    console.error('[Cron] Error al enviar recordatorios:', err);
  }
}
