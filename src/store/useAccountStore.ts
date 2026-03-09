import { create } from 'zustand';
import { Account, Transaction } from '@/types';
import api from '@/lib/api';

interface AccountState {
  accounts: Account[];
  isLoading: boolean;
  fetchAccounts: () => Promise<void>;
  addAccount: (data: Omit<Account, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateAccount: (id: string, data: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  updateBalance: (id: string, amount: number) => Promise<void>;
  getAccountStats: (id: string) => Promise<{
    totalIncome: number;
    totalExpense: number;
    transactions: Transaction[];
  }>;
}

function mapAccount(a: any): Account {
  return {
    id: a.id,
    userId: a.userId,
    name: a.name,
    type: a.type,
    color: a.color ?? '#006064',
    icon: a.icon ?? '🏦',
    currentBalance: Number(a.currentBalance),
    lastFour: a.lastFour ?? null,
    creditLimit: a.creditLimit != null ? Number(a.creditLimit) : undefined,
    isActive: a.isActive ?? true,
    createdAt: a.createdAt,
  };
}

export const useAccountStore = create<AccountState>()((set, get) => ({
  accounts: [],
  isLoading: false,

  fetchAccounts: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<{ accounts: any[] }>('/api/accounts');
      set({ accounts: data.accounts.map(mapAccount), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addAccount: async (data) => {
    const res = await api.post<{ account: any }>('/api/accounts', {
      ...data,
      currentBalance: Number(data.currentBalance),
      creditLimit: data.creditLimit ? Number(data.creditLimit) : undefined,
      lastFour: data.lastFour ? data.lastFour : null,
    });
    set((s) => ({ accounts: [...s.accounts, mapAccount(res.account)] }));
  },

  updateAccount: async (id, data) => {
    const payload = {
      ...data,
      currentBalance: data.currentBalance !== undefined ? Number(data.currentBalance) : undefined,
      creditLimit: data.creditLimit !== undefined ? Number(data.creditLimit) : undefined,
      lastFour: data.lastFour !== undefined ? data.lastFour : undefined,
    };
    const res = await api.put<{ account: any }>(`/api/accounts/${id}`, payload);
    set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? mapAccount(res.account) : a)) }));
  },

  deleteAccount: async (id) => {
    await api.delete(`/api/accounts/${id}`);
    set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) }));
  },

  updateBalance: async (id, amount) => {
    const res = await api.patch<{ account: any }>(`/api/accounts/${id}/balance`, { amount });
    set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? mapAccount(res.account) : a)) }));
  },

  getAccountStats: async (id) => {
    const res = await api.get<{ totalIncome: number; totalExpense: number; transactions: any[] }>(
      `/api/accounts/${id}/stats`
    );
    return {
      totalIncome: Number(res.totalIncome),
      totalExpense: Number(res.totalExpense),
      transactions: res.transactions, // Simplificado, idealmente usaríamos el mapper de transactions
    };
  },
}));
