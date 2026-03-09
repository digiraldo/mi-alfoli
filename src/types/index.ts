export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  currencyCode: string;
  appWebUrl?: string; // URL de la app web
  timezone?: string; // Zona horaria del usuario
  createdAt: string;
}

export interface Category {
  id: string;
  userId?: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isDefault?: boolean;
  sortOrder?: number;
  createdAt?: string;
}

export interface Account {
  id: string;
  userId?: string;
  name: string;
  type: 'bank' | 'credit_card' | 'cash' | 'digital_wallet' | 'investment';
  color: string;
  icon: string;
  currentBalance: number;
  creditLimit?: number;
  lastFour?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId?: string;
  categoryId: string;
  percentageRuleId?: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  notes?: string;
  date: string; // YYYY-MM-DD
  isRecurring?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PercentageRule {
  id: string;
  userId: string;
  name: string;
  percentage: number;
  color: string;
  icon: string;
  description?: string;
  isActive: boolean;
  priority: number;
  createdAt?: string;
}

export interface PercentageExecution {
  id: string;
  userId?: string;
  percentageRuleId: string;
  year: number;
  month: number;
  allocatedAmount: number;
  executedAmount: number;
  createdAt?: string;
}

export interface BillPayment {
  id: string;
  monthlyBillId: string;
  year: number;
  month: number;
  amountPaid: number;
  paidDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  notes?: string;
  createdAt?: string;
}

export interface MonthlyBill {
  id: string;
  userId: string;
  categoryId?: string;
  name: string;
  provider?: string;
  paymentReference?: string;
  dueDay: number;
  amount: number;
  isVariableAmount?: boolean;
  color: string;
  isActive: boolean;
  createdAt: string;
  payments?: BillPayment[]; // Relación anidada desde la API
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
  topCategory: string;
  dailyAverage: number;
}

export type ThemeMode = 'light' | 'dark';

export interface SavingsGoal {
  id: string;
  userId: string;
  accountId?: string | null;
  name: string;
  type: 'emergency' | 'goal';
  icon: string;
  color: string;
  targetAmount?: number | null;
  currentAmount: number;
  deadline?: string | null;
  notes?: string | null;
  isCompleted: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoalWithdrawal {
  id: string;
  goalId: string;
  userId: string;
  amount: number;
  reason: string;
  category: string;
  date: string;
  createdAt: string;
}
