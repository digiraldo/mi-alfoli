import { PrismaClient, TransactionType, AccountType, PaymentStatus, SavingsGoalType } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function run() {
  console.log('⏳ Iniciando Script de Test para Andres Toro...');

  // 1. Encontrar al usuario
  const users = await prisma.user.findMany({
    where: {
      fullName: {
        contains: 'Andres',
        mode: 'insensitive'
      }
    }
  });

  const andres = users.find(u => u.fullName?.toLowerCase().includes('toro')) || users[0];

  if (!andres) {
    console.error('❌ No se encontró ningún usuario con nombre Andres Toro o similar.');
    process.exit(1);
  }

  console.log(`✅ Usuario encontrado: ${andres.fullName} (${andres.email})`);
  
  // 2. Limpieza Total de Datos MANTENIENDO EL LOGIN
  console.log('🧹 Limpiando base de datos del usuario...');
  
  // El orden de borrado es vital para foreign keys
  await prisma.goalWithdrawal.deleteMany({ where: { userId: andres.id } });
  await prisma.savingsGoal.deleteMany({ where: { userId: andres.id } });
  
  await prisma.transaction.deleteMany({ where: { userId: andres.id } });
  
  await prisma.billPayment.deleteMany({ where: { userId: andres.id } });
  await prisma.monthlyBill.deleteMany({ where: { userId: andres.id } });
  
  await prisma.percentageExecution.deleteMany({ where: { userId: andres.id } });
  await prisma.percentageRule.deleteMany({ where: { userId: andres.id } });
  
  await prisma.account.deleteMany({ where: { userId: andres.id } });
  await prisma.category.deleteMany({ where: { userId: andres.id } });

  console.log('✅ Base de datos limpiada. Todas las transacciones e historial financiero borrados.');

  // 3. Creando Cuentas
  console.log('🏦 Creando Cuentas Bancarias...');
  const currentAccount = await prisma.account.create({
    data: {
      userId: andres.id,
      name: 'Bancolombia Ahorros',
      color: '#FDD835', 
      type: AccountType.bank,
      isActive: true,
      currentBalance: 1500000 
    }
  });

  const cashAccount = await prisma.account.create({
    data: {
      userId: andres.id,
      name: 'Efectivo Billetera',
      color: '#4CAF50', 
      type: AccountType.cash,
      isActive: true,
      currentBalance: 120000 
    }
  });

  const creditCard = await prisma.account.create({
    data: {
      userId: andres.id,
      name: 'Tarjeta Nu',
      color: '#9C27B0', 
      type: AccountType.credit_card,
      isActive: true,
      currentBalance: -250000,
      creditLimit: 5000000 
    }
  });

  // 4. Creando Categorías
  console.log('🏷️ Creando 20 Categorías Por Defecto...');
  
  const defaultCategories = [
    { id: 'cat-001', name: 'Sueldo', type: 'income', icon: '💼', color: '#4CAF50', isDefault: true },
    { id: 'cat-002', name: 'Freelance', type: 'income', icon: '💻', color: '#8BC34A', isDefault: true },
    { id: 'cat-003', name: 'Inversiones', type: 'income', icon: '📈', color: '#00BCD4', isDefault: true },
    { id: 'cat-004', name: 'Regalos', type: 'income', icon: '🎁', color: '#E91E63', isDefault: true },
    { id: 'cat-005', name: 'Reembolsos', type: 'income', icon: '🔄', color: '#FF9800', isDefault: true },
    { id: 'cat-006', name: 'Otros ingresos', type: 'income', icon: '📋', color: '#9E9E9E', isDefault: true },
    // --- NUEVAS CATEGORÍAS INFLUENCER / PRODUCTOR ---
    { id: 'cat-021', name: 'Ingresos YouTube', type: 'income', icon: '🎬', color: '#F44336', isDefault: true },
    { id: 'cat-022', name: 'Regalías DistroKid', type: 'income', icon: '🎵', color: '#9C27B0', isDefault: true },
    { id: 'cat-023', name: 'Marketing Digital', type: 'income', icon: '📱', color: '#00BCD4', isDefault: true },
    { id: 'cat-024', name: 'Producción Audiovisual', type: 'income', icon: '🎥', color: '#607D8B', isDefault: true },
    { id: 'cat-025', name: 'Eventos (Foto/Video)', type: 'income', icon: '📸', color: '#FF9800', isDefault: true },
    { id: 'cat-027', name: 'Patrocinios / Marcas', type: 'income', icon: '🤝', color: '#8BC34A', isDefault: true },
    { id: 'cat-028', name: 'Ofrenda / Semilla', type: 'income', icon: '🕊️', color: '#FBC02D', isDefault: true },
    { id: 'cat-026', name: 'Pensión / Jubilación', type: 'income', icon: '👴', color: '#795548', isDefault: true },
    { id: 'cat-029', name: 'Rentas / Alquileres', type: 'income', icon: '🔑', color: '#4CAF50', isDefault: true },
    { id: 'cat-030', name: 'Plataformas (Uber/Airbnb)', type: 'income', icon: '🚙', color: '#FF9800', isDefault: true },
    // ------------------------------------------------
    { id: 'cat-007', name: 'Servicios', type: 'expense', icon: '💡', color: '#FF5722', isDefault: true },
    { id: 'cat-008', name: 'Transporte', type: 'expense', icon: '🚗', color: '#2196F3', isDefault: true },
    { id: 'cat-009', name: 'Alimentación', type: 'expense', icon: '🍔', color: '#4CAF50', isDefault: true },
    { id: 'cat-010', name: 'Mercado', type: 'expense', icon: '🛒', color: '#8BC34A', isDefault: true },
    { id: 'cat-011', name: 'Restaurantes', type: 'expense', icon: '🍽️', color: '#FF9800', isDefault: true },
    { id: 'cat-012', name: 'Entretenimiento', type: 'expense', icon: '🎬', color: '#9C27B0', isDefault: true },
    { id: 'cat-013', name: 'Suscripciones', type: 'expense', icon: '📱', color: '#3F51B5', isDefault: true },
    { id: 'cat-014', name: 'Salud', type: 'expense', icon: '🏥', color: '#F44336', isDefault: true },
    { id: 'cat-015', name: 'Educación', type: 'expense', icon: '📚', color: '#00BCD4', isDefault: true },
    { id: 'cat-016', name: 'Ropa', type: 'expense', icon: '👕', color: '#E91E63', isDefault: true },
    { id: 'cat-017', name: 'Hogar', type: 'expense', icon: '🏠', color: '#795548', isDefault: true },
    { id: 'cat-018', name: 'Donación', type: 'expense', icon: '❤️', color: '#E91E63', isDefault: true },
    { id: 'cat-019', name: 'Diezmo y Ofrendas', type: 'expense', icon: '🙏', color: '#006064', isDefault: true },
    { id: 'cat-020', name: 'Otros gastos', type: 'expense', icon: '📋', color: '#9E9E9E', isDefault: true },
  ];

  const catsMap: Record<string, string> = {}; // { "Nombre": "ID en BaseDatos" }

  for (const c of defaultCategories) {
    const newCat = await prisma.category.create({
      data: { 
        userId: andres.id, 
        name: c.name, 
        color: c.color, 
        icon: c.icon, 
        type: c.type as TransactionType,
        isDefault: c.isDefault 
      }
    });
    catsMap[newCat.name] = newCat.id;
  }

  // Asignaciones Dinámicas de IDs (para nuestras transacciones mock de más abajo)
  const salaryCatId = catsMap['Sueldo'];
  const bonusCatId = catsMap['Freelance'];
  const foodCatId = catsMap['Mercado'];
  const transportCatId = catsMap['Transporte'];
  const offeringCatId = catsMap['Diezmo y Ofrendas'];
  const youtubeCatId = catsMap['Ingresos YouTube'];
  const distroKidCatId = catsMap['Regalías DistroKid'];
  const eventsCatId = catsMap['Eventos (Foto/Video)'];


  // 5. Creando Reglas de Porcentaje
  console.log('📊 Creando Reglas de Porcentajes Mensuales...');
  
  const rulesToCreate = [
    { name: 'Diezmo Sagrado', percentage: 10, color: '#FFB300', icon: '🙏', priority: 1, desc: 'Apartado de 10% de todo ingreso' },
    { name: 'Fondo de Emergencia', percentage: 10, color: '#D32F2F', icon: '🏥', priority: 2, desc: 'Ahorro intocable' },
    { name: 'Libre Inversión / Ahorro', percentage: 5, color: '#388E3C', icon: '📈', priority: 3, desc: 'Proyectos a futuro' },
    { name: 'Provisiones Anuales', percentage: 5, color: '#1976D2', icon: '📅', priority: 4, desc: 'Seguros, impuestos y mantenimiento' }
  ];

  const createdRules = [];
  for (const r of rulesToCreate) {
    const newRule = await prisma.percentageRule.create({
      data: {
        userId: andres.id,
        name: r.name,
        percentage: r.percentage,
        color: r.color,
        icon: r.icon,
        description: r.desc,
        priority: r.priority,
        isActive: true
      }
    });
    createdRules.push(newRule);
  }

  const diezmoRule = createdRules.find(r => r.name === 'Diezmo Sagrado');
  const emergenciaRule = createdRules.find(r => r.name === 'Fondo de Emergencia');

  const currentMonth = dayjs().month() + 1;
  const currentYear = dayjs().year();

  // 6. Creando Metas de Ahorro
  console.log('🎯 Creando Metas de Ahorro y Fondos...');
  const savingsGoal = await prisma.savingsGoal.create({
    data: {
      userId: andres.id,
      name: 'Viaje a San Andrés',
      targetAmount: 3000000,
      currentAmount: 450000,
      color: '#00BCD4',
      icon: '✈️',
      deadline: dayjs().add(4, 'month').toDate(),
      type: SavingsGoalType.goal,
      isActive: true,
      notes: 'Separación Vuelos lista'
    }
  });


  // 7. Simular Gastos Fijos (MonthlyBills)
  console.log('📅 Inyectando Cuentas y Gastos Fijos Mensuales...');
  const arriendo = await prisma.monthlyBill.create({
    data: {
      userId: andres.id,
      name: 'Arriendo Apartamento',
      amount: 850000,
      dueDay: 15, 
      color: '#8D6E63',
      isActive: true
    }
  });

  const claro = await prisma.monthlyBill.create({
    data: {
      userId: andres.id,
      name: 'Internet Claro',
      amount: 80000,
      dueDay: 20, 
      color: '#E53935',
      isActive: true
    }
  });

  // Simulamos pago de claro
  await prisma.billPayment.create({
    data: {
      userId: andres.id,
      monthlyBillId: claro.id,
      year: currentYear,
      month: currentMonth,
      amountPaid: 80000,
      paidDate: dayjs().subtract(2, 'day').toDate(),
      status: PaymentStatus.paid
    }
  });

  // 8. Creando Transacciones Históricas Realistas
  console.log('🔀 Generando Transacciones Financieras y liquidando porcentajes...');
  
  await prisma.transaction.create({
    data: {
      userId: andres.id,
      accountId: currentAccount.id,
      categoryId: salaryCatId,
      type: TransactionType.income,
      amount: 3200000,
      date: dayjs().subtract(1, 'day').toDate(),
      description: 'Salario Quincena Empresa',
    }
  });

  await prisma.transaction.create({
    data: {
      userId: andres.id,
      accountId: currentAccount.id,
      categoryId: youtubeCatId,
      type: TransactionType.income,
      amount: 850000,
      date: dayjs().subtract(5, 'day').toDate(),
      description: 'Pago Adsense YouTube (Mes Anterior)',
    }
  });

  await prisma.transaction.create({
    data: {
      userId: andres.id,
      accountId: currentAccount.id,
      categoryId: distroKidCatId,
      type: TransactionType.income,
      amount: 450000,
      date: dayjs().subtract(2, 'day').toDate(),
      description: 'Regalías Spotify & Apple Music',
    }
  });

  await prisma.transaction.create({
    data: {
      userId: andres.id,
      accountId: cashAccount.id,
      categoryId: eventsCatId,
      type: TransactionType.income,
      amount: 550000,
      date: dayjs().subtract(8, 'day').toDate(),
      description: 'Anticipo Cobertura Boda (Foto/Video)',
    }
  });

  const totalIncomeMes = 5050000; // Recalculado con los nuevos montos

  for (const rule of createdRules) {
    const percentageNumber = Number(rule.percentage);
    const ruleAllocated = (totalIncomeMes * percentageNumber) / 100;
    
    const carriedOver = rule.name === 'Fondo de Emergencia' ? 120000 : 0; 

    await prisma.percentageExecution.create({
      data: {
        userId: andres.id,
        percentageRuleId: rule.id,
        year: currentYear,
        month: currentMonth,
        allocatedAmount: ruleAllocated,
        executedAmount: 0, 
        carriedOverAmount: carriedOver,
        isClosed: false
      }
    });
  }

  // Ahora simulamos los Egresos (Gastos), algunos asignados a Reglas
  await prisma.transaction.create({
    data: {
      userId: andres.id,
      accountId: currentAccount.id,
      categoryId: offeringCatId,
      percentageRuleId: diezmoRule?.id,
      type: TransactionType.expense,
      amount: 320000, 
      date: dayjs().toDate(),
      description: 'Diezmo Iglesia de Quincena 1',
    }
  });

  await prisma.percentageExecution.update({
    where: {
      percentageRuleId_year_month: {
         percentageRuleId: diezmoRule!.id, year: currentYear, month: currentMonth
      }
    },
    data: { executedAmount: 320000 }
  });

  await prisma.transaction.create({
    data: {
      userId: andres.id,
      accountId: cashAccount.id,
      categoryId: foodCatId,
      type: TransactionType.expense,
      amount: 180000,
      date: dayjs().subtract(3, 'day').toDate(),
      description: 'Mercado Plaza D1 y fruver',
    }
  });

  await prisma.transaction.create({
    data: {
      userId: andres.id,
      accountId: creditCard.id,
      categoryId: transportCatId,
      type: TransactionType.expense,
      amount: 35000,
      date: dayjs().subtract(4, 'day').toDate(),
      description: 'Uber Aeropuerto',
    }
  });

  console.log('✅ Base de datos rellenada victoriosamente con las finanzas completas para el mes.');
  console.log(`💡 Ingresa a la app con el correo ${andres.email} para ver la magia de Mi Alfolí con datos realistas.`);
}

run()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
