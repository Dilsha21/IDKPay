'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import { addExpense } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
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
import { Checkbox } from './ui/checkbox';

interface AddExpenseFormProps {
  users: User[];
  currentUser: User;
  setDialogOpen: (open: boolean) => void;
}

const formSchema = z.object({
  description: z.string().min(1, { message: 'Description is required.' }),
  amount: z.coerce.number().gt(0, { message: 'Amount must be greater than 0.' }),
  sharedWith: z.array(z.string()).refine((value) => value.some((id) => id), {
    message: 'You must select at least one roommate to share with.',
  }),
});

export function AddExpenseForm({ users, currentUser, setDialogOpen }: AddExpenseFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter users to only show those in the same group
  const groupUsers = users.filter(user => 
    user.groupId === currentUser.groupId && user.uid !== currentUser.uid
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: 0,
      sharedWith: [currentUser.uid],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const result = await addExpense({
      ...values,
      payerId: currentUser.uid,
    });

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Expense Added!',
        description: `"${values.description}" has been logged.`,
      });
      setDialogOpen(false);
      form.reset();
    }
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Groceries, Rent" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (Rs.)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sharedWith"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Shared with</FormLabel>
                <FormDescription>
                  Select who this expense is shared with.
                </FormDescription>
              </div>
              <div className="space-y-2">
                {/* Always show current user */}
                <FormField
                  key={currentUser.uid}
                  control={form.control}
                  name="sharedWith"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={currentUser.uid}
                        className="flex flex-row items-center space-x-3 space-y-0 p-2 rounded-md bg-primary/10 border border-primary/20"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(currentUser.uid)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, currentUser.uid])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== currentUser.uid
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal w-full cursor-pointer">
                          {currentUser.name} (You)
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
                
                {/* Show group members */}
                {groupUsers.map((user) => (
                  <FormField
                    key={user.uid}
                    control={form.control}
                    name="sharedWith"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={user.uid}
                          className="flex flex-row items-center space-x-3 space-y-0 p-2 rounded-md hover:bg-secondary"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(user.uid)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, user.uid])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== user.uid
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal w-full cursor-pointer">
                            {user.name}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
                
                {groupUsers.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No other members in your group</p>
                    <p className="text-sm">Add members to your group to share expenses</p>
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Expense'}
        </Button>
      </form>
    </Form>
  );
}
