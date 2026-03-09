"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = getCategories;
exports.createCategory = createCategory;
exports.deleteCategory = deleteCategory;
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
const categorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    type: zod_1.z.enum(['income', 'expense']),
    icon: zod_1.z.string().optional(),
    color: zod_1.z.string().optional(),
});
// ── GET /api/categories ───────────────────────────────────
async function getCategories(req, res) {
    const categories = await prisma_1.prisma.category.findMany({
        where: { userId: req.userId },
        orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.json({ categories });
}
// ── POST /api/categories ──────────────────────────────────
async function createCategory(req, res) {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const category = await prisma_1.prisma.category.create({
        data: { ...parsed.data, userId: req.userId },
    });
    res.status(201).json({ category });
}
// ── DELETE /api/categories/:id ────────────────────────────
async function deleteCategory(req, res) {
    const id = req.params.id;
    const existing = await prisma_1.prisma.category.findFirst({ where: { id, userId: req.userId } });
    if (!existing) {
        res.status(404).json({ message: 'Categoría no encontrada' });
        return;
    }
    await prisma_1.prisma.category.delete({ where: { id } });
    res.json({ message: 'Categoría eliminada' });
}
