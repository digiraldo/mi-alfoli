"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccounts = getAccounts;
exports.createAccount = createAccount;
exports.updateAccount = updateAccount;
exports.deleteAccount = deleteAccount;
exports.updateBalance = updateBalance;
exports.getAccountStats = getAccountStats;
exports.setDefaultAccount = setDefaultAccount;
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
const accountSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nombre requerido'),
    type: zod_1.z.enum(['bank', 'credit_card', 'cash', 'digital_wallet', 'investment']),
    color: zod_1.z.string().default('#006064'),
    icon: zod_1.z.string().default('🏦'),
    currentBalance: zod_1.z.number().optional().default(0),
    creditLimit: zod_1.z.number().optional(),
    lastFour: zod_1.z.string().max(4).optional(),
    isActive: zod_1.z.boolean().optional().default(true),
});
// ── GET /api/accounts ─────────────────────────────────────
async function getAccounts(req, res) {
    const accounts = await prisma_1.prisma.account.findMany({
        where: { userId: req.userId, isActive: true },
        orderBy: { createdAt: 'asc' },
    });
    res.json({ accounts });
}
// ── POST /api/accounts ────────────────────────────────────
async function createAccount(req, res) {
    const parsed = accountSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const account = await prisma_1.prisma.account.create({
        data: { ...parsed.data, userId: req.userId },
    });
    res.status(201).json({ account });
}
// ── PUT /api/accounts/:id ─────────────────────────────────
async function updateAccount(req, res) {
    const id = req.params.id;
    const existing = await prisma_1.prisma.account.findFirst({ where: { id, userId: req.userId } });
    if (!existing) {
        res.status(404).json({ message: 'Cuenta no encontrada' });
        return;
    }
    const parsed = accountSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const account = await prisma_1.prisma.account.update({ where: { id }, data: parsed.data });
    res.json({ account });
}
// ── DELETE /api/accounts/:id ──────────────────────────────
async function deleteAccount(req, res) {
    const id = req.params.id;
    const existing = await prisma_1.prisma.account.findFirst({ where: { id, userId: req.userId } });
    if (!existing) {
        res.status(404).json({ message: 'Cuenta no encontrada' });
        return;
    }
    // Soft delete
    await prisma_1.prisma.account.update({ where: { id }, data: { isActive: false } });
    res.json({ message: 'Cuenta eliminada correctamente' });
}
// ── PATCH /api/accounts/:id/balance ───────────────────────
async function updateBalance(req, res) {
    const id = req.params.id;
    const { amount } = req.body;
    if (typeof amount !== 'number') {
        res.status(400).json({ message: 'Monto inválido' });
        return;
    }
    const existing = await prisma_1.prisma.account.findFirst({ where: { id, userId: req.userId } });
    if (!existing) {
        res.status(404).json({ message: 'Cuenta no encontrada' });
        return;
    }
    const account = await prisma_1.prisma.account.update({ where: { id }, data: { currentBalance: amount } });
    res.json({ account });
}
// ── GET /api/accounts/:id/stats ───────────────────────────
// Retorna las transacciones agrupadas por mes para esta cuenta
async function getAccountStats(req, res) {
    const id = req.params.id;
    const existing = await prisma_1.prisma.account.findFirst({ where: { id, userId: req.userId } });
    if (!existing) {
        res.status(404).json({ message: 'Cuenta no encontrada' });
        return;
    }
    // Últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const transactions = await prisma_1.prisma.transaction.findMany({
        where: {
            accountId: id,
            userId: req.userId,
            date: { gte: sixMonthsAgo },
        },
        orderBy: { date: 'desc' },
    });
    const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    res.json({ account: existing, totalIncome, totalExpense, transactions });
}
// ── PATCH /api/accounts/:id/default ───────────────────────
async function setDefaultAccount(req, res) {
    const id = req.params.id;
    const existing = await prisma_1.prisma.account.findFirst({ where: { id, userId: req.userId } });
    if (!existing) {
        res.status(404).json({ message: 'Cuenta no encontrada' });
        return;
    }
    // Transacción segura: Apaga TODAS las anteriores y enciende exclusivamente la seleccionada.
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.account.updateMany({
            where: { userId: req.userId, isDefault: true },
            data: { isDefault: false }
        }),
        prisma_1.prisma.account.update({
            where: { id },
            data: { isDefault: true }
        })
    ]);
    res.json({ message: 'Cuenta establecida como principal y predeterminada.' });
}
