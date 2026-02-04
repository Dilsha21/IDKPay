'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AddMemberDialog } from '@/components/add-member-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Calendar, Mail, Shield, Phone, MapPin, GraduationCap, Building, X, UserX } from 'lucide-react';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState } from 'react';

interface GroupDetailsProps {
  groupData: any;
  loading: boolean;
  userRole?: 'admin' | 'member';
  members?: User[];
  currentUserId?: string;
}

export function GroupDetails({ groupData, loading, userRole, members = [], currentUserId }: GroupDetailsProps) {
  const { toast } = useToast();
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<User | null>(null);

  const handleRemoveInvitedEmail = async (email: string) => {
    try {
      console.log('Removing invited email:', email);
      console.log('Group data:', groupData);
      console.log('Group ID:', groupData.id);
      
      if (!groupData.id) {
        throw new Error('Group ID not found');
      }
      
      await updateDoc(doc(db, 'groups', groupData.id), {
        memberEmails: arrayRemove(email)
      });
      
      console.log('Email removed successfully');
      toast({
        title: 'Email Removed',
        description: `${email} has been removed from invited emails.`,
      });
    } catch (error: any) {
      console.error('Error removing invited email:', error);
      toast({
        title: 'Error',
        description: `Failed to remove invited email: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = (member: User) => {
    setConfirmRemoveMember(member);
  };

  const confirmRemoveMemberAction = async () => {
    if (!confirmRemoveMember) return;
    
    const member = confirmRemoveMember;
    try {
      console.log('Removing member:', member);
      console.log('Group data:', groupData);
      console.log('Group ID:', groupData.id);
      
      if (!groupData.id) {
        throw new Error('Group ID not found');
      }
      
      // Remove member from group's memberIds array
      await updateDoc(doc(db, 'groups', groupData.id), {
        memberIds: arrayRemove(member.uid)
      });
      console.log('Member removed from group memberIds');

      // Remove user's balances in this group
      const userBalances = members
        .filter(m => m.uid !== member.uid)
        .map(m => [member.uid, m.uid].sort().join('_'));
      
      console.log('Removing balances:', userBalances);
      for (const balanceId of userBalances) {
        await deleteDoc(doc(db, 'balances', balanceId));
      }
      console.log('Balances removed');

      // Delete user from authentication (this will also delete their user document)
      // Note: This requires admin SDK or a cloud function. For now, we'll delete the user document
      // and set their auth token to invalid by removing their user document
      
      await deleteDoc(doc(db, 'users', member.uid));
      console.log('User document deleted from database');
      
      toast({
        title: 'Member Removed',
        description: `${member.name} has been removed from the group and is no longer registered.`,
      });
      
      setConfirmRemoveMember(null);
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: `Failed to remove member: ${error.message}`,
        variant: 'destructive',
      });
    }
  };
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
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-full mb-2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!groupData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Group Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Group information not available.</p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {groupData.name}
            </CardTitle>
            <CardDescription>
              Group information and management
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={userRole === 'admin' ? 'default' : 'secondary'}>
              <Shield className="h-3 w-3 mr-1" />
              {userRole === 'admin' ? 'Admin' : 'Member'}
            </Badge>
            {userRole === 'admin' && <AddMemberDialog />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Member Emails */}
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Invited Emails ({groupData.memberEmails?.filter((email: string) => 
              !members?.some((m: User) => m.email === email)
            )?.length || 0})
          </h3>
          <div className="space-y-1">
            {groupData.memberEmails?.filter((email: string, index: number, self: string[]) => 
              self.indexOf(email) === index && // Remove duplicates
              !members?.some((m: User) => m.email === email) // Exclude emails of members who have joined
            ).map((email: string, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{email}</span>
                </div>
                {userRole === 'admin' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveInvitedEmail(email)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )) || (
              <p className="text-muted-foreground text-sm">No invited emails found.</p>
            )}
          </div>
        </div>

        {/* Active Members Table */}
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Active Members ({members?.length || 0})
          </h3>
          {members?.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium min-w-[100px]">Name</th>
                      <th className="text-left p-3 text-sm font-medium min-w-[150px]">Email</th>
                      <th className="text-left p-3 text-sm font-medium min-w-[120px]">Contact Info</th>
                      <th className="text-left p-3 text-sm font-medium min-w-[150px]">Address</th>
                      <th className="text-left p-3 text-sm font-medium min-w-[120px]">College</th>
                      <th className="text-left p-3 text-sm font-medium min-w-[120px]">Department</th>
                      <th className="text-left p-3 text-sm font-medium min-w-[100px]">Academic Year</th>
                      {userRole === 'admin' && (
                        <th className="text-left p-3 text-sm font-medium min-w-[80px]">Actions</th>
                      )}
                    </tr>
                  </thead>
                <tbody>
                  {members.map((member) => (
                    <tr 
                      key={member.uid} 
                      className={`border-b hover:bg-muted/30 ${
                        member.uid === currentUserId ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.name}</span>
                          {member.uid === currentUserId && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {member.contactInfo ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{member.contactInfo}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {member.address ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[150px]">{member.address}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {member.collegeName ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{member.collegeName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {member.department ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{member.department}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {member.collegeYear ? (
                          <div className="flex items-center gap-1 text-sm">
                            <GraduationCap className="h-3 w-3 text-muted-foreground" />
                            <span>{member.collegeYear}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      {userRole === 'admin' && (
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveMember(member)}
                            disabled={member.uid === currentUserId}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive disabled:opacity-50"
                            title={member.uid === currentUserId ? "You cannot remove yourself" : "Remove member"}
                          >
                            <UserX className="h-3 w-3" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border rounded-lg bg-muted/20">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active members found.</p>
              {userRole === 'admin' && (
                <p className="text-sm text-muted-foreground mt-2">
                  Use the "Add Member" button to invite new members.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Created Date */}
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Created
          </h3>
          <p className="text-sm text-muted-foreground">
            {formatDate(groupData.createdAt)}
          </p>
        </div>

        {/* Admin Actions */}
        {userRole === 'admin' && (
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Admin Actions</h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                As an admin, you can:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Add new members to the group</li>
                <li>View all member information</li>
                <li>Manage group settings</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Remove Member Confirmation Dialog */}
      <Dialog open={!!confirmRemoveMember} onOpenChange={(open) => !open && setConfirmRemoveMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member Permanently</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently remove {confirmRemoveMember?.name} from the system?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will permanently:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Remove {confirmRemoveMember?.name} from the group</li>
              <li>Delete all their balance records in this group</li>
              <li>Delete their user profile and account data</li>
              <li>Remove their access to the application</li>
              <li>They will need to sign up again to access the system</li>
            </ul>
            <p className="text-sm font-medium text-destructive mt-3">
              ⚠️ This action is permanent and cannot be undone.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Note: Their Firebase authentication account will remain but they won't be able to access the app without a user profile.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmRemoveMember(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveMemberAction}
            >
              Permanently Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
