import { Category, Account, Transaction, PercentageRule, MonthlyBill } from '@/types';
import { format, subDays, subMonths } from 'date-fns';

const today = new Date();
const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

// ──────────────────────────────────────────────
// CATEGORÍAS POR DEFECTO
// ──────────────────────────────────────────────
export const defaultCategories: Category[] = [
  // Ingresos
  { id: 'cat-001', name: 'Sueldo', type: 'income', icon: '💼', color: '#4CAF50', isDefault: true },
  { id: 'cat-002', name: 'Freelance', type: 'income', icon: '💻', color: '#8BC34A', isDefault: true },
  { id: 'cat-003', name: 'Inversiones', type: 'income', icon: '📈', color: '#00BCD4', isDefault: true },
  { id: 'cat-004', name: 'Regalos', type: 'income', icon: '🎁', color: '#E91E63', isDefault: true },
  { id: 'cat-005', name: 'Reembolsos', type: 'income', icon: '🔄', color: '#FF9800', isDefault: true },
  { id: 'cat-006', name: 'Otros ingresos', type: 'income', icon: '📋', color: '#9E9E9E', isDefault: true },
  // Egresos
  { id: 'cat-007', name: 'Servicios', type: 'expense', icon: '💡', color: '#FF5722', isDefault: true },
  { id: 'cat-008', name: 'Transporte', type: 'expense', icon: '🚗', color: '#2196F3', isDefault: true },
  { id: 'cat-009', name: 'Alimentación', type: 'expense', icon: '🍔', color: '#4CAF50', isDefault: true },
  { id: 'cat-010', name: 'Mercado', type: 'expense', icon: '🛒', color: '#8BC34A', isDefault: true },
  { id: 'cat-011', name: 'Restaurantes', type: 'expense', icon: '🍽️', color: '#FF9800', isDefault: true },
  { id: 'cat-012', name: 'Entretenimiento', type: 'expense', icon: '🎬', color: '#9C27B0', isDefault: true },
  { id: 'cat-013', name: 'Suscripciones', type: 'expense', icon: '📱', color: '#3F51B5', isDefault: true },
  { id: 'cat-014', name: 'Salud', type: 'expense', icon: '🏥', color: '#F44336', isDefault: true },
  { id: 'cat-015', name: 'Educación', type: 'expense', icon: '📚', color: '#00BCD4', isDefault: true },
  { id: 'cat-016', name: 'Ropa', type: 'expense', icon: '👕', color: '#E91E63', isDefault: true },
  { id: 'cat-017', name: 'Hogar', type: 'expense', icon: '🏠', color: '#795548', isDefault: true },
  { id: 'cat-018', name: 'Donación', type: 'expense', icon: '❤️', color: '#E91E63', isDefault: true },
  { id: 'cat-019', name: 'Diezmo', type: 'expense', icon: '🙏', color: '#006064', isDefault: true },
  { id: 'cat-020', name: 'Otros gastos', type: 'expense', icon: '📋', color: '#9E9E9E', isDefault: true },
];

// ──────────────────────────────────────────────
// CUENTAS DEMO
// ──────────────────────────────────────────────
export const demoAccounts: Account[] = [
  { id: 'acc-001', name: 'Bancolombia', type: 'bank', color: '#006064', icon: '🏦', currentBalance: 3500000, isActive: true },
  { id: 'acc-002', name: 'Nequi', type: 'digital_wallet', color: '#00838F', icon: '📱', currentBalance: 850000, isActive: true },
  { id: 'acc-003', name: 'Efectivo', type: 'cash', color: '#FFB300', icon: '💵', currentBalance: 200000, isActive: true },
];

// ──────────────────────────────────────────────
// TRANSACCIONES DEMO
// ──────────────────────────────────────────────
export const demoTransactions: Transaction[] = [
  {
    id: 'txn-001', userId: 'user-001', accountId: 'acc-001', categoryId: 'cat-001',
    type: 'income', amount: 3500000, description: 'Sueldo marzo 2026',
    date: fmt(subDays(today, 5)), createdAt: fmt(subDays(today, 5)), updatedAt: fmt(subDays(today, 5)),
  },
  {
    id: 'txn-002', userId: 'user-001', accountId: 'acc-002', categoryId: 'cat-002',
    type: 'income', amount: 800000, description: 'Proyecto freelance sitio web',
    date: fmt(subDays(today, 3)), createdAt: fmt(subDays(today, 3)), updatedAt: fmt(subDays(today, 3)),
  },
  {
    id: 'txn-003', userId: 'user-001', accountId: 'acc-001', categoryId: 'cat-019',
    type: 'expense', amount: 350000, description: 'Diezmo — Marzo',
    date: fmt(subDays(today, 5)), createdAt: fmt(subDays(today, 5)), updatedAt: fmt(subDays(today, 5)),
  },
  {
    id: 'txn-004', userId: 'user-001', accountId: 'acc-002', categoryId: 'cat-009',
    type: 'expense', amount: 185000, description: 'Mercado semanal',
    date: fmt(subDays(today, 2)), createdAt: fmt(subDays(today, 2)), updatedAt: fmt(subDays(today, 2)),
  },
  {
    id: 'txn-005', userId: 'user-001', accountId: 'acc-003', categoryId: 'cat-008',
    type: 'expense', amount: 45000, description: 'Gasolina moto',
    date: fmt(subDays(today, 1)), createdAt: fmt(subDays(today, 1)), updatedAt: fmt(subDays(today, 1)),
  },
  {
    id: 'txn-006', userId: 'user-001', accountId: 'acc-001', categoryId: 'cat-007',
    type: 'expense', amount: 120000, description: 'Servicio de internet',
    date: fmt(subDays(today, 4)), createdAt: fmt(subDays(today, 4)), updatedAt: fmt(subDays(today, 4)),
  },
  {
    id: 'txn-007', userId: 'user-001', accountId: 'acc-002', categoryId: 'cat-013',
    type: 'expense', amount: 35900, description: 'Netflix mensual',
    date: fmt(subDays(today, 6)), createdAt: fmt(subDays(today, 6)), updatedAt: fmt(subDays(today, 6)),
  },
  {
    id: 'txn-008', userId: 'user-001', accountId: 'acc-001', categoryId: 'cat-017',
    type: 'expense', amount: 950000, description: 'Arriendo marzo',
    date: fmt(subDays(today, 5)), createdAt: fmt(subDays(today, 5)), updatedAt: fmt(subDays(today, 5)),
  },
  {
    id: 'txn-009', userId: 'user-001', accountId: 'acc-002', categoryId: 'cat-011',
    type: 'expense', amount: 67000, description: 'Almuerzo familiar',
    date: fmt(today), createdAt: fmt(today), updatedAt: fmt(today),
  },
  {
    id: 'txn-010', userId: 'user-001', accountId: 'acc-001', categoryId: 'cat-018',
    type: 'expense', amount: 100000, description: 'Ofrenda misiones',
    date: fmt(subDays(today, 5)), createdAt: fmt(subDays(today, 5)), updatedAt: fmt(subDays(today, 5)),
  },
];

// ──────────────────────────────────────────────
// PORCENTAJES DEMO
// ──────────────────────────────────────────────
export const demoPercentageRules: PercentageRule[] = [
  { id: 'pct-001', userId: 'user-001', name: 'Diezmo', percentage: 10, color: '#006064', icon: '🙏', description: 'Para la obra de Dios', isActive: true, priority: 1 },
  { id: 'pct-002', userId: 'user-001', name: 'Ahorro', percentage: 20, color: '#00838F', icon: '🏦', description: 'Fondo de emergencia y metas', isActive: true, priority: 2 },
  { id: 'pct-003', userId: 'user-001', name: 'Gastos Fijos', percentage: 50, color: '#FFB300', icon: '🏠', description: 'Arriendo, servicios, comida', isActive: true, priority: 3 },
  { id: 'pct-004', userId: 'user-001', name: 'Inversión', percentage: 10, color: '#4CAF50', icon: '📈', description: 'CDTs, fondos de inversión', isActive: true, priority: 4 },
  { id: 'pct-005', userId: 'user-001', name: 'Donaciones', percentage: 5, color: '#BF360C', icon: '❤️', description: 'Misiones y causas sociales', isActive: true, priority: 5 },
  { id: 'pct-006', userId: 'user-001', name: 'Personal', percentage: 5, color: '#9C27B0', icon: '🎯', description: 'Ocio, ropa, entretenimiento', isActive: true, priority: 6 },
];

// ──────────────────────────────────────────────
// CUENTAS MENSUALES DEMO
// ──────────────────────────────────────────────
export const demoBills: MonthlyBill[] = [
  { id: 'bill-001', userId: 'user-001', name: 'Arriendo', provider: 'Propietario', dueDay: 5, amount: 950000, color: '#795548', isActive: true, createdAt: fmt(subMonths(today, 2)) },
  { id: 'bill-002', userId: 'user-001', name: 'Internet Claro', provider: 'Claro', dueDay: 10, amount: 69900, color: '#E91E63', isActive: true, createdAt: fmt(subMonths(today, 2)) },
  { id: 'bill-003', userId: 'user-001', name: 'Servicio de Luz', provider: 'EPM', dueDay: 15, amount: 120000, isVariableAmount: true, color: '#FF9800', isActive: true, createdAt: fmt(subMonths(today, 2)) },
  { id: 'bill-004', userId: 'user-001', name: 'Netflix', provider: 'Netflix', dueDay: 20, amount: 35900, color: '#E53935', isActive: true, createdAt: fmt(subMonths(today, 2)) },
  { id: 'bill-005', userId: 'user-001', name: 'Spotify', provider: 'Spotify', dueDay: 22, amount: 16900, color: '#1DB954', isActive: true, createdAt: fmt(subMonths(today, 2)) },
  { id: 'bill-006', userId: 'user-001', name: 'Crédito Bancolombia', provider: 'Bancolombia', dueDay: 25, amount: 350000, color: '#006064', isActive: true, createdAt: fmt(subMonths(today, 2)) },
];
