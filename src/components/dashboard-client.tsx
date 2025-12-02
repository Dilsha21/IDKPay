'use client';

import { useMemo } from 'react';
import { useAuth } from '@/app/auth-provider';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { User, Expense, Balance } from '@/lib/types';
import { BalanceSummary } from './balance-summary';
import { ExpenseList } from './expense-list';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { AddExpenseForm } from './add-expense-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';

export function DashboardClient() {
  const { user } = useAuth();
  const [isAddExpenseOpen, setAddExpenseOpen] = useState(false);

  // Memoize queries to prevent re-renders
  const usersQuery = useMemo(() => query(collection(db, 'users')), []);
  const expensesQuery = useMemo(
    () =>
      user
        ? query(collection(db, 'expenses'), where('sharedWith', 'array-contains', user.uid), orderBy('timestamp', 'desc'))
        : null,
    [user]
  );
  const balancesQuery = useMemo(
    () =>
      user ? query(collection(db, 'balances'), where('users', 'array-contains', user.uid)) : null,
    [user]
  );
  
  const { docs: users, loading: usersLoading } = useFirestoreQuery<User>(usersQuery);
  const { docs: expenses, loading: expensesLoading } = useFirestoreQuery<Expense>(expensesQuery);
  const { docs: balances, loading: balancesLoading } = useFirestoreQuery<Balance>(balancesQuery);

  const loading = usersLoading || expensesLoading || balancesLoading;

  if (!user) return null;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 space-y-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-bold">Balances</CardTitle>
                     <Dialog open={isAddExpenseOpen} onOpenChange={setAddExpenseOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add a New Expense</DialogTitle>
                            </DialogHeader>
                            <AddExpenseForm users={users} currentUser={user} setDialogOpen={setAddExpenseOpen} />
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <BalanceSummary.Skeleton />
                    ) : (
                        <BalanceSummary balances={balances} users={users} currentUser={user} />
                    )}
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2">
           <Card>
                <CardHeader>
                    <CardTitle className="text-xl font-bold">Recent Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <ExpenseList.Skeleton />
                    ) : (
                        <ExpenseList expenses={expenses} users={users} />
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
