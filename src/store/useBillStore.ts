import { create } from 'zustand';
import { MonthlyBill, BillPayment } from '@/types';
import api from '@/lib/api';

interface BillState {
  bills: MonthlyBill[];
  payments: BillPayment[];
  isLoading: boolean;
  fetchBills: () => Promise<void>;
  addBill: (data: Partial<MonthlyBill>) => Promise<void>;
  updateBill: (id: string, data: Partial<MonthlyBill>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  markAsPaid: (id: string, year: number, month: number, amount: number) => Promise<void>;
  getBillStatus: (billId: string, year: number, month: number) => 'paid' | 'pending' | 'overdue';
  initDemo: () => void;
}

function mapBill(b: any): MonthlyBill {
  return {
    id: b.id,
    userId: b.userId,
    name: b.name,
    provider: b.provider,
    dueDay: b.dueDay,
    amount: Number(b.amount),
    isVariableAmount: b.isVariableAmount ?? false,
    color: b.color ?? '#006064',
    isActive: b.isActive ?? true,
    createdAt: b.createdAt,
    payments: (b.payments ?? []).map((p: any): BillPayment => ({
      id: p.id,
      userId: p.userId,
      monthlyBillId: b.id,
      year: p.year,
      month: p.month,
      amountPaid: Number(p.amountPaid),
      paidDate: p.paidDate,
      status: p.status,
      notes: p.notes,
      createdAt: p.createdAt,
    })),
  };
}

export const useBillStore = create<BillState>()((set, get) => ({
  bills: [],
  payments: [],
  isLoading: false,

  fetchBills: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<{ bills: any[] }>('/api/bills');
      set({ bills: data.bills.map(mapBill), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addBill: async (data) => {
    const res = await api.post<{ bill: any }>('/api/bills', {
      ...data,
      amount: Number(data.amount),
    });
    set((s) => ({ bills: [...s.bills, mapBill(res.bill)] }));
  },

  updateBill: async (id, data) => {
    const res = await api.put<{ bill: any }>(`/api/bills/${id}`, {
      ...data,
      amount: data.amount !== undefined ? Number(data.amount) : undefined,
    });
    set((s) => ({ bills: s.bills.map((b) => (b.id === id ? mapBill(res.bill) : b)) }));
  },

  deleteBill: async (id) => {
    await api.delete(`/api/bills/${id}`);
    set((s) => ({ bills: s.bills.filter((b) => b.id !== id) }));
  },

  markAsPaid: async (id, year, month, amount) => {
    const res = await api.post<{ payment: any }>(`/api/bills/${id}/mark-paid`, {
      year, month, amountPaid: amount,
    });
    // Actualizar el bill con el pago
    set((s) => ({
      bills: s.bills.map((b) => {
        if (b.id !== id) return b;
        const newPayment: BillPayment = {
          id: res.payment.id,
          userId: res.payment.userId,
          monthlyBillId: id,
          year, month,
          amountPaid: amount,
          paidDate: new Date().toISOString(),
          status: 'paid',
          notes: undefined,
          createdAt: res.payment.createdAt,
        };
        const existingPayments = (b.payments ?? []).filter((p) => !(p.year === year && p.month === month));
        return { ...b, payments: [...existingPayments, newPayment] };
      }),
    }));
  },

  getBillStatus: (billId, year, month) => {
    const bill = get().bills.find((b) => b.id === billId);
    if (!bill) return 'pending';

    const payment = (bill.payments ?? []).find((p) => p.year === year && p.month === month && p.status === 'paid');
    if (payment) return 'paid';

    const today = new Date();
    if (today.getMonth() + 1 === month && today.getFullYear() === year) {
      return today.getDate() > bill.dueDay ? 'overdue' : 'pending';
    }
    return 'pending';
  },

  initDemo: () => {},
}));
