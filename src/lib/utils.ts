import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Category = 'Food' | 'Transport' | 'Housing' | 'Utilities' | 'Entertainment' | 'Health' | 'Shopping' | 'Other';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: Category;
  date: string;
}

export interface Income {
  id: string;
  source: string;
  amount: number;
  date: string;
}

export interface Budget {
  category: Category;
  limit: number;
}

export const CATEGORIES: Category[] = [
  'Food',
  'Transport',
  'Housing',
  'Utilities',
  'Entertainment',
  'Health',
  'Shopping',
  'Other',
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#F87171',
  Transport: '#60A5FA',
  Housing: '#34D399',
  Utilities: '#FBBF24',
  Entertainment: '#A78BFA',
  Health: '#F472B6',
  Shopping: '#FB923C',
  Other: '#94A3B8',
};
