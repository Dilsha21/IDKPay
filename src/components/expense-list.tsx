'use client';

import { useMemo } from 'react';
import type { Expense, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from './ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface ExpenseListProps {
  expenses: Expense[];
  users: User[];
}

export function ExpenseList({ expenses, users }: ExpenseListProps) {
  const usersMap = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.uid] = user;
      return acc;
    }, {} as Record<string, User>);
  }, [users]);

  if (expenses.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No expenses recorded yet.</p>
        <p className="text-sm text-muted-foreground">Click "Add Expense" to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense) => {
        const payer = usersMap[expense.payerId];
        return (
          <div key={expense.id} className="flex items-center space-x-4 p-3 hover:bg-secondary rounded-lg transition-colors">
            <Avatar className="h-10 w-10">
              <AvatarImage src={payer?.avatarUrl} alt={payer?.name} />
              <AvatarFallback>{payer?.name?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{expense.description}</p>
              <p className="text-sm text-muted-foreground">
                {payer?.name || 'Unknown User'} paid
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">Rs. {expense.amount.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(expense.timestamp.toDate(), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

ExpenseList.Skeleton = function ExpenseListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <div className="space-y-2 text-right">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
            ))}
        </div>
    )
}
