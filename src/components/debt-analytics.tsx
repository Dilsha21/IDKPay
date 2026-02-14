'use client';

import { useMemo } from 'react';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Expense, User } from '@/lib/types';
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, eachDayOfInterval, isWithinInterval } from 'date-fns';

interface DebtAnalyticsProps {
  expenses: Expense[];
  users: User[];
  currentUserId: string;
}

interface MonthlyData {
  month: string;
  totalDebt: number;
  weeklyAvg: number;
}

export function DebtAnalytics({ expenses, users, currentUserId }: DebtAnalyticsProps) {
  const analyticsData = useMemo(() => {
    const usersMap = users.reduce((acc, user) => {
      acc[user.uid] = user;
      return acc;
    }, {} as Record<string, User>);

    // Filter out expenses that don't have a timestamp yet (transient state)
    const validExpenses = expenses.filter(e => e.timestamp);

    // Group expenses by month
    const expensesByMonth = new Map<string, Expense[]>();

    validExpenses.forEach(expense => {
      const monthKey = format(expense.timestamp.toDate(), 'MMM yyyy');
      if (!expensesByMonth.has(monthKey)) {
        expensesByMonth.set(monthKey, []);
      }
      expensesByMonth.get(monthKey)!.push(expense);
    });

    // Calculate monthly data
    const monthlyData: MonthlyData[] = [];

    expensesByMonth.forEach((monthExpenses, monthKey) => {
      const monthStart = startOfMonth(monthExpenses[0].timestamp.toDate());
      const monthEnd = endOfMonth(monthStart);

      // Get all weeks in this month
      const weeksInMonth = eachWeekOfInterval({ start: monthStart, end: monthEnd });

      // Calculate total debt for the month
      let totalDebt = 0;
      monthExpenses.forEach(expense => {
        if (expense.payerId !== currentUserId) {
          const perPersonShare = expense.amount / expense.sharedWith.length;
          if (expense.sharedWith.includes(currentUserId)) {
            totalDebt += perPersonShare;
          }
        }
      });

      // Calculate weekly averages
      const weeklyDebts: number[] = [];

      weeksInMonth.forEach((weekStart, index) => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // End of week

        let weekDebt = 0;
        monthExpenses.forEach(expense => {
          const expenseDate = expense.timestamp.toDate();
          if (isWithinInterval(expenseDate, { start: weekStart, end: weekEnd })) {
            if (expense.payerId !== currentUserId) {
              const perPersonShare = expense.amount / expense.sharedWith.length;
              if (expense.sharedWith.includes(currentUserId)) {
                weekDebt += perPersonShare;
              }
            }
          }
        });
        weeklyDebts.push(weekDebt);
      });

      // Calculate average weekly debt
      const weeklyAvg = totalDebt / 4;

      monthlyData.push({
        month: monthKey,
        totalDebt: Math.round(totalDebt * 100) / 100,
        weeklyAvg: Math.round(weeklyAvg * 100) / 100,
      });
    });

    // Sort by month chronologically
    return monthlyData.sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  }, [expenses, users, currentUserId]);

  if (analyticsData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Debt Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No debt data available yet.</p>
            <p className="text-sm text-muted-foreground">Start adding expenses to see your debt trends.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debt Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>• Blue line: Total debt accumulated each month</p>
            <p>• Green line: Average weekly debt within each month</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [`Rs. ${value.toFixed(2)}`, '']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalDebt"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Total Monthly Debt"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="weeklyAvg"
                stroke="#10b981"
                strokeWidth={2}
                name="Weekly Average"
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Current Month Debt</p>
              <p className="text-xl font-bold text-blue-700">
                Rs. {analyticsData[analyticsData.length - 1]?.totalDebt.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Weekly Average</p>
              <p className="text-xl font-bold text-green-700">
                Rs. {analyticsData[analyticsData.length - 1]?.weeklyAvg.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

DebtAnalytics.Skeleton = function DebtAnalyticsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Debt Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </CardContent>
    </Card>
  );
};
