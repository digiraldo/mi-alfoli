import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const ruleSchema = z.object({
  name: z.string().min(1),
  percentage: z.number().min(0.01).max(100),
  color: z.string().default('#006064'),
  icon: z.string().default('📊'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().optional(),
});

// ── GET /api/percentages ──────────────────────────────────
export async function getRules(req: AuthRequest, res: Response): Promise<void> {
  const rules = await prisma.percentageRule.findMany({
    where: { userId: req.userId },
    orderBy: { priority: 'asc' },
  });
  res.json({ rules });
}

// ── POST /api/percentages ─────────────────────────────────
export async function createRule(req: AuthRequest, res: Response): Promise<void> {
  const parsed = ruleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
    return;
  }

  // Validar que el total no exceda 100%
  const existing = await prisma.percentageRule.aggregate({
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

  const rule = await prisma.percentageRule.create({
    data: { ...parsed.data, userId: req.userId! },
  });
  res.status(201).json({ rule });
}

// ── PUT /api/percentages/:id ──────────────────────────────
export async function updateRule(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id as string;
  const existing = await prisma.percentageRule.findFirst({ where: { id, userId: req.userId } });
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
    const others = await prisma.percentageRule.aggregate({
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

  const rule = await prisma.percentageRule.update({ where: { id }, data: parsed.data });
  res.json({ rule });
}

// ── DELETE /api/percentages/:id ───────────────────────────
export async function deleteRule(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id as string;
  const existing = await prisma.percentageRule.findFirst({ where: { id, userId: req.userId } });
  if (!existing) {
    res.status(404).json({ message: 'Regla no encontrada' });
    return;
  }
  await prisma.percentageRule.delete({ where: { id } });
  res.json({ message: 'Regla eliminada' });
}

// ── GET /api/percentages/execution ────────────────────────
export async function getExecution(req: AuthRequest, res: Response): Promise<void> {
  const { year, month } = req.query;
  const y = parseInt(year as string) || new Date().getFullYear();
  const m = parseInt(month as string) || new Date().getMonth() + 1;

  const executions = await prisma.percentageExecution.findMany({
    where: { userId: req.userId, year: y, month: m },
    include: { percentageRule: true },
  });

  res.json({ executions, year: y, month: m });
}
