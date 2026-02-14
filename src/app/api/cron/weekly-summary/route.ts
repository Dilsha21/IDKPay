import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
    collection,
    getDocs,
    query,
    where,
    addDoc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';

// POST /api/cron/weekly-summary
// Trigger: External cron service every Friday at 7:30 AM
// Protected by CRON_SECRET env var
export async function POST(request: Request) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch all users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map((doc) => ({
            uid: doc.id,
            ...(doc.data() as any),
        }));

        if (users.length === 0) {
            return NextResponse.json({ message: 'No users found' });
        }

        // Build a name lookup
        const nameMap: Record<string, string> = {};
        for (const u of users) {
            nameMap[u.uid] = u.name || 'Unknown';
        }

        // 2. Fetch all balances
        const balancesSnapshot = await getDocs(collection(db, 'balances'));
        const balances = balancesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as any),
        }));

        // 3. Fetch expenses from the last 7 days
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekAgoTimestamp = Timestamp.fromDate(weekAgo);

        const expensesQuery = query(
            collection(db, 'expenses'),
            where('timestamp', '>=', weekAgoTimestamp)
        );
        const expensesSnapshot = await getDocs(expensesQuery);
        const weeklyExpenses = expensesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as any),
        }));

        // 4. For each user, build the weekly summary notification
        let notificationsCreated = 0;

        for (const user of users) {
            const uid = user.uid;

            // --- Balances: What you owe & what others owe you ---
            const youOwe: { name: string; amount: number }[] = [];
            const othersOweYou: { name: string; amount: number }[] = [];

            for (const balance of balances) {
                if (!balance.users || balance.amount === 0) continue;
                if (!balance.users.includes(uid)) continue;

                const otherUserId = balance.users.find((id: string) => id !== uid);
                if (!otherUserId) continue;

                const otherName = nameMap[otherUserId] || 'Unknown';
                const userIsUser0 = balance.users[0] === uid;

                if (
                    (userIsUser0 && balance.amount < 0) ||
                    (!userIsUser0 && balance.amount > 0)
                ) {
                    // You owe other user
                    const amt = userIsUser0 ? -balance.amount : balance.amount;
                    youOwe.push({ name: otherName, amount: amt });
                } else {
                    // Other user owes you
                    const amt = userIsUser0 ? balance.amount : -balance.amount;
                    othersOweYou.push({ name: otherName, amount: amt });
                }
            }

            // --- Weekly expense stats ---
            // avgExpenseBoreForOthers: avg amount per day you paid for others
            // avgExpenseOthersBoreForYou[name]: avg amount per day each other user paid for you

            let totalBoreForOthers = 0;
            const othersBoreForYou: Record<string, number> = {};

            for (const exp of weeklyExpenses) {
                if (!exp.sharedWith || !Array.isArray(exp.sharedWith)) continue;
                const perPerson = exp.amount / exp.sharedWith.length;

                if (exp.payerId === uid) {
                    // You paid — count the portions that went to others
                    const othersCount = exp.sharedWith.filter(
                        (id: string) => id !== uid
                    ).length;
                    totalBoreForOthers += perPerson * othersCount;
                }

                if (exp.payerId !== uid && exp.sharedWith.includes(uid)) {
                    // Someone else paid and you were in sharedWith
                    const payerName = nameMap[exp.payerId] || 'Unknown';
                    othersBoreForYou[payerName] =
                        (othersBoreForYou[payerName] || 0) + perPerson;
                }
            }

            const avgBoreForOthers = totalBoreForOthers / 7;

            // --- Build notification message ---
            const lines: string[] = [];

            // Balances
            if (youOwe.length > 0) {
                lines.push('📋 You owe:');
                for (const entry of youOwe) {
                    lines.push(`  ${entry.name}: Rs. ${entry.amount.toFixed(2)}`);
                }
            } else {
                lines.push('📋 You don\'t owe anyone!');
            }

            lines.push('');

            if (othersOweYou.length > 0) {
                lines.push('💰 Others owe you:');
                for (const entry of othersOweYou) {
                    lines.push(`  ${entry.name}: Rs. ${entry.amount.toFixed(2)}`);
                }
            } else {
                lines.push('💰 No one owes you anything right now.');
            }

            lines.push('');

            // Weekly stats
            lines.push('📊 This week\'s stats:');
            lines.push(
                `  You spent avg Rs. ${avgBoreForOthers.toFixed(2)}/day for others`
            );

            if (Object.keys(othersBoreForYou).length > 0) {
                for (const [name, total] of Object.entries(othersBoreForYou)) {
                    const avg = total / 7;
                    lines.push(
                        `  ${name} spent avg Rs. ${avg.toFixed(2)}/day for you`
                    );
                }
            } else {
                lines.push('  No one spent anything for you this week.');
            }

            const message = lines.join('\n');

            // Create the notification
            await addDoc(collection(db, 'notifications'), {
                userId: uid,
                type: 'weekly-summary',
                title: 'Weekly Balance Summary',
                message,
                read: false,
                timestamp: serverTimestamp(),
                metadata: {
                    youOwe,
                    othersOweYou,
                    avgBoreForOthers,
                    othersBoreForYou,
                    weekEnding: now.toISOString(),
                },
            });

            notificationsCreated++;
        }

        return NextResponse.json({
            success: true,
            notificationsCreated,
            message: `Weekly summary sent to ${notificationsCreated} users`,
        });
    } catch (error: any) {
        console.error('Weekly summary cron failed:', error);
        return NextResponse.json(
            { error: `Cron job failed: ${error.message}` },
            { status: 500 }
        );
    }
}
