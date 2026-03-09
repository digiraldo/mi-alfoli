import cron from 'node-cron';
import { sendBillReminders } from '../controllers/notifications.controller';

// Ejecutar todos los días a las 8:00 AM (hora del servidor)
export function startBillReminderCron() {
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] ⏰ Ejecutando recordatorio de gastos fijos...');
    await sendBillReminders();
  });
  console.log('[Cron] ✅ Recordatorio de gastos fijos programado (8:00 AM diario).');
}
