import { create } from 'zustand';
import { PercentageRule, PercentageExecution } from '@/types';
import api from '@/lib/api';

interface PercentageState {
  rules: PercentageRule[];
  executions: PercentageExecution[];
  isLoading: boolean;
  fetchRules: () => Promise<void>;
  fetchExecutions: (year: number, month: number) => Promise<void>;
  addRule: (data: Omit<PercentageRule, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateRule: (id: string, data: Partial<PercentageRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  getTotalPercentage: () => number;
  initDemo: () => void;
}

function mapRule(r: any): PercentageRule {
  return {
    id: r.id,
    userId: r.userId,
    name: r.name,
    percentage: Number(r.percentage),
    color: r.color ?? '#006064',
    icon: r.icon ?? '📊',
    description: r.description,
    isActive: r.isActive ?? true,
    priority: r.priority ?? 0,
    createdAt: r.createdAt,
  };
}

export const usePercentageStore = create<PercentageState>()((set, get) => ({
  rules: [],
  executions: [],
  isLoading: false,

  fetchRules: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<{ rules: any[] }>('/api/percentages');
      set({ rules: data.rules.map(mapRule), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchExecutions: async (year, month) => {
    try {
      const data = await api.get<{ executions: any[] }>(`/api/percentages/execution?year=${year}&month=${month}`);
      const execs: PercentageExecution[] = data.executions.map((e) => ({
        id: e.id,
        userId: e.userId,
        percentageRuleId: e.percentageRuleId,
        year: e.year,
        month: e.month,
        allocatedAmount: Number(e.allocatedAmount),
        executedAmount: Number(e.executedAmount),
        createdAt: e.createdAt,
      }));
      set({ executions: execs });
    } catch {
      // silencioso
    }
  },

  addRule: async (data) => {
    const res = await api.post<{ rule: any }>('/api/percentages', {
      ...data,
      percentage: Number(data.percentage),
    });
    set((s) => ({ rules: [...s.rules, mapRule(res.rule)] }));
  },

  updateRule: async (id, data) => {
    const res = await api.put<{ rule: any }>(`/api/percentages/${id}`, {
      ...data,
      percentage: data.percentage !== undefined ? Number(data.percentage) : undefined,
    });
    set((s) => ({ rules: s.rules.map((r) => (r.id === id ? mapRule(res.rule) : r)) }));
  },

  deleteRule: async (id) => {
    await api.delete(`/api/percentages/${id}`);
    set((s) => ({ rules: s.rules.filter((r) => r.id !== id) }));
  },

  getTotalPercentage: () => {
    return get().rules.filter((r) => r.isActive).reduce((sum, r) => sum + r.percentage, 0);
  },

  initDemo: () => {},
}));
