"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBills = getBills;
exports.createBill = createBill;
exports.updateBill = updateBill;
exports.deleteBill = deleteBill;
exports.markPaid = markPaid;
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
const billSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    provider: zod_1.z.string().optional(),
    dueDay: zod_1.z.number().int().min(1).max(31),
    amount: zod_1.z.number().positive(),
    isVariableAmount: zod_1.z.boolean().optional(),
    color: zod_1.z.string().default('#006064'),
    isActive: zod_1.z.boolean().optional(),
});
// ── GET /api/bills ────────────────────────────────────────
async function getBills(req, res) {
    const bills = await prisma_1.prisma.monthlyBill.findMany({
        where: { userId: req.userId, isActive: true },
        include: { payments: { orderBy: { createdAt: 'desc' }, take: 3 } },
        orderBy: { dueDay: 'asc' },
    });
    res.json({ bills });
}
// ── POST /api/bills ───────────────────────────────────────
async function createBill(req, res) {
    const parsed = billSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const bill = await prisma_1.prisma.monthlyBill.create({
        data: { ...parsed.data, userId: req.userId },
    });
    res.status(201).json({ bill });
}
// ── PUT /api/bills/:id ────────────────────────────────────
async function updateBill(req, res) {
    const id = req.params.id;
    const existing = await prisma_1.prisma.monthlyBill.findFirst({ where: { id, userId: req.userId } });
    if (!existing) {
        res.status(404).json({ message: 'Cuenta no encontrada' });
        return;
    }
    const parsed = billSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const bill = await prisma_1.prisma.monthlyBill.update({ where: { id }, data: parsed.data });
    res.json({ bill });
}
// ── DELETE /api/bills/:id ─────────────────────────────────
async function deleteBill(req, res) {
    const id = req.params.id;
    const existing = await prisma_1.prisma.monthlyBill.findFirst({ where: { id, userId: req.userId } });
    if (!existing) {
        res.status(404).json({ message: 'Cuenta no encontrada' });
        return;
    }
    await prisma_1.prisma.monthlyBill.update({ where: { id }, data: { isActive: false } });
    res.json({ message: 'Cuenta desactivada correctamente' });
}
// ── POST /api/bills/:id/mark-paid ─────────────────────────
async function markPaid(req, res) {
    const id = req.params.id;
    const { year, month, amountPaid, notes } = req.body;
    const bill = await prisma_1.prisma.monthlyBill.findFirst({ where: { id, userId: req.userId } });
    if (!bill) {
        res.status(404).json({ message: 'Cuenta no encontrada' });
        return;
    }
    const y = year ?? new Date().getFullYear();
    const m = month ?? new Date().getMonth() + 1;
    const finalAmount = amountPaid ?? Number(bill.amount);
    const paymentId = `${id}-${y}-${m}`;
    const [payment] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.billPayment.upsert({
            where: { id: paymentId },
            create: {
                id: paymentId,
                monthlyBillId: id,
                userId: req.userId,
                year: y,
                month: m,
                amountPaid: finalAmount,
                paidDate: new Date(),
                status: 'paid',
                notes,
            },
            update: {
                amountPaid: finalAmount,
                paidDate: new Date(),
                status: 'paid',
                notes,
            },
        }),
        prisma_1.prisma.transaction.create({
            data: {
                userId: req.userId,
                type: 'expense',
                amount: finalAmount,
                description: `Pago de Cuenta Mensual: ${bill.name}`,
                date: new Date(),
            }
        })
    ]);
    res.json({ payment, message: 'Cuenta marcada como pagada ✓' });
}
