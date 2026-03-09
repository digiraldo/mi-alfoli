"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoals = getGoals;
exports.createGoal = createGoal;
exports.updateGoal = updateGoal;
exports.deleteGoal = deleteGoal;
exports.depositToGoal = depositToGoal;
exports.withdrawFromGoal = withdrawFromGoal;
exports.getWithdrawals = getWithdrawals;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const goalSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    type: zod_1.z.enum(['emergency', 'goal']).default('goal'),
    icon: zod_1.z.string().default('🎯'),
    color: zod_1.z.string().default('#006064'),
    targetAmount: zod_1.z.number().positive().optional().nullable(),
    currentAmount: zod_1.z.number().min(0).default(0),
    accountId: zod_1.z.string().uuid().optional().nullable(),
    deadline: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
});
const depositSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    notes: zod_1.z.string().optional(),
});
const withdrawSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    reason: zod_1.z.string().min(1),
    category: zod_1.z.string().default('other'),
    date: zod_1.z.string().optional(),
});
// GET /api/savings
async function getGoals(req, res) {
    const userId = req.userId;
    const goals = await prisma.savingsGoal.findMany({
        where: { userId, isActive: true },
        orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(goals);
}
// POST /api/savings
async function createGoal(req, res) {
    try {
        const userId = req.userId;
        const data = goalSchema.parse(req.body);
        // Solo puede haber un fondo de emergencias por usuario
        if (data.type === 'emergency') {
            const existing = await prisma.savingsGoal.findFirst({
                where: { userId, type: 'emergency', isActive: true },
            });
            if (existing) {
                return res.status(400).json({ message: 'Ya tienes un fondo de emergencias activo.' });
            }
        }
        const goal = await prisma.savingsGoal.create({
            data: {
                userId,
                name: data.name,
                type: data.type,
                icon: data.icon,
                color: data.color,
                targetAmount: data.targetAmount ?? null,
                currentAmount: data.currentAmount,
                accountId: data.accountId ?? null,
                deadline: data.deadline ? new Date(data.deadline) : null,
                notes: data.notes ?? null,
            },
        });
        res.status(201).json(goal);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
// PUT /api/savings/:id
async function updateGoal(req, res) {
    try {
        const userId = req.userId;
        const id = req.params.id;
        const data = goalSchema.partial().parse(req.body);
        const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
        if (!goal)
            return res.status(404).json({ message: 'Fondo no encontrado.' });
        const updated = await prisma.savingsGoal.update({
            where: { id },
            data: {
                ...data,
                deadline: data.deadline ? new Date(data.deadline) : undefined,
                targetAmount: data.targetAmount !== undefined ? data.targetAmount : undefined,
                accountId: data.accountId !== undefined ? data.accountId : undefined,
            },
        });
        res.json(updated);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
// DELETE /api/savings/:id
async function deleteGoal(req, res) {
    const userId = req.userId;
    const id = req.params.id;
    const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
    if (!goal)
        return res.status(404).json({ message: 'Fondo no encontrado.' });
    await prisma.savingsGoal.update({ where: { id }, data: { isActive: false } });
    res.json({ message: 'Fondo eliminado.' });
}
// POST /api/savings/:id/deposit
async function depositToGoal(req, res) {
    try {
        const userId = req.userId;
        const id = req.params.id;
        const { amount } = depositSchema.parse(req.body);
        const goal = await prisma.savingsGoal.findFirst({ where: { id, userId, isActive: true } });
        if (!goal)
            return res.status(404).json({ message: 'Fondo no encontrado.' });
        const newAmount = Number(goal.currentAmount) + amount;
        const isCompleted = goal.targetAmount ? newAmount >= Number(goal.targetAmount) : false;
        const updated = await prisma.savingsGoal.update({
            where: { id },
            data: { currentAmount: newAmount, isCompleted },
        });
        res.json(updated);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
// POST /api/savings/:id/withdraw
async function withdrawFromGoal(req, res) {
    try {
        const userId = req.userId;
        const id = req.params.id;
        const { amount, reason, category, date } = withdrawSchema.parse(req.body);
        const goal = await prisma.savingsGoal.findFirst({ where: { id, userId, isActive: true } });
        if (!goal)
            return res.status(404).json({ message: 'Fondo no encontrado.' });
        if (amount > Number(goal.currentAmount)) {
            return res.status(400).json({ message: 'Monto insuficiente en el fondo.' });
        }
        const newAmount = Number(goal.currentAmount) - amount;
        const [updatedGoal, withdrawal] = await prisma.$transaction([
            prisma.savingsGoal.update({
                where: { id },
                data: { currentAmount: newAmount, isCompleted: false },
            }),
            prisma.goalWithdrawal.create({
                data: {
                    goalId: id,
                    userId,
                    amount,
                    reason,
                    category,
                    date: date ? new Date(date) : new Date(),
                },
            }),
        ]);
        res.json({ goal: updatedGoal, withdrawal });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
// GET /api/savings/:id/withdrawals
async function getWithdrawals(req, res) {
    const userId = req.userId;
    const id = req.params.id;
    const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
    if (!goal)
        return res.status(404).json({ message: 'Fondo no encontrado.' });
    const withdrawals = await prisma.goalWithdrawal.findMany({
        where: { goalId: id },
        orderBy: { date: 'desc' },
    });
    res.json(withdrawals);
}
