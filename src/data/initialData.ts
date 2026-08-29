import type { Category, Transaction } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'housing', name: 'Housing & Rent', icon: '🏠', color: '#6366f1', type: 'expense' },
  { id: 'food', name: 'Food & Dining', icon: '🍕', color: '#f43f5e', type: 'expense' },
  { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#ec4899', type: 'expense' },
  { id: 'transport', name: 'Transportation', icon: '🚗', color: '#3b82f6', type: 'expense' },
  { id: 'utilities', name: 'Utilities & Bills', icon: '⚡', color: '#f59e0b', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', icon: '🍿', color: '#8b5cf6', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#d946ef', type: 'expense' },
  { id: 'health', name: 'Health & Medical', icon: '💚', color: '#10b981', type: 'expense' },
  { id: 'subscript', name: 'Subscriptions', icon: '📱', color: '#06b6d4', type: 'expense' },
  { id: 'salary', name: 'Salary', icon: '💰', color: '#22c55e', type: 'income' },
  { id: 'freelance', name: 'Freelance & Side Income', icon: '💻', color: '#14b8a6', type: 'income' },
  { id: 'investment', name: 'Investments Return', icon: '📈', color: '#0284c7', type: 'income' },
  { id: 'misc', name: 'Miscellaneous', icon: '📦', color: '#64748b', type: 'expense' },
];

// Clean empty transactions array for real personal use
export const SAMPLE_TRANSACTIONS: Transaction[] = [];
