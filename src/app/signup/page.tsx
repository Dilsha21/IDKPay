'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { signUp, checkEmailInvitation } from '../actions';
import { Users, UserPlus } from 'lucide-react';
import { Logo } from '@/components/logo';

const createGroupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  groupName: z.string().min(2),
  memberEmails: z.string(),
  mode: z.literal('create'),
  contactInfo: z.string().min(5),
  address: z.string().min(5),
  collegeName: z.string().min(2),
  department: z.string().min(2),
  collegeYear: z.string().min(1),
});


const joinGroupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  contactInfo: z.string().min(5),
  address: z.string().min(5),
  collegeName: z.string().min(2),
  department: z.string().min(2),
  collegeYear: z.string().min(1),
});


export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupMode, setSignupMode] = useState<'create' | 'join'>('create');
  const [emailChecked, setEmailChecked] = useState(false);
  const [groupInfo, setGroupInfo] = useState<any>(null);

  const createGroupForm = useForm<z.infer<typeof createGroupSchema>>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      groupName: '',
      memberEmails: '',
      mode: 'create',
      contactInfo: '',
      address: '',
      collegeName: '',
      department: '',
      collegeYear: '',
    },
  });

  const joinGroupForm = useForm<z.infer<typeof joinGroupSchema>>({
    resolver: zodResolver(joinGroupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      contactInfo: '',
      address: '',
      collegeName: '',
      department: '',
      collegeYear: '',
    },
  });

  // Check email when user types in join mode
  const handleEmailChange = async (email: string) => {
    if (signupMode === 'join' && email.includes('@')) {
      try {
        const result = await checkEmailInvitation(email);
        if (result.groupInfo) {
          setGroupInfo(result.groupInfo);
          setEmailChecked(true);
        } else {
          setGroupInfo(null);
          setEmailChecked(false); // Reset when no group found
        }
      } catch (error) {
        setGroupInfo(null);
        setEmailChecked(false);
      }
    } else {
      // Reset when email is invalid or empty
      setGroupInfo(null);
      setEmailChecked(false);
    }
  };

  async function onCreateGroupSubmit(values: z.infer<typeof createGroupSchema>) {
    setIsSubmitting(true);
    try {
      console.log('Create group form values:', values);
      
      const result = await signUp({
        ...values,
        mode: 'create'
      });
      
      if (result.success) {
        toast({
          title: 'Group Created!',
          description: 'Your group has been created. Redirecting...',
        });
        window.location.href = '/';
      } else {
        throw new Error(result.error || 'Failed to create group');
      }
    } catch (error: any) {
      console.error('Create group error:', error);
      toast({
        title: 'Group Creation Failed',
        description: error.message || 'An error occurred during signup',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onJoinGroupSubmit(values: z.infer<typeof joinGroupSchema>) {
    setIsSubmitting(true);
    try {
      console.log('Join group submit values:', values);
      console.log('Group info:', groupInfo);
      
      const result = await signUp({
        ...values,
        groupId: groupInfo?.id,
        mode: 'join'
      });
      
      console.log('Join group result:', result);
      
      if (result.success) {
        toast({
          title: 'Welcome to the Group!',
          description: 'You have successfully joined the group. Redirecting...',
        });
        window.location.href = '/';
      } else {
        throw new Error(result.error || 'Failed to join group');
      }
    } catch (error: any) {
      console.error('Join group error:', error);
      toast({
        title: 'Join Group Failed',
        description: error.message || 'An error occurred during signup',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl font-bold">Join IDKPay</CardTitle>
          <CardDescription>
            {signupMode === 'create' 
              ? 'Create a group and invite your roommates' 
              : 'Join your existing roommate group'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mode Toggle */}
          <div className="flex mb-6 bg-muted rounded-lg p-1">
            <button
              onClick={() => setSignupMode('create')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                signupMode === 'create' 
                  ? 'bg-background shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Create Group
            </button>
            <button
              onClick={() => setSignupMode('join')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                signupMode === 'join' 
                  ? 'bg-background shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Join Group
            </button>
          </div>

          {/* Create Group Form */}
          {signupMode === 'create' && (
            <Form {...createGroupForm}>
              <form onSubmit={createGroupForm.handleSubmit(onCreateGroupSubmit)} className="space-y-4">
                <FormField
                  control={createGroupForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="create-name">Your Name</FormLabel>
                      <FormControl>
                        <Input id="create-name" placeholder="John Doe" {...field} autoComplete="name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createGroupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="create-email">Email</FormLabel>
                      <FormControl>
                        <Input id="create-email" placeholder="name@example.com" {...field} autoComplete="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createGroupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="create-password">Password</FormLabel>
                      <FormControl>
                        <Input id="create-password" type="password" placeholder="••••••••" {...field} autoComplete="new-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createGroupForm.control}
                  name="groupName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="create-groupName">Group Name</FormLabel>
                      <FormControl>
                        <Input id="create-groupName" placeholder="IDKPay Apartment" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createGroupForm.control}
                  name="memberEmails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="create-memberEmails">Roommate Emails</FormLabel>
                      <FormControl>
                        <Textarea 
                          id="create-memberEmails"
                          placeholder="roommate1@example.com, roommate2@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter comma-separated emails of your roommates
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createGroupForm.control}
                  name="contactInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="create-contactInfo">Contact Information</FormLabel>
                      <FormControl>
                        <Input id="create-contactInfo" placeholder="Phone number: +1234567890" {...field} autoComplete="tel" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createGroupForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="create-address">Address</FormLabel>
                      <FormControl>
                        <Input id="create-address" placeholder="123 Main St, Apt 4B" {...field} autoComplete="street-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createGroupForm.control}
                  name="collegeYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="create-collegeYear">College Year</FormLabel>
                      <FormControl>
                        <Input id="create-collegeYear" placeholder="e.g., 2nd Year, 3rd Year" {...field} autoComplete="organization-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createGroupForm.control}
                  name="collegeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="create-collegeName">College Name</FormLabel>
                      <FormControl>
                        <Input id="create-collegeName" placeholder="e.g., MIT, Stanford University" {...field} autoComplete="organization" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createGroupForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="create-department">Department</FormLabel>
                      <FormControl>
                        <Input id="create-department" placeholder="e.g., Computer Science, Engineering" {...field} autoComplete="organization" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating Group...' : 'Create Group'}
                </Button>
              </form>
            </Form>
          )}

          {/* Join Group Form */}
          {signupMode === 'join' && (
            <Form {...joinGroupForm}>
              <form onSubmit={joinGroupForm.handleSubmit(onJoinGroupSubmit)} className="space-y-4">
                <FormField
                  control={joinGroupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="join-email">Email</FormLabel>
                      <FormControl>
                        <Input 
                          id="join-email"
                          placeholder="name@example.com" 
                          {...field}
                          autoComplete="email"
                          onChange={(e) => {
                            field.onChange(e);
                            handleEmailChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {emailChecked && groupInfo && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      "You're invited to join "{groupInfo.name}"
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Created by {groupInfo.creatorName}
                    </p>
                  </div>
                )}

                {emailChecked && !groupInfo && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      No group invitation found for this email
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Please check your email or contact your group admin
                    </p>
                  </div>
                )}

                <FormField
                  control={joinGroupForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="join-name">Your Name</FormLabel>
                      <FormControl>
                        <Input id="join-name" placeholder="John Doe" {...field} autoComplete="name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={joinGroupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="join-password">Password</FormLabel>
                      <FormControl>
                        <Input id="join-password" type="password" placeholder="••••••••" {...field} autoComplete="new-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={joinGroupForm.control}
                  name="contactInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="join-contactInfo">Contact Information</FormLabel>
                      <FormControl>
                        <Input id="join-contactInfo" placeholder="Phone number: +1234567890" {...field} autoComplete="tel" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={joinGroupForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="join-address">Address</FormLabel>
                      <FormControl>
                        <Input id="join-address" placeholder="123 Main St, Apt 4B" {...field} autoComplete="street-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={joinGroupForm.control}
                  name="collegeYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="join-collegeYear">College Year</FormLabel>
                      <FormControl>
                        <Input id="join-collegeYear" placeholder="e.g., 2nd Year, 3rd Year" {...field} autoComplete="organization-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={joinGroupForm.control}
                  name="collegeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="join-collegeName">College Name</FormLabel>
                      <FormControl>
                        <Input id="join-collegeName" placeholder="e.g., MIT, Stanford University" {...field} autoComplete="organization" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={joinGroupForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="join-department">Department</FormLabel>
                      <FormControl>
                        <Input id="join-department" placeholder="e.g., Computer Science, Engineering" {...field} autoComplete="organization" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || (emailChecked && !groupInfo)}
                >
                  {isSubmitting ? 'Joining...' : 'Join Group'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
