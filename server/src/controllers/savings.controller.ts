import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

type SavingsGoalType = 'emergency' | 'goal';

const prisma = new PrismaClient();

const goalSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['emergency', 'goal'] as const).default('goal'),
  icon: z.string().default('🎯'),
  color: z.string().default('#006064'),
  targetAmount: z.number().positive().optional().nullable(),
  currentAmount: z.number().min(0).default(0),
  accountId: z.string().uuid().optional().nullable(),
  deadline: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const depositSchema = z.object({
  amount: z.number().positive(),
  accountId: z.string().uuid('Debe seleccionar una cuenta válida'),
  notes: z.string().optional(),
});

const withdrawSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().min(1),
  category: z.string().default('other'),
  date: z.string().optional(),
});

// GET /api/savings
export async function getGoals(req: Request, res: Response) {
  const userId = (req as any).userId;
  const goals = await prisma.savingsGoal.findMany({
    where: { userId, isActive: true },
    orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
  });
  res.json(goals);
}

// POST /api/savings
export async function createGoal(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
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
        deadline: data.deadline ? new Date(data.deadline as string) : null,
        notes: data.notes ?? null,
      },
    });
    res.status(201).json(goal);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

// PUT /api/savings/:id
export async function updateGoal(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const id = req.params.id as string;
    const data = goalSchema.partial().parse(req.body);

    const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
    if (!goal) return res.status(404).json({ message: 'Fondo no encontrado.' });

    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline as string) : undefined,
        targetAmount: data.targetAmount !== undefined ? data.targetAmount : undefined,
        accountId: data.accountId !== undefined ? data.accountId : undefined,
      },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

// DELETE /api/savings/:id
export async function deleteGoal(req: Request, res: Response) {
  const userId = (req as any).userId;
  const id = req.params.id as string;
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!goal) return res.status(404).json({ message: 'Fondo no encontrado.' });
  await prisma.savingsGoal.update({ where: { id }, data: { isActive: false } });
  res.json({ message: 'Fondo eliminado.' });
}

// POST /api/savings/:id/deposit
export async function depositToGoal(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const id = req.params.id as string;
    const { amount, accountId } = depositSchema.parse(req.body);

    const goal = await prisma.savingsGoal.findFirst({ where: { id, userId, isActive: true } });
    if (!goal) return res.status(404).json({ message: 'Fondo no encontrado.' });

    // Verificar si la cuenta origen existe y tiene fondos
    const account = await prisma.account.findFirst({ where: { id: accountId, userId, isActive: true } });
    if (!account) return res.status(404).json({ message: 'Cuenta de origen no encontrada.' });
    if (Number(account.currentBalance) < amount) {
       return res.status(400).json({ message: 'Saldo insuficiente en la cuenta seleccionada.' });
    }

    const newGoalAmount = Number(goal.currentAmount) + amount;
    const newAccountBalance = Number(account.currentBalance) - amount;
    const isCompleted = goal.targetAmount ? newGoalAmount >= Number(goal.targetAmount) : false;

    const [updated] = await prisma.$transaction([
      prisma.savingsGoal.update({
        where: { id },
        data: { currentAmount: newGoalAmount, isCompleted },
      }),
      prisma.account.update({
        where: { id: accountId },
        data: { currentBalance: newAccountBalance },
      }),
    ]);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

// POST /api/savings/:id/withdraw
export async function withdrawFromGoal(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const id = req.params.id as string;
    const { amount, reason, category, date } = withdrawSchema.parse(req.body);

    const goal = await prisma.savingsGoal.findFirst({ where: { id, userId, isActive: true } });
    if (!goal) return res.status(404).json({ message: 'Fondo no encontrado.' });

    if (amount > Number(goal.currentAmount)) {
      return res.status(400).json({ message: 'Monto insuficiente en el fondo.' });
    }

    const newAmount = Number(goal.currentAmount) - amount;
    const transactionDate = date ? new Date(date) : new Date();

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
          date: transactionDate,
        },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'expense',
          amount,
          description: `Retiro de Fondo/Meta: ${reason}`,
          date: transactionDate,
          linkedGoalId: id,
        }
      })
    ]);

    res.json({ goal: updatedGoal, withdrawal });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

// GET /api/savings/:id/withdrawals
export async function getWithdrawals(req: Request, res: Response) {
  const userId = (req as any).userId;
  const id = req.params.id as string;

  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!goal) return res.status(404).json({ message: 'Fondo no encontrado.' });

  const withdrawals = await prisma.goalWithdrawal.findMany({
    where: { goalId: id },
    orderBy: { date: 'desc' },
  });
  res.json(withdrawals);
}
