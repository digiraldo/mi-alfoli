import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive('El monto debe ser positivo'),
  description: z.string().min(1, 'Descripción requerida'),
  categoryId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  percentageRuleId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)'),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isRecurring: z.boolean().optional(),
});

// ── GET /api/transactions ─────────────────────────────────
export async function getTransactions(req: AuthRequest, res: Response): Promise<void> {
  const { type, categoryId, from, to, limit = '50', page = '1' } = req.query;

  const where: any = { userId: req.userId };
  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from as string);
    if (to) where.date.lte = new Date(to as string);
  }

  const take = Math.min(parseInt(limit as string), 100);
  const skip = (parseInt(page as string) - 1) * take;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true, account: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take,
      skip,
    }),
    prisma.transaction.count({ where }),
  ]);

  res.json({ transactions, total, page: parseInt(page as string), limit: take });
}

// ── POST /api/transactions ────────────────────────────────
export async function createTransaction(req: AuthRequest, res: Response): Promise<void> {
  const parsed = transactionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const { date, amount, ...rest } = parsed.data;

  const transaction = await prisma.transaction.create({
    data: {
      ...rest,
      amount,
      date: new Date(date),
      userId: req.userId!,
      tags: rest.tags || [],
    },
    include: { category: true, account: true },
  });

  res.status(201).json({ transaction });
}

// ── PUT /api/transactions/:id ─────────────────────────────
export async function updateTransaction(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id as string;

  const existing = await prisma.transaction.findFirst({
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

  const transaction = await prisma.transaction.update({
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
export async function deleteTransaction(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id as string;

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ message: 'Transacción no encontrada' });
    return;
  }

  await prisma.transaction.delete({ where: { id } });
  res.json({ message: 'Transacción eliminada correctamente' });
}
