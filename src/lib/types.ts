import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  name: string;
  avatarUrl: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  payerId: string;
  sharedWith: string[];
  perPersonShare: number;
  timestamp: Timestamp;
}

export interface Balance {
  id: string; // sorted_uid1_uid2
  users: [string, string];
  // amount > 0 means users[1] owes users[0]
  // amount < 0 means users[0] owes users[1]
  amount: number;
  updatedAt: Timestamp;
}
