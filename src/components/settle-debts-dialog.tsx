'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getSettlementSuggestion } from '@/app/actions';
import type { SuggestOptimalDebtSettlementOutput } from '@/ai/flows/suggest-optimal-debt-settlement';
import type { Balance, User } from '@/lib/types';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface SettleDebtsDialogProps {
  balances: Balance[];
  users: User[];
  currentUser: User;
}

export function SettleDebtsDialog({ balances, users, currentUser }: SettleDebtsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestOptimalDebtSettlementOutput | null>(null);
  const { toast } = useToast();

  const usersMap = users.reduce((acc, user) => {
    acc[user.uid] = user;
    return acc;
  }, {} as Record<string, User>);

  const handleFetchSuggestion = async () => {
    setLoading(true);
    setSuggestion(null);

    const result = await getSettlementSuggestion(balances);

    if (result.error) {
      toast({
        title: 'Error getting suggestion',
        description: result.error,
        variant: 'destructive',
      });
    } else if (result.data) {
      setSuggestion(result.data);
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" onClick={handleFetchSuggestion}>
          <Sparkles className="mr-2 h-4 w-4" />
          Suggest Settlement Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Optimal Settlement Plan</DialogTitle>
          <DialogDescription>
            AI-powered suggestions to settle all debts with the minimum number of transactions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {suggestion?.settlementInstructions.length === 0 && !loading && (
             <p className="text-center text-muted-foreground">All debts are settled!</p>
          )}
          {suggestion && suggestion.settlementInstructions.length > 0 && (
            <ul className="space-y-3">
              {suggestion.settlementInstructions.map((instruction, index) => {
                const fromUser = usersMap[instruction.fromUserId];
                const toUser = usersMap[instruction.toUserId];
                if (!fromUser || !toUser) return null;
                return (
                  <li key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={fromUser.avatarUrl} alt={fromUser.name} />
                        <AvatarFallback>{fromUser.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {fromUser.uid === currentUser.uid ? 'You' : fromUser.name}
                      </span>
                    </div>
                    <div className="flex flex-col items-center text-primary">
                        <span className="text-sm font-bold">Rs. {instruction.amount.toFixed(2)}</span>
                        <ArrowRight className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {toUser.uid === currentUser.uid ? 'You' : toUser.name}
                      </span>
                       <Avatar className="h-8 w-8">
                        <AvatarImage src={toUser.avatarUrl} alt={toUser.name} />
                        <AvatarFallback>{toUser.name[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
