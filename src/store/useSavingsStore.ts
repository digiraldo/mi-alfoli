import { create } from 'zustand';
import api from '@/lib/api';
import { SavingsGoal, GoalWithdrawal } from '@/types';

interface SavingsState {
  goals: SavingsGoal[];
  isLoading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  createGoal: (data: Partial<SavingsGoal>) => Promise<void>;
  updateGoal: (id: string, data: Partial<SavingsGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  deposit: (id: string, amount: number, accountId: string, notes?: string) => Promise<void>;
  withdraw: (id: string, amount: number, reason: string, category: string) => Promise<SavingsGoal | void>;
  getWithdrawals: (id: string) => Promise<GoalWithdrawal[]>;
}

export const useSavingsStore = create<SavingsState>((set) => ({
  goals: [],
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true });
    try {
      const goals = await api.get<SavingsGoal[]>('/api/savings');
      set({ goals, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createGoal: async (data) => {
    set({ isLoading: true });
    try {
      const goal = await api.post<SavingsGoal>('/api/savings', data);
      set((s) => ({ goals: [...s.goals, goal], isLoading: false }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateGoal: async (id, data) => {
    const goal = await api.put<SavingsGoal>(`/api/savings/${id}`, data);
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? goal : g)) }));
  },

  deleteGoal: async (id) => {
    await api.delete(`/api/savings/${id}`);
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
  },

  deposit: async (id, amount, accountId, notes) => {
    const goal = await api.post<SavingsGoal>(`/api/savings/${id}/deposit`, { amount, accountId, notes });
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? goal : g)) }));
  },

  withdraw: async (id, amount, reason, category) => {
    const result = await api.post<{ goal: SavingsGoal; withdrawal: GoalWithdrawal }>(
      `/api/savings/${id}/withdraw`,
      { amount, reason, category }
    );
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? result.goal : g)) }));
    return result.goal;
  },

  getWithdrawals: async (id) => {
    return await api.get<GoalWithdrawal[]>(`/api/savings/${id}/withdrawals`);
  },
}));
