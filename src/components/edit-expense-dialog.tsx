'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { updateExpense } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { Expense, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface EditExpenseDialogProps {
  expense: Expense | null;
  users: User[];
  currentUser: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  description: z.string().min(1, { message: 'Description is required.' }),
  amount: z.coerce.number().gt(0, { message: 'Amount must be greater than 0.' }),
  sharedWith: z.array(z.string()).refine((value) => value.some((id) => id), {
    message: 'You must select at least one roommate to share with.',
  }),
});

export function EditExpenseDialog({
  expense,
  users,
  currentUser,
  open,
  onOpenChange
}: EditExpenseDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: 0,
      sharedWith: [currentUser.uid],
    },
  });

  // Update form when expense changes
  useEffect(() => {
    if (expense) {
      form.reset({
        description: expense.description,
        amount: expense.amount,
        sharedWith: expense.sharedWith,
      });
    }
  }, [expense, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!expense) return;

    setIsSubmitting(true);

    try {
      const result = await updateExpense({
        expenseId: expense.id,
        ...values,
      });

      if (result.error) {
        toast({
          title: 'Update Failed',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Expense Updated!',
          description: `"${values.description}" has been updated.`,
        });
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>
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
                    <Input type="number" step="100" placeholder="0.00" {...field} />
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

                    {/* Show other group members */}
                    {users
                      .filter(user => user.groupId === currentUser.groupId && user.uid !== currentUser.uid)
                      .map((user) => (
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
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Expense'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
