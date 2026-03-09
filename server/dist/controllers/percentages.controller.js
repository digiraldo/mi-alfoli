"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = getRules;
exports.createRule = createRule;
exports.updateRule = updateRule;
exports.deleteRule = deleteRule;
exports.getExecution = getExecution;
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
const ruleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    percentage: zod_1.z.number().min(0.01).max(100),
    color: zod_1.z.string().default('#006064'),
    icon: zod_1.z.string().default('📊'),
    description: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
    priority: zod_1.z.number().int().optional(),
});
// ── GET /api/percentages ──────────────────────────────────
async function getRules(req, res) {
    const rules = await prisma_1.prisma.percentageRule.findMany({
        where: { userId: req.userId },
        orderBy: { priority: 'asc' },
    });
    res.json({ rules });
}
// ── POST /api/percentages ─────────────────────────────────
async function createRule(req, res) {
    const parsed = ruleSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
        return;
    }
    // Validar que el total no exceda 100%
    const existing = await prisma_1.prisma.percentageRule.aggregate({
        where: { userId: req.userId, isActive: true },
        _sum: { percentage: true },
    });
    const currentTotal = Number(existing._sum.percentage ?? 0);
    if (currentTotal + parsed.data.percentage > 100) {
        res.status(400).json({
            message: `El total de porcentajes excedería el 100%. Disponible: ${(100 - currentTotal).toFixed(2)}%`,
        });
        return;
    }
    const rule = await prisma_1.prisma.percentageRule.create({
        data: { ...parsed.data, userId: req.userId },
    });
    res.status(201).json({ rule });
}
// ── PUT /api/percentages/:id ──────────────────────────────
async function updateRule(req, res) {
    const id = req.params.id;
    const existing = await prisma_1.prisma.percentageRule.findFirst({ where: { id, userId: req.userId } });
    if (!existing) {
        res.status(404).json({ message: 'Regla no encontrada' });
        return;
    }
    const parsed = ruleSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
        return;
    }
    // Re-validar total si cambia el porcentaje
    if (parsed.data.percentage !== undefined) {
        const others = await prisma_1.prisma.percentageRule.aggregate({
            where: { userId: req.userId, isActive: true, id: { not: id } },
            _sum: { percentage: true },
        });
        const othersTotal = Number(others._sum.percentage ?? 0);
        if (othersTotal + parsed.data.percentage > 100) {
            res.status(400).json({
                message: `El total excedería el 100%. Disponible para esta regla: ${(100 - othersTotal).toFixed(2)}%`,
            });
            return;
        }
    }
    const rule = await prisma_1.prisma.percentageRule.update({ where: { id }, data: parsed.data });
    res.json({ rule });
}
// ── DELETE /api/percentages/:id ───────────────────────────
async function deleteRule(req, res) {
    const id = req.params.id;
    const existing = await prisma_1.prisma.percentageRule.findFirst({ where: { id, userId: req.userId } });
    if (!existing) {
        res.status(404).json({ message: 'Regla no encontrada' });
        return;
    }
    await prisma_1.prisma.percentageRule.delete({ where: { id } });
    res.json({ message: 'Regla eliminada' });
}
// ── GET /api/percentages/execution ────────────────────────
async function getExecution(req, res) {
    const { year, month } = req.query;
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    const executions = await prisma_1.prisma.percentageExecution.findMany({
        where: { userId: req.userId, year: y, month: m },
        include: { percentageRule: true },
    });
    res.json({ executions, year: y, month: m });
}
