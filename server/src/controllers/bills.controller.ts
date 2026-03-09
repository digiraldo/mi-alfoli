import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const billSchema = z.object({
  name: z.string().min(1),
  provider: z.string().optional(),
  dueDay: z.number().int().min(1).max(31),
  amount: z.number().positive(),
  isVariableAmount: z.boolean().optional(),
  color: z.string().default('#006064'),
  isActive: z.boolean().optional(),
});

// ── GET /api/bills ────────────────────────────────────────
export async function getBills(req: AuthRequest, res: Response): Promise<void> {
  const bills = await prisma.monthlyBill.findMany({
    where: { userId: req.userId, isActive: true },
    include: { payments: { orderBy: { createdAt: 'desc' }, take: 3 } },
    orderBy: { dueDay: 'asc' },
  });
  res.json({ bills });
}

// ── POST /api/bills ───────────────────────────────────────
export async function createBill(req: AuthRequest, res: Response): Promise<void> {
  const parsed = billSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const bill = await prisma.monthlyBill.create({
    data: { ...parsed.data, userId: req.userId! },
  });
  res.status(201).json({ bill });
}

// ── PUT /api/bills/:id ────────────────────────────────────
export async function updateBill(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.monthlyBill.findFirst({ where: { id, userId: req.userId } });
  if (!existing) {
    res.status(404).json({ message: 'Cuenta no encontrada' });
    return;
  }

  const parsed = billSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const bill = await prisma.monthlyBill.update({ where: { id }, data: parsed.data });
  res.json({ bill });
}

// ── DELETE /api/bills/:id ─────────────────────────────────
export async function deleteBill(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.monthlyBill.findFirst({ where: { id, userId: req.userId } });
  if (!existing) {
    res.status(404).json({ message: 'Cuenta no encontrada' });
    return;
  }
  await prisma.monthlyBill.update({ where: { id }, data: { isActive: false } });
  res.json({ message: 'Cuenta desactivada correctamente' });
}

// ── POST /api/bills/:id/mark-paid ─────────────────────────
export async function markPaid(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { year, month, amountPaid, notes } = req.body;

  const bill = await prisma.monthlyBill.findFirst({ where: { id, userId: req.userId } });
  if (!bill) {
    res.status(404).json({ message: 'Cuenta no encontrada' });
    return;
  }

  const y = year ?? new Date().getFullYear();
  const m = month ?? new Date().getMonth() + 1;

  const payment = await prisma.billPayment.upsert({
    where: { id: `${id}-${y}-${m}` },
    create: {
      id: `${id}-${y}-${m}`,
      monthlyBillId: id,
      userId: req.userId!,
      year: y,
      month: m,
      amountPaid: amountPaid ?? Number(bill.amount),
      paidDate: new Date(),
      status: 'paid',
      notes,
    },
    update: {
      amountPaid: amountPaid ?? Number(bill.amount),
      paidDate: new Date(),
      status: 'paid',
      notes,
    },
  });

  res.json({ payment, message: 'Cuenta marcada como pagada ✓' });
}
