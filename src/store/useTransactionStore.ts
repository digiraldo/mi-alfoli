import { create } from 'zustand';
import { Transaction, Category } from '@/types';
import api from '@/lib/api';

interface TransactionState {
  transactions: Transaction[];
  categories: Category[];
  isLoading: boolean;
  fetchTransactions: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  addTransaction: (data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  initDemo: () => void; // No-op en modo API
}

function mapApiTransaction(tx: any): Transaction {
  return {
    id: tx.id,
    userId: tx.userId,
    type: tx.type,
    amount: Number(tx.amount),
    description: tx.description,
    notes: tx.notes,
    categoryId: tx.categoryId ?? '',
    accountId: tx.accountId,
    date: typeof tx.date === 'string' ? tx.date.slice(0, 10) : tx.date,
    tags: tx.tags ?? [],
    isRecurring: tx.isRecurring ?? false,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
  };
}

function mapApiCategory(c: any): Category {
  return {
    id: c.id,
    userId: c.userId,
    name: c.name,
    type: c.type,
    icon: c.icon ?? '📋',
    color: c.color ?? '#9E9E9E',
    isDefault: c.isDefault ?? false,
    sortOrder: c.sortOrder ?? 0,
    createdAt: c.createdAt,
  };
}

export const useTransactionStore = create<TransactionState>()((set, get) => ({
  transactions: [],
  categories: [],
  isLoading: false,

  fetchTransactions: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<{ transactions: any[] }>('/api/transactions?limit=200');
      set({ transactions: data.transactions.map(mapApiTransaction), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const data = await api.get<{ categories: any[] }>('/api/categories');
      set({ categories: data.categories.map(mapApiCategory) });
    } catch {
      // silencioso
    }
  },

  addTransaction: async (data) => {
    const payload = {
      ...data,
      amount: Number(data.amount),
      date: typeof data.date === 'string' ? data.date : new Date(data.date).toISOString().slice(0, 10),
    };
    const res = await api.post<{ transaction: any }>('/api/transactions', payload);
    set((s) => ({ transactions: [mapApiTransaction(res.transaction), ...s.transactions] }));
  },

  updateTransaction: async (id, data) => {
    const payload = {
      ...data,
      amount: data.amount !== undefined ? Number(data.amount) : undefined,
      date: data.date ? (typeof data.date === 'string' ? data.date : new Date(data.date).toISOString().slice(0, 10)) : undefined,
    };
    const res = await api.put<{ transaction: any }>(`/api/transactions/${id}`, payload);
    set((s) => ({
      transactions: s.transactions.map((tx) => (tx.id === id ? mapApiTransaction(res.transaction) : tx)),
    }));
  },

  deleteTransaction: async (id) => {
    await api.delete(`/api/transactions/${id}`);
    set((s) => ({ transactions: s.transactions.filter((tx) => tx.id !== id) }));
  },

  initDemo: () => {}, // Ya no se usa — los datos vienen de la API
}));
