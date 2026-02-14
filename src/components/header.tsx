'use client';

import { useAuth } from '@/app/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Users, ShoppingCart, Receipt, Bell, Settings } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { DEFAULT_PROFILE_PICTURE } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { collection, query, where } from 'firebase/firestore';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import type { Notification } from '@/lib/types';

export function Header() {
  const { user } = useAuth();
  const pathname = usePathname();

  // Real-time unread notification count
  const notificationsQuery = user
    ? query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    )
    : null;

  const { docs: unreadNotifications } = useFirestoreQuery<Notification>(notificationsQuery);
  const unreadCount = unreadNotifications?.length || 0;

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Logo size="md" className="mr-2" />
          <a className="font-bold text-lg" href="/">
            IDKPay
          </a>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {user && (
            <>
              <nav className="flex items-center space-x-1 mr-4">
                <Link href="/things-to-buy">
                  <Button
                    variant={isActive('/things-to-buy') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Things to Buy
                  </Button>
                </Link>
                <Link href="/notifications">
                  <Button
                    variant={isActive('/notifications') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center relative"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </nav>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl || DEFAULT_PROFILE_PICTURE} alt={user.name} />
                      <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/profile" className="flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/group" className="flex items-center cursor-pointer">
                      <Users className="mr-2 h-4 w-4" />
                      Group
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

