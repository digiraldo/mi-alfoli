const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.cldamwejtvuovnjsxpwo:Semeolvid0%4026@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
    }
  }
});
prisma.$queryRaw`SELECT 1`.then(console.log).catch(console.error).finally(() => prisma.$disconnect());
