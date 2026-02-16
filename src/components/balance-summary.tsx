'use client';

import { useMemo, useState } from 'react';
import type { Balance, User, Expense } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, ArrowLeft, Check, MoreHorizontal } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { markAsPaid, recordPartialPayment } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface BalanceSummaryProps {
  balances: Balance[];
  users: User[];
  currentUser: User;
  expenses: Expense[];
}

export function BalanceSummary({ balances, users, currentUser, expenses }: BalanceSummaryProps) {
  const { toast } = useToast();
  const [processingPayments, setProcessingPayments] = useState<Set<string>>(new Set());
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'full' | 'partial';
    fromUser: User;
    toUser: User;
    amount: number;
    partialAmount?: number;
    expenseIds: string[];
  } | null>(null);
  const [partialAmount, setPartialAmount] = useState('');
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);

  const usersMap = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.uid] = user;
      return acc;
    }, {} as Record<string, User>);
  }, [users]);

  const { youOwe, othersOweYou, totalOwedToYou, totalYouOwe } = useMemo(() => {
    const youOwe: { user: User; amount: number }[] = [];
    const othersOweYou: { user: User; amount: number }[] = [];
    let totalOwedToYou = 0;
    let totalYouOwe = 0;

    balances.forEach((balance) => {
      if (balance.amount === 0) return;

      const otherUserId = balance.users.find((id) => id !== currentUser.uid);
      if (!otherUserId) return;

      const otherUser = usersMap[otherUserId];
      if (!otherUser) return;

      const userIsUser1 = balance.users[0] === currentUser.uid;

      if ((userIsUser1 && balance.amount < 0) || (!userIsUser1 && balance.amount > 0)) {
        // You owe other user
        const amount = userIsUser1 ? -balance.amount : balance.amount;
        youOwe.push({ user: otherUser, amount });
        totalYouOwe += amount;
      } else {
        // Other user owes you
        const amount = userIsUser1 ? balance.amount : -balance.amount;
        othersOweYou.push({ user: otherUser, amount });
        totalOwedToYou += amount;
      }
    });

    return { youOwe, othersOweYou, totalOwedToYou, totalYouOwe };
  }, [balances, currentUser, usersMap]);

  const handleMarkAsPaid = async (fromUserId: string, toUserId: string, amount: number, expenseIds: string[]) => {
    const paymentKey = `${fromUserId}-${toUserId}`;

    setProcessingPayments(prev => new Set(prev).add(paymentKey));

    try {
      const result = await markAsPaid({
        fromUserId,
        toUserId,
        amount,
        expenseIds
      });

      if (result.error) {
        toast({
          title: 'Payment Failed',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        const fromUser = usersMap[fromUserId];
        const toUser = usersMap[toUserId];
        toast({
          title: 'Payment Recorded!',
          description: `${fromUser.name} paid ${toUser.name} Rs. ${amount.toFixed(2)}. Related expenses are now locked for editing.`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Payment Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentKey);
        return newSet;
      });
    }
  };

  const handlePartialPayment = async (fromUserId: string, toUserId: string, amount: number, expenseIds: string[]) => {
    const paymentKey = `${fromUserId}-${toUserId}-partial`;

    setProcessingPayments(prev => new Set(prev).add(paymentKey));

    try {
      const result = await recordPartialPayment({
        fromUserId,
        toUserId,
        amount,
        expenseIds
      });

      if (result.error) {
        toast({
          title: 'Partial Payment Failed',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        const fromUser = usersMap[fromUserId];
        const toUser = usersMap[toUserId];
        toast({
          title: 'Partial Payment Recorded!',
          description: `${fromUser.name} paid ${toUser.name} Rs. ${amount.toFixed(2)}. Related expenses are now locked for editing.`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Partial Payment Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentKey);
        return newSet;
      });
    }
  };

  const handleConfirmPayment = async () => {
    if (!confirmDialog) return;

    if (confirmDialog.type === 'full') {
      setConfirmDialog(null);
      await handleMarkAsPaid(confirmDialog.fromUser.uid, confirmDialog.toUser.uid, confirmDialog.amount, confirmDialog.expenseIds);
    } else if (confirmDialog.type === 'partial') {
      const amount = parseFloat(partialAmount);
      if (!amount || amount <= 0 || amount > confirmDialog.amount) {
        toast({
          title: 'Invalid Amount',
          description: 'Please enter a valid partial payment amount.',
          variant: 'destructive',
        });
        return;
      }

      // Show final confirmation instead of processing immediately
      setShowFinalConfirmation(true);
    }
  };

  const handleFinalConfirm = async () => {
    if (!confirmDialog) return;

    const amount = parseFloat(partialAmount);
    setShowFinalConfirmation(false);
    setConfirmDialog(null);

    await handlePartialPayment(confirmDialog.fromUser.uid, confirmDialog.toUser.uid, amount, confirmDialog.expenseIds);
    setPartialAmount('');
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-destructive flex items-center">
            <ArrowRight className="mr-2 h-4 w-4" /> You Owe
          </h3>
          <div className="font-bold text-destructive">
            Rs. {totalYouOwe.toFixed(2)}
          </div>
        </div>
        <div className="space-y-2">
          {youOwe.length > 0 ? (
            youOwe.map(({ user, amount }) => {
              const isExpanded = expandedUserId === user.uid;
              const relevantExpenses = expenses
                .filter(e => e.payerId === user.uid && e.sharedWith.includes(currentUser.uid))
                .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

              const contributingExpenses: { id: string; description: string; amount: number }[] = [];
              let remainingToMatch = amount;

              for (const expense of relevantExpenses) {
                if (remainingToMatch <= 0) break;
                const share = expense.perPersonShare;
                const contribution = Math.min(share, remainingToMatch);
                contributingExpenses.push({
                  id: expense.id,
                  description: expense.description,
                  amount: contribution
                });
                remainingToMatch -= contribution;
              }

              return (
                <div key={user.uid} className="border rounded-md overflow-hidden">
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary transition-colors"
                    onClick={() => setExpandedUserId(isExpanded ? null : user.uid)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
                    </div>
                    <span className="font-semibold text-sm text-destructive">Rs. {amount.toFixed(2)}</span>
                  </div>

                  {isExpanded && (
                    <div className="bg-muted/30 p-3 border-t space-y-2 animate-in slide-in-from-top-1 duration-200">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Breakdown:</p>
                      {contributingExpenses.length > 0 ? (
                        <>
                          <div className="space-y-1">
                            {contributingExpenses.map(expense => (
                              <div key={expense.id} className="flex justify-between text-xs">
                                <span>{expense.description}</span>
                                <span className="font-medium">Rs. {expense.amount.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t flex justify-between text-sm font-bold">
                            <span>Total</span>
                            <span>= Rs. {amount.toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground italic text-center">No individual expense details found (legacy balance or manual adjustment).</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground p-2">You don't owe anyone. Great job!</p>
          )}
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-green-600 flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> Others Owe You
          </h3>
          <div className="font-bold text-green-600">
            Rs. {totalOwedToYou.toFixed(2)}
          </div>
        </div>
        <div className="space-y-2">
          {othersOweYou.length > 0 ? (
            othersOweYou.map(({ user, amount }) => {
              const paymentKey = `${user.uid}-${currentUser.uid}`;
              const isProcessing = processingPayments.has(paymentKey);
              const isExpanded = expandedUserId === user.uid;

              const relevantExpenses = expenses
                .filter(e => e.payerId === currentUser.uid && e.sharedWith.includes(user.uid))
                .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

              const contributingExpenses: { id: string; description: string; amount: number }[] = [];
              let remainingToMatch = amount;

              for (const expense of relevantExpenses) {
                if (remainingToMatch <= 0) break;
                const share = expense.perPersonShare;
                const contribution = Math.min(share, remainingToMatch);
                contributingExpenses.push({
                  id: expense.id,
                  description: expense.description,
                  amount: contribution
                });
                remainingToMatch -= contribution;
              }

              return (
                <div key={user.uid} className="border rounded-md overflow-hidden">
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary transition-colors"
                    onClick={() => setExpandedUserId(isExpanded ? null : user.uid)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-green-600">Rs. {amount.toFixed(2)}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isProcessing}
                            className="h-7 px-2 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isProcessing ? (
                              'Processing...'
                            ) : (
                              <>
                                <MoreHorizontal className="mr-1 h-3 w-3" />
                                Options
                              </>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setConfirmDialog({
                              type: 'full',
                              fromUser: user,
                              toUser: currentUser,
                              amount,
                              expenseIds: contributingExpenses.map(e => e.id)
                            })}
                          >
                            <Check className="mr-2 h-3 w-3" />
                            Mark as Paid
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setConfirmDialog({
                              type: 'partial',
                              fromUser: user,
                              toUser: currentUser,
                              amount,
                              expenseIds: contributingExpenses.map(e => e.id)
                            })}
                          >
                            <ArrowRight className="mr-2 h-3 w-3" />
                            Partial Payment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-muted/30 p-3 border-t space-y-2 animate-in slide-in-from-top-1 duration-200">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Breakdown:</p>
                      {contributingExpenses.length > 0 ? (
                        <>
                          <div className="space-y-1">
                            {contributingExpenses.map(item => (
                              <div key={item.id} className="flex justify-between text-xs">
                                <span>{item.description}</span>
                                <span className="font-medium">Rs. {item.amount.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t flex justify-between text-sm font-bold">
                            <span>Total</span>
                            <span>= Rs. {amount.toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground italic text-center">No individual expense details found (legacy balance or manual adjustment).</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground p-2">No one owes you anything right now.</p>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog?.type === 'full' ? 'Mark as Paid' : 'Record Partial Payment'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.type === 'full'
                ? `Are you sure you want to mark this debt as fully paid? This will record that ${confirmDialog?.fromUser.name} paid ${confirmDialog?.toUser.name} Rs. ${confirmDialog?.amount?.toFixed(2)}.`
                : `Record a partial payment from ${confirmDialog?.fromUser.name} to ${confirmDialog?.toUser.name}.`
              }
              <span className="mt-2 text-amber-600 font-medium flex items-center gap-1">
                <MoreHorizontal className="h-4 w-4" />
                <span>Note: Once marked, you won't be able to edit the related expense logs.</span>
              </span>
            </DialogDescription>
          </DialogHeader>

          {confirmDialog?.type === 'partial' && (
            <div className="space-y-2">
              <Label htmlFor="partial-amount">Amount Paid</Label>
              <Input
                id="partial-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={confirmDialog?.amount || 0}
                placeholder="Enter amount paid"
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum amount: Rs. {confirmDialog?.amount?.toFixed(2)}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialog(null);
                setPartialAmount('');
                setShowFinalConfirmation(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={
                confirmDialog?.type === 'partial' &&
                (!partialAmount || parseFloat(partialAmount) <= 0 || parseFloat(partialAmount) > (confirmDialog?.amount || 0))
              }
            >
              {confirmDialog?.type === 'full' ? 'Confirm Payment' : 'Next'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Confirmation Dialog */}
      <Dialog open={showFinalConfirmation} onOpenChange={setShowFinalConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Partial Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to record this partial payment?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-lg font-medium">
              {confirmDialog?.fromUser.name} will pay {confirmDialog?.toUser.name} <span className="text-green-600 font-bold">Rs. {parseFloat(partialAmount).toFixed(2)}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This will reduce their debt from Rs. {confirmDialog?.amount?.toFixed(2) || '0.00'} to Rs. {((confirmDialog?.amount || 0) - parseFloat(partialAmount)).toFixed(2)}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFinalConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFinalConfirm}
              className="bg-green-600 hover:bg-green-700"
            >
              Yes, Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

BalanceSummary.Skeleton = function BalanceSummarySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
