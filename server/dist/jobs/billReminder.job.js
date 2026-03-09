"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBillReminderCron = startBillReminderCron;
const node_cron_1 = __importDefault(require("node-cron"));
const notifications_controller_1 = require("../controllers/notifications.controller");
// Ejecutar todos los días a las 8:00 AM (hora del servidor)
function startBillReminderCron() {
    node_cron_1.default.schedule('0 8 * * *', async () => {
        console.log('[Cron] ⏰ Ejecutando recordatorio de gastos fijos...');
        await (0, notifications_controller_1.sendBillReminders)();
    });
    console.log('[Cron] ✅ Recordatorio de gastos fijos programado (8:00 AM diario).');
}
