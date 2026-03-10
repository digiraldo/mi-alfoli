import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';

/**
 * JOB: percentageRollover
 * Frecuencia: Todos los días a las 00:05 AM
 * Razón: Traspasar los saldos excedentes (A Favor) de las reglas de porcentaje 
 * de un mes al otro para aquellos usuarios cuyo `billingCycleDay` coincide con HOY.
 */
export function startPercentageRolloverCron() {
  console.log('⏳ Job Programado: Percentage Rollover (Cierre y Arrastre Mensual de Porcentajes)');

  cron.schedule('5 0 * * *', async () => {
    console.log(`[${new Date().toISOString()}] 🔄 Ejecutando Job de Cierre de Porcentajes...`);

    try {
      // 1. Deducir qué "día" es para arrastrar saldos
      // Consideración: ¿qué pasa los meses con 28, 29, 30 días?
      // Si hoy es último día del mes, vamos a jalar también a todos los que tienen cycle day > al día de hoy.
      const today = dayjs();
      const currentDay = today.date();
      const currentMonth = today.month() + 1; // 1-12
      const currentYear = today.year();
      const isLastDayOfMonth = today.endOf('month').date() === currentDay;

      // Determinamos los días a procesar (Si hoy es 28 de Feb y fin de mes, procesamos a los que eligieron 28, 29, 30 y 31)
      const targetDays = [currentDay];
      if (isLastDayOfMonth) {
        for (let i = currentDay + 1; i <= 31; i++) {
          targetDays.push(i);
        }
      }

      console.log(`Buscando usuarios cuyo billingCycleDay sea alguno de: ${targetDays.join(', ')}`);

      // 2. Extraer usuarios impactados
      const usersToProcess = await prisma.user.findMany({
        where: {
          billingCycleDay: { in: targetDays }
        },
        select: { id: true, email: true, billingCycleDay: true }
      });

      if (usersToProcess.length === 0) {
        console.log('✅ Ningún usuario corta facturación hoy.');
        return;
      }

      console.log(`⚙️ Procesando cierre de porcentajes para ${usersToProcess.length} usuarios.`);

      let rolloverCount = 0;

      // 3. Iterar por usuario y realizar el corte
      for (const user of usersToProcess) {
        // Obtenemos toooodas sus ejecuciones de porcentaje ACTIVAS y NO CERRADAS 
        // (Podría haber de hace 2 meses si el usuario no entró o el cron falló)
        const openExecutions = await prisma.percentageExecution.findMany({
          where: {
            userId: user.id,
            isClosed: false,
          },
          include: {
            percentageRule: true
          }
        });

        for (const exec of openExecutions) {
          // El monto disponible final del mes anterior que no se gastó
          const available = new Prisma.Decimal(exec.allocatedAmount).add(exec.carriedOverAmount);
          const remainder = available.sub(exec.executedAmount); 
          let carryOverToNextMonth = new Prisma.Decimal(0);

          // Si remainder > 0 es que le sobró dinero, "Saldo A Favor"
          if (remainder.greaterThan(0)) {
            carryOverToNextMonth = remainder;
          }

          // A. Marcar el pasado como CERRADO
          await prisma.percentageExecution.update({
            where: { id: exec.id },
            data: { isClosed: true }
          });

          // B. Calcular el mes al que vamos a arrastrar este saldo póstumo
          // Por defecto lo tiramos al mes vigente en que se ejecuta el cron
          // a menos que ya exista. Usamos Upsert para no duplicar.
          await prisma.percentageExecution.upsert({
            where: {
              percentageRuleId_year_month: {
                percentageRuleId: exec.percentageRuleId,
                year: currentYear,
                month: currentMonth
              }
            },
            create: {
              userId: user.id,
              percentageRuleId: exec.percentageRuleId,
              year: currentYear,
              month: currentMonth,
              allocatedAmount: 0, // Se llenará con ingresos del nuevo mes real
              executedAmount: 0,
              carriedOverAmount: carryOverToNextMonth,
              isClosed: false
            },
            update: {
              // Si ya existía alguna, arrastramos el sobrante a su campo carryOver 
              carriedOverAmount: {
                increment: carryOverToNextMonth
              }
            }
          });

          if (carryOverToNextMonth.greaterThan(0)) {
             rolloverCount++;
          }
        }
      }

      console.log(`✅ Job de Cierre Finalizado. Saldos trasladados exitosamente: ${rolloverCount}`);

    } catch (error) {
      console.error('🔥 Error crítico en startPercentageRolloverCron:', error);
    }
  });
}
