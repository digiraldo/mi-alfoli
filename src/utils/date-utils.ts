import { startOfMonth, endOfMonth, addMonths, subMonths, setDate, isBefore, format, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';

export interface FinancialCycle {
  startDate: Date;
  endDate: Date;
  label: string;      // Ej: "Febrero - Marzo" o "Marzo"
  rangeLabel: string; // Ej: "5 de Feb a 5 de Mar"
  periodName: string; // Ej: "Marzo" (mes principal del ciclo)
}

/**
 * Calcula el ciclo financiero actual basado en el día de corte del usuario.
 * Si el día de corte es 1, el ciclo es el mes calendario actual.
 * Si el día de corte es > 1, el ciclo va desde el día X del mes anterior/actual 
 * hasta el día X-1 del mes siguiente.
 */
export function getFinancialCycle(billingCycleDay: number = 1, referenceDate: Date = new Date()): FinancialCycle {
  const today = referenceDate;
  const year = today.getFullYear();
  const month = today.getMonth();

  let startDate: Date;
  let endDate: Date;

  if (billingCycleDay <= 1) {
    startDate = startOfMonth(today);
    endDate = endOfMonth(today);
  } else {
    // Si hoy es antes del día de corte, el ciclo empezó el mes pasado
    const currentMonthCutoff = setDate(today, billingCycleDay);
    
    if (isBefore(today, currentMonthCutoff)) {
      startDate = setDate(subMonths(today, 1), billingCycleDay);
      endDate = setDate(today, billingCycleDay - 1);
    } else {
      // Si hoy es el día de corte o después, el ciclo empezó este mes
      startDate = setDate(today, billingCycleDay);
      endDate = setDate(addMonths(today, 1), billingCycleDay - 1);
    }
  }

  // Ajustar horas para comparaciones precisas
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  // Formatear etiquetas
  const startMonthName = format(startDate, 'MMMM', { locale: es });
  const endMonthName = format(endDate, 'MMMM', { locale: es });
  
  // El "periodName" ahora será el mes de inicio del ciclo, como solicitó el usuario
  const periodName = startMonthName;

  return {
    startDate,
    endDate,
    label: billingCycleDay <= 1 ? startMonthName : `${startMonthName} - ${endMonthName}`,
    rangeLabel: `${format(startDate, "d 'de' MMM", { locale: es })} a ${format(endDate, "d 'de' MMM", { locale: es })}`,
    periodName: periodName.charAt(0).toUpperCase() + periodName.slice(1)
  };
}
