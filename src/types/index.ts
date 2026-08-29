export type TransactionType = 'expense' | 'income';

export type PaymentMethod = 
  | 'Cash' 
  | 'Credit Card' 
  | 'Debit Card' 
  | 'UPI / NetBanking' 
  | 'Bank Transfer' 
  | 'Other';

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
};

export type User = {
  uid: string;
  email: string;
  name: string;
  isSuperAdmin?: boolean;
};

export type Transaction = {
  id: string;
  userId?: string;
  title: string;
  amount: number;
  category: string;
  type: TransactionType;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  receiptUrl?: string;
};

export type DebtType = 'lent' | 'borrowed';
export type DebtStatus = 'pending' | 'settled';

export interface DebtRecord {
  id: string;
  userId?: string;
  personName: string;
  phoneNumber?: string;
  amount: number;
  type: DebtType;
  status: DebtStatus;
  date: string;
  dueDate?: string;
  notes?: string;
}

export interface RecycleBinItem {
  id: string;
  userId: string;
  itemType: 'transaction' | 'debt';
  title: string;
  amount: number;
  details: string;
  date: string;
  deletedAt: string; // ISO string timestamp
  data: Transaction | DebtRecord;
}

export type CategoryBudget = {
  categoryId: string;
  budgetLimit: number;
};

export type FilterOptions = {
  searchQuery: string;
  category: string;
  type: 'all' | 'expense' | 'income';
  paymentMethod: string;
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
};

