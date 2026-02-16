import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  name: string;
  avatarUrl: string;
  groupId?: string;
  role?: 'admin' | 'member';
  contactInfo?: string;
  address?: string;
  collegeName?: string;
  department?: string;
  collegeYear?: string;
  emailVerified?: boolean;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  payerId: string;
  sharedWith: string[];
  perPersonShare: number;
  timestamp: Timestamp;
  settledWith?: string[];
}

export interface Balance {
  id: string; // sorted_uid1_uid2
  users: [string, string];
  // amount > 0 means users[1] owes users[0]
  // amount < 0 means users[0] owes users[1]
  amount: number;
  updatedAt: Timestamp;
}

export interface ThingToBuy {
  id: string;
  name: string;
  amountNeeded: number;
  description?: string;
  addedBy: string;
  addedByName?: string;
  groupId: string;
  sharedWith: string[];
  status: 'pending' | 'partially-bought' | 'bought';
  timestamp: Timestamp;
  boughtBy?: string;
  boughtAt?: Timestamp;
  partiallyBoughtAmount?: number;
  boughtByUsers?: Array<{
    userId: string;
    amountBought: number;
    boughtAt: Timestamp;
  }>;
  lastUpdated?: Timestamp;
}

export interface Notification {
  id: string;
  userId: string;
  type:
  | 'expense-added'
  | 'debt-paid'
  | 'debt-partially-paid'
  | 'thing-added'
  | 'thing-bought'
  | 'thing-partially-bought'
  | 'weekly-summary';
  title: string;
  message: string;
  read: boolean;
  timestamp: Timestamp;
  relatedThingId?: string;
  relatedExpenseId?: string;
  addedBy?: string;
  metadata?: Record<string, any>;
}
