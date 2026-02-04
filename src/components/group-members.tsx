'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Mail } from 'lucide-react';
import type { User } from '@/lib/types';
import { DEFAULT_PROFILE_PICTURE } from '@/lib/placeholder-images';

interface GroupMembersProps {
  members: User[];
  loading: boolean;
  currentUserId: string;
  userRole?: 'admin' | 'member';
}

export function GroupMembers({ members, loading, currentUserId, userRole }: GroupMembersProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-1/3 mb-1"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Group Members ({members?.length || 0})
        </CardTitle>
        <CardDescription>
          All members in your group
        </CardDescription>
      </CardHeader>
      <CardContent>
        {members?.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No members found in this group.</p>
            {userRole === 'admin' && (
              <p className="text-sm text-muted-foreground mt-2">
                Use the "Add Member" button to invite new members.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {members?.map((member) => (
              <div
                key={member.uid}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  member.uid === currentUserId ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={member.avatarUrl || DEFAULT_PROFILE_PICTURE} 
                    alt={member.name} 
                  />
                  <AvatarFallback>
                    {member.name?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">
                      {member.name}
                    </p>
                    {member.uid === currentUserId && (
                      <Badge variant="outline" className="text-xs">
                        You
                      </Badge>
                    )}
                    <Badge 
                      variant={member.role === 'admin' ? 'default' : 'secondary'} 
                      className="text-xs"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {member.role || 'member'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.contactInfo && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                      <span className="truncate">{member.contactInfo}</span>
                    </div>
                  )}
                  {member.address && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                      <span className="truncate">{member.address}</span>
                    </div>
                  )}
                  {(member.collegeYear || member.department) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {member.collegeYear && (
                        <span className="truncate">{member.collegeYear}</span>
                      )}
                      {member.department && (
                        <span className="truncate"> {member.department}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Member Summary */}
        {members?.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Total Members
              </span>
              <span className="font-medium">
                {members.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">
                Admins
              </span>
              <span className="font-medium">
                {members.filter(m => m.role === 'admin').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">
                Regular Members
              </span>
              <span className="font-medium">
                {members.filter(m => m.role !== 'admin').length}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
