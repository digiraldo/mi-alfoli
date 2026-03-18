import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['income', 'expense']),
  icon: z.string().optional(),
  color: z.string().optional(),
});

import { DEFAULT_CATEGORIES } from '../lib/constants';

// ── GET /api/categories ───────────────────────────────────
export async function getCategories(req: AuthRequest, res: Response): Promise<void> {
  let categories = await prisma.category.findMany({
    where: { userId: req.userId },
    orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
  });

  // SI NO HAY CATEGORÍAS (Usuario nuevo o fallo en registro), crearlas on-the-fly
  if (categories.length === 0) {
    console.log(`[Categorías] Sembrando categorías por defecto para el usuario: ${req.userId}`);
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map(c => ({
        ...c,
        userId: req.userId!,
        isDefault: true
      })),
    });

    // Refetch
    categories = await prisma.category.findMany({
      where: { userId: req.userId },
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  res.json({ categories });
}

// ── POST /api/categories ──────────────────────────────────
export async function createCategory(req: AuthRequest, res: Response): Promise<void> {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const category = await prisma.category.create({
    data: { ...parsed.data, userId: req.userId! },
  });
  res.status(201).json({ category });
}

// ── DELETE /api/categories/:id ────────────────────────────
export async function deleteCategory(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id as string;
  const existing = await prisma.category.findFirst({ where: { id, userId: req.userId } });
  if (!existing) {
    res.status(404).json({ message: 'Categoría no encontrada' });
    return;
  }
  await prisma.category.delete({ where: { id } });
  res.json({ message: 'Categoría eliminada' });
}
