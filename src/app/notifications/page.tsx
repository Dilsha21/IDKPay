'use client';

import { Header } from '@/components/header';
import { useAuth } from '@/app/auth-provider';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { db } from '@/lib/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { markNotificationAsRead, deleteNotification } from '@/lib/notification-actions';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const notificationsQuery = user
    ? query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    )
    : null;

  const { docs: notifications, loading } = useFirestoreQuery<Notification>(notificationsQuery);

  // Sort notifications by timestamp descending (client-side)
  const sortedNotifications = useMemo(() => {
    if (!notifications) return [];
    return [...notifications].sort((a, b) => {
      const aTime = a.timestamp?.toMillis?.() || 0;
      const bTime = b.timestamp?.toMillis?.() || 0;
      return bTime - aTime;
    });
  }, [notifications]);

  const unreadCount = sortedNotifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    setIsMarkingAll(true);
    const unreadNotifications = sortedNotifications.filter(n => !n.read);
    for (const notification of unreadNotifications) {
      await markNotificationAsRead(notification.id);
    }
    setIsMarkingAll(false);
  };

  const handleDeleteNotification = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view notifications</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center mb-6">

          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {unreadCount} unread
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll || unreadCount === 0}
              variant="outline"
              size="sm"
            >
              Mark All as Read
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : sortedNotifications.length > 0 ? (
              <div className="space-y-3">
                {sortedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border rounded-lg p-4 space-y-2 transition-colors ${!notification.read
                      ? 'bg-primary/5 border-primary/20'
                      : 'hover:bg-secondary/50'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                          <Badge
                            variant="secondary"
                            className={getNotificationTypeColor(notification.type)}
                          >
                            {getNotificationTypeLabel(notification.type)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {notification.timestamp?.toDate
                              ? format(notification.timestamp.toDate(), 'MMM dd, yyyy HH:mm')
                              : ''}
                          </span>
                        </div>
                        <h3 className="font-semibold">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        {!notification.read && (
                          <Button
                            onClick={() => handleMarkAsRead(notification.id)}
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                          >
                            Mark Read
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDeleteNotification(notification.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No notifications found.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Notifications will appear here once available.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function getNotificationTypeColor(type: string) {
  switch (type) {
    case 'expense-added':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'debt-paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'debt-partially-paid':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'thing-added':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    case 'thing-bought':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300';
    case 'thing-partially-bought':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    case 'weekly-summary':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
}

function getNotificationTypeLabel(type: string) {
  switch (type) {
    case 'expense-added':
      return 'Expense';
    case 'debt-paid':
      return 'Paid';
    case 'debt-partially-paid':
      return 'Partial Payment';
    case 'thing-added':
      return 'New Item';
    case 'thing-bought':
      return 'Bought';
    case 'thing-partially-bought':
      return 'Partially Bought';
    case 'weekly-summary':
      return 'Weekly Summary';
    default:
      return type;
  }
}
