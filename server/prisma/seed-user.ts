import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Primero borramos completamente la cuenta de prueba de Didier Giraldo
  await prisma.user.deleteMany({
    where: { id: '8294fac9-ce4f-469c-8758-df0f04f440d1' }
  });

  // Apuntamos al usuario Andrés Toro
  const userId = 'a591d158-5c6a-4fa7-9ebd-193fabe9387c';

  console.log(`[Seed] Verificando usuario ${userId}...`);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.log('Usuario no encontrado en la Base de Datos.');
    return;
  }

  console.log(`[Seed] Eliminando datos anteriores para evitar duplicados...`);
  await prisma.transaction.deleteMany({ where: { userId } });
  await prisma.monthlyBill.deleteMany({ where: { userId } });
  await prisma.percentageRule.deleteMany({ where: { userId } });
  await prisma.account.deleteMany({ where: { userId } });

  console.log('[Seed] Creando Cuentas...');
  const accBank = await prisma.account.create({
    data: { name: 'Bancolombia Ahorros', type: 'bank', color: '#fbc02d', userId }
  });
  const accCash = await prisma.account.create({
    data: { name: 'Billetera Fija', type: 'cash', color: '#4caf50', userId }
  });
  const accCredit = await prisma.account.create({
    data: { name: 'Tarjeta de Crédito', type: 'credit_card', color: '#9c27b0', userId }
  });

  console.log('[Seed] Creando Porcentajes Ideales...');
  await prisma.percentageRule.createMany({
    data: [
      { name: 'Diezmo Sagrado', percentage: 10, color: '#00838F', userId },
      { name: 'Ahorro Sólido', percentage: 20, color: '#1976D2', userId },
      { name: 'Gastos y Vida', percentage: 70, color: '#4CAF50', userId },
    ]
  });

  // Fetch Categories for Transactions 
  const categories = await prisma.category.findMany({ where: { userId } });
  
  const getCat = (name: string, fallbackType: string) => {
    const found = categories.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
    if (found) return found.id;
    // Si no encuentra el nombre exacto, trae la primera categoría del tipo indicado (Ingreso o Gasto)
    return categories.find(c => c.type === fallbackType)?.id || categories[0].id;
  };

  console.log('[Seed] Creando Gastos Fijos...');
  await prisma.monthlyBill.createMany({
    data: [
      { name: 'Arriendo / Hipoteca', amount: 1500000, dueDay: 5, userId },
      { name: 'Internet y Telefonía', amount: 120000, dueDay: 15, userId },
      { name: 'Suscripción Netflix', amount: 45000, dueDay: 28, userId },
    ]
  });

  console.log('[Seed] Sembrando Transacciones Históricas (Últimos 30 días)...');
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const txData = [
    // INGRESOS
    { amount: 4000000, type: 'income', description: 'Salario Base Mensual', date: daysAgo(28), accountId: accBank.id, categoryId: getCat('Salario', 'income') },
    { amount: 600000, type: 'income', description: 'Bono Productividad', date: daysAgo(18), accountId: accBank.id, categoryId: getCat('Salario', 'income') },
    { amount: 150000, type: 'income', description: 'Venta Artículo Usado', date: daysAgo(10), accountId: accCash.id, categoryId: getCat('Ventas', 'income') },

    // GASTOS TEMPRANOS
    { amount: -400000, type: 'expense', description: 'Diezmo', date: daysAgo(27), accountId: accBank.id, categoryId: getCat('Diezmo', 'expense') },
    { amount: -1500000, type: 'expense', description: 'Arriendo', date: daysAgo(25), accountId: accBank.id, categoryId: getCat('Vivienda', 'expense') },
    { amount: -250000, type: 'expense', description: 'Mercado Fuerte', date: daysAgo(24), accountId: accCredit.id, categoryId: getCat('Alimentación', 'expense') },
    { amount: -80000, type: 'expense', description: 'Gasolina Quincena', date: daysAgo(22), accountId: accCash.id, categoryId: getCat('Transporte', 'expense') },
    
    // GASTOS MEDIOS
    { amount: -120000, type: 'expense', description: 'Pago Internet Compartido', date: daysAgo(15), accountId: accBank.id, categoryId: getCat('Otros', 'expense') },
    { amount: -60000, type: 'expense', description: 'Salida a Comer', date: daysAgo(14), accountId: accCredit.id, categoryId: getCat('Entretenimiento', 'expense') },
    { amount: -35000, type: 'expense', description: 'Medicinas / Farmacia', date: daysAgo(12), accountId: accCash.id, categoryId: getCat('Salud', 'expense') },
    { amount: -50000, type: 'expense', description: 'Ofrenda Dominical', date: daysAgo(10), accountId: accCash.id, categoryId: getCat('Ofrenda', 'expense') },

    // GASTOS RECIENTES
    { amount: -180000, type: 'expense', description: 'Zapatos Tenis', date: daysAgo(5), accountId: accCredit.id, categoryId: getCat('Ropa', 'expense') },
    { amount: -45000, type: 'expense', description: 'Netflix', date: daysAgo(2), accountId: accCredit.id, categoryId: getCat('Entretenimiento', 'expense') },
    { amount: -25000, type: 'expense', description: 'Almuerzo Oficina', date: now, accountId: accCash.id, categoryId: getCat('Alimentación', 'expense') },
    { amount: -15000, type: 'expense', description: 'Transporte Didi/Uber', date: now, accountId: accBank.id, categoryId: getCat('Transporte', 'expense') },
  ];

  for (const tx of txData) {
    await prisma.transaction.create({
      data: {
        amount: Math.abs(tx.amount),
        type: tx.type,
        description: tx.description,
        date: tx.date,
        accountId: tx.accountId,
        categoryId: tx.categoryId,
        userId
      }
    });
  }

  console.log(`✅ ¡Datos de Prueba generados exitosamente en la cuenta de Andrés Toro!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
