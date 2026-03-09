import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const accountSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  type: z.enum(['bank', 'credit_card', 'cash', 'digital_wallet', 'investment']),
  color: z.string().default('#006064'),
  icon: z.string().default('🏦'),
  currentBalance: z.number().optional().default(0),
  creditLimit: z.number().optional(),
  lastFour: z.string().max(4).optional(),
  isActive: z.boolean().optional().default(true),
});

// ── GET /api/accounts ─────────────────────────────────────
export async function getAccounts(req: AuthRequest, res: Response): Promise<void> {
  const accounts = await prisma.account.findMany({
    where: { userId: req.userId, isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ accounts });
}

// ── POST /api/accounts ────────────────────────────────────
export async function createAccount(req: AuthRequest, res: Response): Promise<void> {
  const parsed = accountSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
    return;
  }
  const account = await prisma.account.create({
    data: { ...parsed.data, userId: req.userId! },
  });
  res.status(201).json({ account });
}

// ── PUT /api/accounts/:id ─────────────────────────────────
export async function updateAccount(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id as string;
  const existing = await prisma.account.findFirst({ where: { id, userId: req.userId } });
  if (!existing) {
    res.status(404).json({ message: 'Cuenta no encontrada' });
    return;
  }
  const parsed = accountSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
    return;
  }
  const account = await prisma.account.update({ where: { id }, data: parsed.data });
  res.json({ account });
}

// ── DELETE /api/accounts/:id ──────────────────────────────
export async function deleteAccount(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id as string;
  const existing = await prisma.account.findFirst({ where: { id, userId: req.userId } });
  if (!existing) {
    res.status(404).json({ message: 'Cuenta no encontrada' });
    return;
  }
  // Soft delete
  await prisma.account.update({ where: { id }, data: { isActive: false } });
  res.json({ message: 'Cuenta eliminada correctamente' });
}

// ── PATCH /api/accounts/:id/balance ───────────────────────
export async function updateBalance(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { amount } = req.body;
  if (typeof amount !== 'number') {
    res.status(400).json({ message: 'Monto inválido' });
    return;
  }
  const existing = await prisma.account.findFirst({ where: { id, userId: req.userId } });
  if (!existing) {
    res.status(404).json({ message: 'Cuenta no encontrada' });
    return;
  }
  const account = await prisma.account.update({ where: { id }, data: { currentBalance: amount } });
  res.json({ account });
}

// ── GET /api/accounts/:id/stats ───────────────────────────
// Retorna las transacciones agrupadas por mes para esta cuenta
export async function getAccountStats(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id as string;
  const existing = await prisma.account.findFirst({ where: { id, userId: req.userId } });
  if (!existing) {
    res.status(404).json({ message: 'Cuenta no encontrada' });
    return;
  }

  // Últimos 6 meses
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const transactions = await prisma.transaction.findMany({
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
