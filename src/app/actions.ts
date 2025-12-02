'use server';

import { z } from 'zod';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, runTransaction, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { suggestOptimalDebtSettlement } from '@/ai/flows/suggest-optimal-debt-settlement';
import type { Balance } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// --- AUTH ACTIONS ---

const signUpSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function signUp(values: z.infer<typeof signUpSchema>) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
    const user = userCredential.user;

    const usersCollection = collection(db, 'users');
    const allUsersSnapshot = await getDocs(usersCollection);
    const avatar = PlaceHolderImages[allUsersSnapshot.size % PlaceHolderImages.length];
    
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name: values.name,
      email: values.email,
      avatarUrl: avatar.imageUrl
    });

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

const logInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function logIn(values: z.infer<typeof logInSchema>) {
  try {
    await signInWithEmailAndPassword(auth, values.email, values.password);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function signOutAction() {
  await signOut(auth);
}


// --- EXPENSE ACTION ---

const addExpenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().gt(0),
  payerId: z.string(),
  sharedWith: z.array(z.string()).min(1),
});

export async function addExpense(values: z.infer<typeof addExpenseSchema>) {
  const perPersonShare = values.amount / values.sharedWith.length;

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Add the new expense
      const newExpenseRef = doc(collection(db, 'expenses'));
      transaction.set(newExpenseRef, {
        ...values,
        perPersonShare,
        timestamp: serverTimestamp(),
      });

      // 2. Update balances for each person involved (except the payer)
      const participants = values.sharedWith.filter(id => id !== values.payerId);

      for (const participantId of participants) {
        const userIDs = [values.payerId, participantId].sort();
        const balanceDocId = userIDs.join('_');
        const balanceRef = doc(db, 'balances', balanceDocId);

        const balanceDoc = await transaction.get(balanceRef);
        const currentAmount = balanceDoc.exists() ? balanceDoc.data().amount : 0;
        
        // Positive amount means userIDs[1] owes userIDs[0]
        const amountChange = values.payerId === userIDs[0] ? perPersonShare : -perPersonShare;
        
        const newAmount = currentAmount + amountChange;

        transaction.set(balanceRef, {
          id: balanceDocId,
          users: userIDs,
          amount: newAmount,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Transaction failed: ', error);
    return { error: 'Failed to add expense. Please try again.' };
  }
}

// --- AI SETTLEMENT ACTION ---

export async function getSettlementSuggestion(balances: Balance[]) {
    try {
        const formattedBalances = balances.map(balance => {
            if (balance.amount > 0) {
                // users[1] owes users[0]
                return { payerId: balance.users[0], userId: balance.users[1], amount: balance.amount };
            } else if (balance.amount < 0) {
                // users[0] owes users[1]
                return { payerId: balance.users[1], userId: balance.users[0], amount: -balance.amount };
            }
            return null;
        }).filter(b => b !== null && b.amount > 0.01); // Filter out zero or negligible balances

        if (formattedBalances.length === 0) {
            return { data: { settlementInstructions: [] } };
        }

        const suggestion = await suggestOptimalDebtSettlement({ balances: formattedBalances as any });
        return { data: suggestion };
    } catch (error: any) {
        console.error('AI suggestion failed: ', error);
        return { error: 'Could not generate settlement suggestions.' };
    }
}
