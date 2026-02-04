'use client';

import { Header } from '@/components/header';
import { ProfileClient } from '@/components/profile-client';
import { DebtAnalytics } from '@/components/debt-analytics';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { query, collection, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/auth-provider';
import { useMemo } from 'react';
import type { Expense, User } from '@/lib/types';

export default function ProfilePage() {
  const { user } = useAuth();

  // Fetch expenses for debt analytics
  const expensesQuery = useMemo(
    () =>
      user
        ? query(collection(db, 'expenses'), where('sharedWith', 'array-contains', user.uid), orderBy('timestamp', 'desc'))
        : null,
    [user]
  );

  const usersQuery = useMemo(() => query(collection(db, 'users')), []);

  const { docs: expenses, loading: expensesLoading } = useFirestoreQuery<Expense>(expensesQuery);
  const { docs: users, loading: usersLoading } = useFirestoreQuery<User>(usersQuery);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold">Profile Settings</h2>
            </div>
            <ProfileClient />
          </div>
          <div>
            {expensesLoading || usersLoading ? (
              <DebtAnalytics.Skeleton />
            ) : (
              <DebtAnalytics 
                expenses={expenses} 
                users={users} 
                currentUserId={user?.uid || ''}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
