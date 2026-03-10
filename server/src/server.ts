import 'dotenv/config';
import app from './app';
import { prisma } from './lib/prisma';

const PORT = process.env.NODE_ENV === 'production' ? 8000 : parseInt(process.env.PORT || '4000');

async function main() {
  try {
    // Prisma Connect is lazy, we shouldn't block the HTTP server from binding the port immediately 
    // especially for PaaS platforms like Koyeb/Render which expect instant port binding for Health Checks.
    
    app.listen(PORT, '0.0.0.0', () => {
      const ip = require('os').networkInterfaces() as Record<string, any[]>;
      const localIp = (Object.values(ip) as any[]).flat().find((i: any) => i?.family === 'IPv4' && !i?.internal)?.address || 'localhost';
      console.log('');
      console.log('🌾 ══════════════════════════════════════════════════');
      console.log('    Mi Alfolí — API REST corriendo');
      console.log(`    Local:   http://localhost:${PORT}`);
      console.log(`    Network: http://${localIp}:${PORT}`);
      console.log(`    Health:  http://localhost:${PORT}/health`);
      console.log('    "Traed todos los diezmos al alfolí..."');
      console.log('    — Malaquías 3:10 (RVR1960)');
      console.log('🌾 ══════════════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    process.exit(1);
  }
}

main();
