import { create } from 'zustand';
import { SharedGroup, SharedBalance } from '@/types';
import api from '@/lib/api';

interface SharedState {
  groups: SharedGroup[];
  currentGroup: SharedGroup | null;
  currentBalances: SharedBalance | null;
  isLoading: boolean;
  fetchGroups: () => Promise<void>;
  fetchGroupById: (id: string) => Promise<void>;
  createGroup: (data: Partial<SharedGroup>) => Promise<SharedGroup>;
  joinGroup: (groupId: string) => Promise<void>;
  fetchBalances: (groupId: string) => Promise<void>;
}

function mapGroup(g: any): SharedGroup {
  return {
    ...g,
    totalBudget: g.totalBudget ? Number(g.totalBudget) : undefined,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  };
}

export const useSharedStore = create<SharedState>()((set, get) => ({
  groups: [],
  currentGroup: null,
  currentBalances: null,
  isLoading: false,

  fetchGroups: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<any[]>('/api/shared-groups');
      set({ groups: data.map(mapGroup), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchGroupById: async (id: string) => {
    set({ isLoading: true });
    try {
      const data = await api.get<any>(`/api/shared-groups/${id}`);
      set({ currentGroup: mapGroup(data), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createGroup: async (data: Partial<SharedGroup>) => {
    const res = await api.post<any>('/api/shared-groups', data);
    const newGroup = mapGroup(res);
    set((s) => ({ groups: [newGroup, ...s.groups] }));
    return newGroup;
  },

  joinGroup: async (groupId: string) => {
    await api.post<any>(`/api/shared-groups/${groupId}/join`, {});
    // Refrescar grupos después de unirse
    const data = await api.get<any[]>('/api/shared-groups');
    set({ groups: data.map(mapGroup) });
  },

  fetchBalances: async (groupId: string) => {
    try {
      const data = await api.get<SharedBalance>(`/api/shared-groups/${groupId}/balances`);
      set({ currentBalances: data });
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  },
}));
