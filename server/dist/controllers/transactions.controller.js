"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactions = getTransactions;
exports.createTransaction = createTransaction;
exports.updateTransaction = updateTransaction;
exports.deleteTransaction = deleteTransaction;
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
const transactionSchema = zod_1.z.object({
    type: zod_1.z.enum(['income', 'expense', 'transfer']),
    amount: zod_1.z.number().positive('El monto debe ser positivo'),
    description: zod_1.z.string().min(1, 'Descripción requerida'),
    categoryId: zod_1.z.string().uuid().optional(),
    accountId: zod_1.z.string().uuid().optional(),
    percentageRuleId: zod_1.z.string().uuid().optional(),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)'),
    notes: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    isRecurring: zod_1.z.boolean().optional(),
});
// ── GET /api/transactions ─────────────────────────────────
async function getTransactions(req, res) {
    const { type, categoryId, from, to, limit = '50', page = '1' } = req.query;
    const where = { userId: req.userId };
    if (type)
        where.type = type;
    if (categoryId)
        where.categoryId = categoryId;
    if (from || to) {
        where.date = {};
        if (from)
            where.date.gte = new Date(from);
        if (to)
            where.date.lte = new Date(to);
    }
    const take = Math.min(parseInt(limit), 100);
    const skip = (parseInt(page) - 1) * take;
    const [transactions, total] = await Promise.all([
        prisma_1.prisma.transaction.findMany({
            where,
            include: { category: true, account: true },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
            take,
            skip,
        }),
        prisma_1.prisma.transaction.count({ where }),
    ]);
    res.json({ transactions, total, page: parseInt(page), limit: take });
}
// ── POST /api/transactions ────────────────────────────────
async function createTransaction(req, res) {
    const parsed = transactionSchema.safeParse(req.body);
    if (!parsed.success) {
        console.error('[Error de Validación Zod en Transacción]:', parsed.error.flatten().fieldErrors);
        res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const { date, amount, ...rest } = parsed.data;
    const transaction = await prisma_1.prisma.transaction.create({
        data: {
            ...rest,
            amount,
            date: new Date(date),
            userId: req.userId,
            tags: rest.tags || [],
        },
        include: { category: true, account: true },
    });
    res.status(201).json({ transaction });
}
// ── PUT /api/transactions/:id ─────────────────────────────
async function updateTransaction(req, res) {
    const id = req.params.id;
    const existing = await prisma_1.prisma.transaction.findFirst({
        where: { id, userId: req.userId },
    });
    if (!existing) {
        res.status(404).json({ message: 'Transacción no encontrada' });
        return;
    }
    const parsed = transactionSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const { date, ...rest } = parsed.data;
    const transaction = await prisma_1.prisma.transaction.update({
        where: { id },
        data: {
            ...rest,
            ...(date ? { date: new Date(date) } : {}),
        },
        include: { category: true, account: true },
    });
    res.json({ transaction });
}
// ── DELETE /api/transactions/:id ──────────────────────────
async function deleteTransaction(req, res) {
    const id = req.params.id;
    const existing = await prisma_1.prisma.transaction.findFirst({
        where: { id, userId: req.userId },
    });
    if (!existing) {
        res.status(404).json({ message: 'Transacción no encontrada' });
        return;
    }
    await prisma_1.prisma.transaction.delete({ where: { id } });
    res.json({ message: 'Transacción eliminada correctamente' });
}
