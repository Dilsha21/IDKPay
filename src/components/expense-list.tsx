'use client';

import { useMemo } from 'react';
import type { Expense, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from './ui/skeleton';
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DEFAULT_PROFILE_PICTURE } from '@/lib/placeholder-images';

interface ExpenseListProps {
  expenses: Expense[];
  users: User[];
  currentUserId: string;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expenseId: string) => void;
}

export function ExpenseList({ expenses, users, currentUserId, onEditExpense, onDeleteExpense }: ExpenseListProps) {
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
        const sharedWithUsers = expense.sharedWith
          .map(userId => usersMap[userId])
          .filter(Boolean);
        
        return (
          <div key={expense.id} className="p-4 hover:bg-secondary rounded-lg transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={payer?.avatarUrl || DEFAULT_PROFILE_PICTURE} alt={payer?.name} />
                  <AvatarFallback>{payer?.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{expense.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {payer?.name || 'Unknown User'} paid
                    {expense.payerId === currentUserId && !expense.sharedWith.includes(currentUserId) && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                        You bore this expense
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="font-bold text-lg">Rs. {expense.amount.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(expense.timestamp.toDate(), { addSuffix: true })}
                  </p>
                </div>
                {expense.payerId === currentUserId && (onEditExpense || onDeleteExpense) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEditExpense && (
                        <DropdownMenuItem onClick={() => onEditExpense(expense)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onDeleteExpense && (
                        <DropdownMenuItem 
                          onClick={() => onDeleteExpense(expense.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Shared with:</span>
                <div className="flex -space-x-2">
                  {sharedWithUsers.slice(0, 4).map((user) => (
                    <Avatar key={user.uid} className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={user.avatarUrl || DEFAULT_PROFILE_PICTURE} alt={user.name} />
                      <AvatarFallback className="text-xs">
                        {user.name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {sharedWithUsers.length > 4 && (
                    <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                      +{sharedWithUsers.length - 4}
                    </div>
                  )}
                </div>
                <span className="text-muted-foreground">
                  {sharedWithUsers.map(u => u.name).join(', ')}
                </span>
              </div>
              <div className="text-muted-foreground">
                {format(expense.timestamp.toDate(), 'MMM d, yyyy • h:mm a')}
              </div>
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
                <div key={i} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <div className="space-y-2 text-right">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Skeleton className="h-4 w-16" />
                            <div className="flex -space-x-2">
                                {[...Array(3)].map((_, j) => (
                                    <Skeleton key={j} className="h-6 w-6 rounded-full border-2 border-background" />
                                ))}
                            </div>
                            <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
            ))}
        </div>
    )
}
