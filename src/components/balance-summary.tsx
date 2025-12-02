'use client';

import { useMemo, useState } from 'react';
import type { Balance, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, ArrowLeft, Users } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { SettleDebtsDialog } from './settle-debts-dialog';

interface BalanceSummaryProps {
  balances: Balance[];
  users: User[];
  currentUser: User;
}

export function BalanceSummary({ balances, users, currentUser }: BalanceSummaryProps) {
  const usersMap = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.uid] = user;
      return acc;
    }, {} as Record<string, User>);
  }, [users]);

  const { youOwe, othersOweYou, totalOwedToYou, totalYouOwe } = useMemo(() => {
    const youOwe: { user: User; amount: number }[] = [];
    const othersOweYou: { user: User; amount: number }[] = [];
    let totalOwedToYou = 0;
    let totalYouOwe = 0;

    balances.forEach((balance) => {
      if (balance.amount === 0) return;

      const otherUserId = balance.users.find((id) => id !== currentUser.uid);
      if (!otherUserId) return;

      const otherUser = usersMap[otherUserId];
      if (!otherUser) return;
      
      const userIsUser1 = balance.users[0] === currentUser.uid;

      if ((userIsUser1 && balance.amount < 0) || (!userIsUser1 && balance.amount > 0)) {
        // You owe other user
        const amount = userIsUser1 ? -balance.amount : balance.amount;
        youOwe.push({ user: otherUser, amount });
        totalYouOwe += amount;
      } else {
        // Other user owes you
        const amount = userIsUser1 ? balance.amount : -balance.amount;
        othersOweYou.push({ user: otherUser, amount });
        totalOwedToYou += amount;
      }
    });

    return { youOwe, othersOweYou, totalOwedToYou, totalYouOwe };
  }, [balances, currentUser, usersMap]);
  
  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-destructive flex items-center">
                <ArrowRight className="mr-2 h-4 w-4"/> You Owe
            </h3>
            <div className="font-bold text-destructive">
                Rs. {totalYouOwe.toFixed(2)}
            </div>
        </div>
        <div className="space-y-2">
          {youOwe.length > 0 ? (
            youOwe.map(({ user, amount }) => (
              <div key={user.uid} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.name}</span>
                </div>
                <span className="font-semibold text-sm">Rs. {amount.toFixed(2)}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground p-2">You don't owe anyone. Great job!</p>
          )}
        </div>
      </div>
      
      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-green-600 flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4"/> Others Owe You
            </h3>
            <div className="font-bold text-green-600">
                Rs. {totalOwedToYou.toFixed(2)}
            </div>
        </div>
        <div className="space-y-2">
          {othersOweYou.length > 0 ? (
            othersOweYou.map(({ user, amount }) => (
              <div key={user.uid} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.name}</span>
                </div>
                <span className="font-semibold text-sm">Rs. {amount.toFixed(2)}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground p-2">No one owes you anything right now.</p>
          )}
        </div>
      </div>

      {(youOwe.length > 0 || othersOweYou.length > 0) &&
          <div className="border-t pt-6">
              <SettleDebtsDialog balances={balances} users={users} currentUser={currentUser} />
          </div>
      }

    </div>
  );
}

BalanceSummary.Skeleton = function BalanceSummarySkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    )
}
