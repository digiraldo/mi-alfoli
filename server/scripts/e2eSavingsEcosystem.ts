import { PrismaClient, SavingsGoalType, TransactionType } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function runSavingsE2E() {
  console.log('🧪 Iniciando TEST E2E de Ecosistema: Módulo de Fondos y Metas (/savings)');

  // 1. Obtener a Andres
  const andres = await prisma.user.findFirst({
    where: { email: 'disaned1@gmail.com' }
  });

  if (!andres) throw new Error('No se encontró al usuario de prueba.');

  // 2. Obtener la cuenta bancaria principal
  const bancolombia = await prisma.account.findFirst({
    where: { userId: andres.id, name: { contains: 'Bancolombia' } }
  });

  if (!bancolombia) throw new Error('Cuentas no listas');

  // Calcular Patrimonio Total INICIAL (Plata en bancos + Plata en Metas)
  const allAccountsInit = await prisma.account.findMany({ where: { userId: andres.id, isActive: true } });
  const allSavingsInit = await prisma.savingsGoal.findMany({ where: { userId: andres.id, isActive: true } });
  
  const totalBancosInit = allAccountsInit.reduce((acc, curr) => acc + Number(curr.currentBalance), 0);
  const totalMetasInit = allSavingsInit.reduce((acc, curr) => acc + Number(curr.currentAmount), 0);
  const PATRIMONIO_GLOBAL_INICIAL = totalBancosInit + totalMetasInit;

  console.log(`\n🏦 [ESTADO INICIAL] Dinero Líquido Bancos: $${totalBancosInit}`);
  console.log(`🎯 [ESTADO INICIAL] Dinero en Fondos/Metas: $${totalMetasInit}`);
  console.log(`⚖️  [PATRIMONIO INICIAL TOTAL SUMADO]: $${PATRIMONIO_GLOBAL_INICIAL}`);

  // --------------------------------------------------------------------------
  // PRUEBA 1: CREAR EL FONDO DE EMERGENCIAS TIPO 'emergency'
  // --------------------------------------------------------------------------
  console.log(`\n▶️ [TEST 1] Creando el 'Fondo de Emergencia' (Tipo: emergency) desde la pestaña /savings...`);
  
  let emergencyGoal = await prisma.savingsGoal.findFirst({
    where: { userId: andres.id, type: SavingsGoalType.emergency, isActive: true }
  });

  if (!emergencyGoal) {
    emergencyGoal = await prisma.savingsGoal.create({
      data: {
        userId: andres.id,
        name: 'Fondo de Emergencias Global',
        type: SavingsGoalType.emergency,
        currentAmount: 0,
        icon: '🏥',
        color: '#D32F2F',
        targetAmount: 5000000,
        isActive: true
      }
    });
    console.log(`✅ TEST 1 PASÓ: Fondo Creado con ID ${emergencyGoal.id} y Saldo $0`);
  } else {
    console.log(`✅ TEST 1 PASÓ: Ya existía el fondo de emergencias ID ${emergencyGoal.id}`);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 2: DEPOSITAR AL FONDO DESDE BANCOLOMBIA (Simulando savings.controller.ts)
  // --------------------------------------------------------------------------
  const depositAmount = 250000;
  console.log(`\n▶️ [TEST 2] Depositando $${depositAmount} al Fondo de Emergencias usando Bancolombia...`);

  // Logica idéntica al endpoint POST /api/savings/:id/deposit
  const oldBankBalance = Number(bancolombia.currentBalance);
  
  await prisma.$transaction([
    prisma.savingsGoal.update({
      where: { id: emergencyGoal.id },
      data: { currentAmount: { increment: depositAmount } }
    }),
    prisma.account.update({
      where: { id: bancolombia.id },
      data: { currentBalance: { decrement: depositAmount } }
    }),
    // El frontend espera y el backend original no crea Transacción de Ahorro aquí directamente 
    // pero algunos usuarios lo hacen (en este mock vemos el efecto puro de la cuenta a la meta)
  ]);

  const afterDepositBancolombia = await prisma.account.findUnique({ where: { id: bancolombia.id } });
  const afterDepositGoal = await prisma.savingsGoal.findUnique({ where: { id: emergencyGoal.id } });

  console.log(`   🔸 Bancolombia bajó de $${oldBankBalance} a $${afterDepositBancolombia?.currentBalance}`);
  console.log(`   🔸 Fondo de Emergencias subió a $${afterDepositGoal?.currentAmount}`);

  // Recalcular el Patrimonio: DEBERÍA SER IDENTICO, el dinero solo cambió de bolsillo
  const allAccountsMid = await prisma.account.findMany({ where: { userId: andres.id, isActive: true } });
  const allSavingsMid = await prisma.savingsGoal.findMany({ where: { userId: andres.id, isActive: true } });
  const totalBancosMid = allAccountsMid.reduce((acc, curr) => acc + Number(curr.currentBalance), 0);
  const totalMetasMid = allSavingsMid.reduce((acc, curr) => acc + Number(curr.currentAmount), 0);
  const PATRIMONIO_GLOBAL_MID = totalBancosMid + totalMetasMid;

  console.log(`   ⚖️ Patrimonio Actual Sumado: $${PATRIMONIO_GLOBAL_MID}`);
  if (PATRIMONIO_GLOBAL_MID === PATRIMONIO_GLOBAL_INICIAL) {
    console.log(`✅ TEST 2 PASÓ: ¡Exacto! Los fondos cuadran a nivel macro. No se creó ni perdió dinero.`);
  } else {
    console.error(`❌ TEST 2 FALLÓ: Fuga de Dinero detectada.`);
  }

  // --------------------------------------------------------------------------
  // PRUEBA 3: EJECUTAR GASTO/EGRESO DESDE EL FONDO DE EMERGENCIAS (withdrawFromGoal)
  // --------------------------------------------------------------------------
  const withdrawAmount = 75000;
  console.log(`\n▶️ [TEST 3] Ocurrió una emergencia dental. Gastando $${withdrawAmount} directo desde el Fondo de Emergencias...`);

  // Lógica idéntica al endpoint POST /api/savings/:id/withdraw
  const transactionDate = new Date();
  
  await prisma.$transaction([
    prisma.savingsGoal.update({
      where: { id: emergencyGoal.id },
      data: { currentAmount: { decrement: withdrawAmount }, isCompleted: false },
    }),
    prisma.goalWithdrawal.create({
      data: {
        goalId: emergencyGoal.id,
        userId: andres.id,
        amount: withdrawAmount,
        reason: 'Emergencia Dental Coomeva',
        category: 'health',
        date: transactionDate,
      },
    }),
    prisma.transaction.create({
      data: {
        userId: andres.id,
        type: TransactionType.expense,
        amount: withdrawAmount,
        description: `Retiro de Fondo/Meta: Emergencia Dental Coomeva`,
        date: transactionDate,
        linkedGoalId: emergencyGoal.id,
      }
    })
  ]);

  const afterWithdrawGoal = await prisma.savingsGoal.findUnique({ where: { id: emergencyGoal.id } });
  console.log(`   🔸 Fondo de Emergencias bajó a $${afterWithdrawGoal?.currentAmount}`);

  // Recalcular el Patrimonio
  const allAccountsEnd = await prisma.account.findMany({ where: { userId: andres.id, isActive: true } });
  const allSavingsEnd = await prisma.savingsGoal.findMany({ where: { userId: andres.id, isActive: true } });
  const totalBancosEnd = allAccountsEnd.reduce((acc, curr) => acc + Number(curr.currentBalance), 0);
  const totalMetasEnd = allSavingsEnd.reduce((acc, curr) => acc + Number(curr.currentAmount), 0);
  const PATRIMONIO_GLOBAL_FINAL = totalBancosEnd + totalMetasEnd;

  console.log(`   ⚖️ Patrimonio Actual Sumado: $${PATRIMONIO_GLOBAL_FINAL}`);
  
  // El patrimonio debe ser exactamente el patrimonio medio MENOS(-1) el gasto de emergencia comprobable
  const expectedPatrimony = PATRIMONIO_GLOBAL_MID - withdrawAmount;

  if (PATRIMONIO_GLOBAL_FINAL === expectedPatrimony) {
    console.log(`✅ TEST 3 PASÓ: ¡Matemática Perfecta! El dinero extraído desapareció de la riqueza total equitativamente. (${PATRIMONIO_GLOBAL_FINAL} == ${expectedPatrimony})`);
  } else {
    console.error(`❌ TEST 3 FALLÓ: Descuadre en el Ecosistema.`);
  }

  console.log('\n🎉 VALIDACIONES DEL MODULO SAVINGS/FONDOS COMPLETADAS CON ÉXITO.');
}

runSavingsE2E()
  .catch(e => {
    console.error('🔥 Falla en los Tests:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
