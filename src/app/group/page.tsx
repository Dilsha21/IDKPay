'use client';

import { Header } from '@/components/header';
import { GroupDetails } from '@/components/group-details';
import { GroupMembers } from '@/components/group-members';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { doc, getDoc, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/auth-provider';
import { useMemo, useState } from 'react';
import type { User } from '@/lib/types';

export default function GroupPage() {
  const { user } = useAuth();
  const [groupData, setGroupData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch group details
  const fetchGroupDetails = async () => {
    if (!user?.groupId) return;
    
    try {
      const groupDoc = await getDoc(doc(db, 'groups', user.groupId));
      if (groupDoc.exists()) {
        setGroupData({
          id: groupDoc.id,
          ...groupDoc.data()
        });
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch group members
  const usersQuery = useMemo(() => {
    if (!user?.groupId) return null;
    return query(collection(db, 'users'), where('groupId', '==', user.groupId));
  }, [user?.groupId]);

  const { docs: members, loading: membersLoading } = useFirestoreQuery<User>(usersQuery || null);

  // Fetch group data on component mount
  useMemo(() => {
    fetchGroupDetails();
  }, [user?.groupId]);

  if (!user?.groupId) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto p-4 md:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">No Group Found</h1>
            <p className="text-muted-foreground">You are not a member of any group.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="space-y-8">
          {/* Group Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Group Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your group and members
            </p>
          </div>

          {/* Group Details and Members */}
          <div className="grid gap-8 lg:grid-cols-2">
            <GroupDetails 
              groupData={groupData} 
              loading={loading}
              userRole={user.role}
              members={members}
              currentUserId={user.uid}
            />
            <GroupMembers 
              members={members} 
              loading={membersLoading}
              currentUserId={user.uid}
              userRole={user.role}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
