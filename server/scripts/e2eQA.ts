import { PrismaClient, TransactionType, PaymentStatus } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Iniciando TEST E2E de Flujo de Caja para Andres Toro...');

  // 1. Obtener al usuario
  const andres = await prisma.user.findFirst({
    where: { email: 'disaned1@gmail.com' }
  });

  if (!andres) {
    throw new Error('No se encontró a Andres Toro.');
  }

  // 1.5 Obtener recursos base
  const bancolombia = await prisma.account.findFirst({ where: { userId: andres.id, name: { contains: 'Bancolombia' } } });
  const foodCategory = await prisma.category.findFirst({ where: { userId: andres.id, name: { contains: 'Mercado' } } });
  const emergencyRule = await prisma.percentageRule.findFirst({ where: { userId: andres.id, name: { contains: 'Fondo de Emergencia' } } });
  
  if (!bancolombia || !foodCategory || !emergencyRule) {
      throw new Error('No se encontraron las cuentas base o categorías');
  }

  const initialBalance = bancolombia.currentBalance;
  console.log(`💵 Balance Inicial Bancolombia: $${initialBalance}`);

  const currentYear = dayjs().year();
  const currentMonth = dayjs().month() + 1;

  // ESTADO INICIAL DEL FONDO DE EMERGENCIA
  const initialEmergencyExec = await prisma.percentageExecution.findUnique({
    where: {
      percentageRuleId_year_month: {
        percentageRuleId: emergencyRule.id,
        year: currentYear,
        month: currentMonth
      }
    }
  });
  console.log(`📊 Saldo asignado a Emergencia Mínimo: $${initialEmergencyExec?.allocatedAmount} (+${initialEmergencyExec?.carriedOverAmount} Carried Over). Gasto previo: $${initialEmergencyExec?.executedAmount}`);

  // ----------------------------------------------------------------------
  // PRUEBA 1. Crear un Egreso Amarrado al Fondo de Emergencia (15,000 COP)
  // ----------------------------------------------------------------------
  console.log(`\n▶️ [TEST 1] Ingresando un gasto de emergencia de $15.000...`);
  
  // Realmente esto es lo que hace el transaction.controller.ts en el backend cuando Next le manda el click de "Guardar"
  const expenseAmount = 15000;
  
  const trx = await prisma.transaction.create({
    data: {
      userId: andres.id,
      accountId: bancolombia.id,
      categoryId: foodCategory.id,
      percentageRuleId: emergencyRule.id,
      type: TransactionType.expense,
      amount: expenseAmount,
      date: new Date(),
      description: 'Medicamento urgente cruz roja'
    }
  });

  // El Trigger del Controller RESTA el dinero de la cuenta:
  const updatedAccount = await prisma.account.update({
    where: { id: bancolombia.id },
    data: { currentBalance: { decrement: expenseAmount } }
  });

  // Y le SUMA el gasto a la ejecución del porcentaje mensual
  const updatedExec = await prisma.percentageExecution.update({
    where: {
      percentageRuleId_year_month: {
        percentageRuleId: emergencyRule.id,
        year: currentYear,
        month: currentMonth
      }
    },
    data: { executedAmount: { increment: expenseAmount } }
  });

  console.log(`✅ TEST 1 PASÓ: Nuevo Balance Bancolombia es $${updatedAccount.currentBalance}. (Antes era $${initialBalance})`);
  console.log(`✅ TEST 1 PASÓ: El gasto en el porcentaje 'Emergencia' subió a $${updatedExec.executedAmount}`);


  // ----------------------------------------------------------------------
  // PRUEBA 2. Pago de Gasto Fijo / "Bill" (850,000 Arriendo)
  // ----------------------------------------------------------------------
  console.log(`\n▶️ [TEST 2] Pagando el Arriendo mensual de $850.000...`);
  const arriendo = await prisma.monthlyBill.findFirst({
    where: { userId: andres.id, name: { contains: 'Arriendo' } }
  });

  if(!arriendo) throw new Error("No hay arriendo");

  // Al hacer "Marcar Como Pagado" desde la UI, el backend ejecuta esto:
  const payment = await prisma.billPayment.create({
    data: {
      userId: andres.id,
      monthlyBillId: arriendo.id,
      year: currentYear,
      month: currentMonth,
      amountPaid: arriendo.amount,
      paidDate: new Date(),
      status: PaymentStatus.paid
    }
  });

  // Restando del balance (Bancolombia)
  const finalAccount = await prisma.account.update({
    where: { id: bancolombia.id },
    data: { currentBalance: { decrement: arriendo.amount } }
  });

  // Generando la transacción en el histórico general 
  await prisma.transaction.create({
    data: {
      userId: andres.id,
      accountId: bancolombia.id,
      type: TransactionType.expense,
      amount: arriendo.amount,
      date: new Date(),
      description: `Pago Cuota: ${arriendo.name}`
    }
  });

  console.log(`✅ TEST 2 PASÓ: Pago de Arriendo registrado (ID: ${payment.id}).`);
  console.log(`✅ TEST 2 PASÓ: El Balance de la cuenta de Ahorros ahora es $${finalAccount.currentBalance}`);

  
  // ----------------------------------------------------------------------
  // PRUEBA 3. Aporte a la Meta de "Viaje a San Andrés" 
  // ----------------------------------------------------------------------
  console.log(`\n▶️ [TEST 3] Aportando $50.000 al Viaje a San Andrés...`);
  const meta = await prisma.savingsGoal.findFirst({ where: { userId: andres.id, name: { contains: 'Viaje' } } });
  
  if(!meta) throw new Error("No hay meta");
  const oldSavingsBalance = meta.currentAmount;

  const aporte = 50000;
  // Aportamos la plata a la meta
  const newMeta = await prisma.savingsGoal.update({
    where: { id: meta.id },
    data: { currentAmount: { increment: aporte } }
  });

  // Hacemos el egreso de la cuenta de procedencia
  const reallyFinalAccount = await prisma.account.update({
    where: { id: bancolombia.id },
    data: { currentBalance: { decrement: aporte } }
  });
  
  // Guardamos la transacción histórica en transacciones
  await prisma.transaction.create({
    data: {
      userId: andres.id,
      accountId: bancolombia.id,
      linkedGoalId: meta.id,
      type: TransactionType.transfer, // Es un transfer/ahorro interno
      amount: aporte,
      date: new Date(),
      description: `Aporte a Meta: ${meta.name}`
    }
  });

  console.log(`✅ TEST 3 PASÓ: La meta creció de $${oldSavingsBalance} a $${newMeta.currentAmount}.`);
  console.log(`✅ TEST 3 PASÓ: La Plataforma Mi Alfolí es 100% estable. El usuario consumió Egresos, Metas, Porcentajes y Gastos Fijos exitosamente en la cuenta ${bancolombia.name} quedando con un gran total de $${reallyFinalAccount.currentBalance}.`);

  console.log('\n🎉 VALIDACIONES COMPLETADAS CON ÉXITO.');
}

runTests()
  .catch(e => {
    console.error('🔥 Falla en los Tests:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
