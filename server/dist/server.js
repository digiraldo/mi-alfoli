"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const prisma_1 = require("./lib/prisma");
const PORT = parseInt(process.env.PORT || '4000');
async function main() {
    try {
        await prisma_1.prisma.$connect();
        console.log('✅ Conectado a PostgreSQL (Supabase)');
        app_1.default.listen(PORT, '0.0.0.0', () => {
            const ip = require('os').networkInterfaces();
            const localIp = Object.values(ip).flat().find((i) => i?.family === 'IPv4' && !i?.internal)?.address || 'localhost';
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
    }
    catch (error) {
        console.error('❌ Error conectando a la base de datos:', error);
        process.exit(1);
    }
}
main();
