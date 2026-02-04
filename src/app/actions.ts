'use server';

import { z } from 'zod';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, UserCredential, Auth } from 'firebase/auth';
import { doc, setDoc, getDoc, runTransaction, serverTimestamp, collection, getDocs, query, where, updateDoc, arrayUnion } from 'firebase/firestore';
import type { Balance } from '@/lib/types';
import { PlaceHolderImages, DEFAULT_PROFILE_PICTURE } from '@/lib/placeholder-images';
import { auth, db } from '@/lib/firebase';

// Add type for the PlaceholderImage interface
interface PlaceholderImage {
  imageUrl: string;
  // Add other properties if they exist in your PlaceholderImage type
}

// --- AUTH ACTIONS ---

const signUpSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const createGroupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  groupName: z.string().min(2),
  memberEmails: z.string(), // Changed to string to match form input
  mode: z.literal('create'),
  contactInfo: z.string().min(5),
  address: z.string().min(5),
  collegeYear: z.string().min(1),
  department: z.string().min(2),
});

const joinGroupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  groupId: z.string(),
  mode: z.literal('join'),
  contactInfo: z.string().min(5),
  address: z.string().min(5),
  collegeYear: z.string().min(1),
  department: z.string().min(2),
});

export async function signUp(values: any) {
  try {
    console.log('Signing up user:', values.email);
    console.log('Form values:', values);
    console.log('MODE IS:', values.mode);

    // Create Firebase user
    const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
    const user = userCredential.user;
    console.log('Firebase user created:', user.uid);

    // Check if user document already exists (for users who were removed but still have auth)
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      console.log('User document already exists, updating...');
      // User document exists, update it instead of creating new
      const updateData: any = {
        name: values.name,
        contactInfo: values.contactInfo,
        address: values.address,
        collegeName: values.collegeName,
        department: values.department,
        collegeYear: values.collegeYear,
        updatedAt: serverTimestamp(),
      };

      if (values.mode === 'create') {
        // Create group and update user
        const groupData = {
          name: values.groupName,
          createdBy: user.uid,
          memberIds: [user.uid],
          memberEmails: [...values.memberEmails.split(',').map((email: string) => email.trim()), values.email],
          createdAt: serverTimestamp(),
        };

        const groupRef = doc(collection(db, 'groups'));
        await setDoc(groupRef, groupData);

        updateData.groupId = groupRef.id;
        updateData.role = 'admin';
      } else if (values.mode === 'join') {
        // Join existing group and update user
        updateData.groupId = values.groupId;
        updateData.role = 'member';
        
        // Add user to group's memberIds array
        await updateDoc(doc(db, 'groups', values.groupId), {
          memberIds: arrayUnion(user.uid)
        });
      }

      await updateDoc(userDocRef, updateData);
      console.log('User document updated successfully');
      
    } else {
      console.log('Creating new user document...');
      // User document doesn't exist, create new one (normal flow)
      if (values.mode === 'create') {
        // Create group
        const groupData = {
          name: values.groupName,
          createdBy: user.uid,
          memberIds: [user.uid], // Start with creator as member
          memberEmails: [...values.memberEmails.split(',').map((email: string) => email.trim()), values.email], // Parse memberEmails string
          createdAt: serverTimestamp(),
        };

        const groupRef = doc(collection(db, 'groups'));
        await setDoc(groupRef, groupData);

        // Create user document with group reference
        const userData = {
          uid: user.uid,
          name: values.name,
          email: values.email,
          groupId: groupRef.id,
          role: 'admin',
          avatarUrl: DEFAULT_PROFILE_PICTURE,
          contactInfo: values.contactInfo,
          address: values.address,
          collegeName: values.collegeName,
          department: values.department,
          collegeYear: values.collegeYear,
          createdAt: serverTimestamp(),
        };
        
        await setDoc(doc(db, 'users', user.uid), userData);
        console.log('Group created successfully');
        
      } else if (values.mode === 'join') {
        // Join existing group
        const userData = {
          uid: user.uid,
          name: values.name,
          email: values.email,
          groupId: values.groupId,
          role: 'member',
          avatarUrl: DEFAULT_PROFILE_PICTURE,
          contactInfo: values.contactInfo,
          address: values.address,
          collegeName: values.collegeName,
          department: values.department,
          collegeYear: values.collegeYear,
          createdAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'users', user.uid), userData);
        
        // Add user to group's memberIds array
        await updateDoc(doc(db, 'groups', values.groupId), {
          memberIds: arrayUnion(user.uid)
        });
        
        console.log('User joined group successfully');
        
      } else {
        // Default signup (backward compatibility)
        const userData = {
          uid: user.uid,
          name: values.name,
          email: values.email,
          avatarUrl: DEFAULT_PROFILE_PICTURE,
          createdAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'users', user.uid), userData);
      }
    }
    
    console.log('User signed up successfully');
    return { success: true, userId: user.uid };
    
  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Handle specific Firebase Auth errors
    let errorMessage = 'An error occurred during signup. Please try again.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        // Check if this is a user who was removed but still has auth
        try {
          // Try to sign in with the provided credentials to get the user
          const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
          const user = userCredential.user;
          
          // Check if user document exists
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            // User was removed (no user document), allow them to continue signup
            // Delete the auth user and recreate
            await user.delete();
            
            // Now retry the signup
            return await signUp(values);
          } else {
            errorMessage = 'This email is already registered and active. Please log in instead.';
          }
        } catch (signInError: any) {
          errorMessage = 'This email is already registered. Please use a different email or log in.';
        }
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password should be at least 6 characters long.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your internet connection.';
        break;
      case 'permission-denied':
        errorMessage = 'Permission denied. Please check your Firestore security rules.';
        break;
      default:
        errorMessage = error.message || 'An unknown error occurred.';
    }
    
    return { error: errorMessage };
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
  console.log('Adding expense with values:', values);
  const perPersonShare = values.amount / values.sharedWith.length;

  try {
    await runTransaction(db, async (transaction) => {
      // 2. Update balances for each person involved (except the payer)
      const participants = values.sharedWith.filter(id => id !== values.payerId);
      console.log('Participants to update balances for:', participants);

      // First, read all balance documents
      const balanceRefs: { ref: any; userIDs: string[]; participantId: string }[] = [];
      for (const participantId of participants) {
        const userIDs = [values.payerId, participantId].sort();
        const balanceDocId = userIDs.join('_');
        const balanceRef = doc(db, 'balances', balanceDocId);
        balanceRefs.push({ ref: balanceRef, userIDs, participantId });
      }

      // Read all balance documents first
      const balanceDocs = await Promise.all(
        balanceRefs.map(({ ref }) => transaction.get(ref))
      );

      // Now do all writes
      // 1. Add the new expense
      const newExpenseRef = doc(collection(db, 'expenses'));
      console.log('Creating expense document at:', newExpenseRef.path);
      transaction.set(newExpenseRef, {
        ...values,
        perPersonShare,
        timestamp: serverTimestamp(),
      });
      console.log('Expense document created');

      // 2. Write all balance updates
      balanceRefs.forEach(({ ref, userIDs, participantId }, index) => {
        const balanceDoc = balanceDocs[index];
        const currentAmount = balanceDoc.exists() ? (balanceDoc.data() as any).amount : 0;
        
        // Positive amount means userIDs[1] owes userIDs[0]
        const amountChange = values.payerId === userIDs[0] ? perPersonShare : -perPersonShare;
        
        const newAmount = currentAmount + amountChange;
        console.log('Balance update for', participantId, ':', { currentAmount, amountChange, newAmount });

        transaction.set(ref, {
          id: userIDs.join('_'),
          users: userIDs,
          amount: newAmount,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      });
    });

    console.log('Transaction completed successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Transaction failed: ', error);
    return { error: `Failed to add expense: ${error.message}` };
  }
}

// --- PAYMENT ACTION ---

const markAsPaidSchema = z.object({
  fromUserId: z.string(),
  toUserId: z.string(),
  amount: z.number().gt(0),
});

export async function markAsPaid(values: z.infer<typeof markAsPaidSchema>) {
  console.log('Marking as paid:', values);

  try {
    await runTransaction(db, async (transaction) => {
      // Create balance document ID (sorted user IDs)
      const userIDs = [values.fromUserId, values.toUserId].sort();
      const balanceDocId = userIDs.join('_');
      const balanceRef = doc(db, 'balances', balanceDocId);

      // Read the current balance
      const balanceDoc = await transaction.get(balanceRef);
      if (!balanceDoc.exists()) {
        throw new Error('Balance document not found');
      }

      const currentBalance = (balanceDoc.data() as any).amount;
      console.log('Current balance:', currentBalance);

      // Determine the direction of the payment
      // Positive balance means userIDs[1] owes userIDs[0]
      // Negative balance means userIDs[0] owes userIDs[1]
      // Payment should always move the balance toward zero
      let newBalance: number;
      
      if (currentBalance > 0) {
        // userIDs[1] owes userIDs[0]
        // If fromUserId is userIDs[1] (payer), reduce positive balance
        // If fromUserId is userIDs[0] (receiver), this shouldn't happen in normal flow
        newBalance = values.fromUserId === userIDs[1] 
          ? currentBalance - values.amount 
          : currentBalance + values.amount;
      } else {
        // userIDs[0] owes userIDs[1]
        // If fromUserId is userIDs[0] (payer), increase negative balance toward zero
        // If fromUserId is userIDs[1] (receiver), this shouldn't happen in normal flow
        newBalance = values.fromUserId === userIDs[0] 
          ? currentBalance + values.amount 
          : currentBalance - values.amount;
      }

      console.log('New balance:', newBalance);

      // Update the balance
      transaction.set(balanceRef, {
        id: balanceDocId,
        users: userIDs,
        amount: newBalance,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Create a payment record for tracking
      const paymentRef = doc(collection(db, 'payments'));
      transaction.set(paymentRef, {
        fromUserId: values.fromUserId,
        toUserId: values.toUserId,
        amount: values.amount,
        timestamp: serverTimestamp(),
        type: 'payment'
      });
    });

    console.log('Payment recorded successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Payment failed: ', error);
    return { error: `Failed to record payment: ${error.message}` };
  }
}

// --- PROFILE ACTION ---

const updateProfileSchema = z.object({
  uid: z.string(),
  name: z.string().min(1, 'Name is required'),
  avatarUrl: z.string().url().optional().nullable(),
});

export async function updateProfile(values: z.infer<typeof updateProfileSchema>) {
  try {
    console.log('Updating profile for user:', values.uid);
    
    const userDocRef = doc(db, 'users', values.uid);
    
    // Update the user document
    await setDoc(userDocRef, {
      name: values.name,
      avatarUrl: values.avatarUrl || null,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    console.log('Profile updated successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Profile update failed:', error);
    return { error: `Failed to update profile: ${error.message}` };
  }
}

// --- UPDATE EXPENSE ACTION ---

const updateExpenseSchema = z.object({
  expenseId: z.string(),
  description: z.string().min(1),
  amount: z.number().gt(0),
  sharedWith: z.array(z.string()).min(1),
});

export async function updateExpense(values: z.infer<typeof updateExpenseSchema>) {
  try {
    console.log('Updating expense:', values);
    
    const expenseRef = doc(db, 'expenses', values.expenseId);
    
    // Get the original expense to calculate balance changes
    const expenseDoc = await getDoc(expenseRef);
    if (!expenseDoc.exists()) {
      throw new Error('Expense not found');
    }
    
    const originalExpense = expenseDoc.data() as any;
    const originalPerPersonShare = originalExpense.amount / originalExpense.sharedWith.length;
    const newPerPersonShare = values.amount / values.sharedWith.length;

    await runTransaction(db, async (transaction) => {
      // First, read all balance documents for both original and new participants
      const originalParticipants = originalExpense.sharedWith.filter((id: string) => id !== originalExpense.payerId);
      const newParticipants = values.sharedWith.filter(id => id !== originalExpense.payerId);
      
      // Combine all unique participants
      const allParticipants = Array.from(new Set([...originalParticipants, ...newParticipants]));
      const balanceRefs: { ref: any; userIDs: string[]; participantId: string }[] = [];
      
      for (const participantId of allParticipants) {
        const userIDs = [originalExpense.payerId, participantId].sort();
        const balanceDocId = userIDs.join('_');
        const balanceRef = doc(db, 'balances', balanceDocId);
        balanceRefs.push({ ref: balanceRef, userIDs, participantId });
      }

      // Read all balance documents first
      const balanceDocs = await Promise.all(
        balanceRefs.map(({ ref }) => transaction.get(ref))
      );

      // Now do all writes
      // 1. Update the expense document
      transaction.update(expenseRef, {
        description: values.description,
        amount: values.amount,
        sharedWith: values.sharedWith,
        perPersonShare: newPerPersonShare,
        updatedAt: serverTimestamp(),
      });

      // 2. Revert original balance changes
      originalParticipants.forEach((participantId: string) => {
        const userIDs = [originalExpense.payerId, participantId].sort();
        const balanceRefIndex = balanceRefs.findIndex(({ participantId }) => participantId === participantId);
        const balanceDoc = balanceDocs[balanceRefIndex];
        const currentAmount = balanceDoc.exists() ? (balanceDoc.data() as any).amount : 0;
        
        // Reverse the original balance change
        const amountChange = originalExpense.payerId === userIDs[0] ? -originalPerPersonShare : originalPerPersonShare;
        const revertedAmount = currentAmount + amountChange;

        transaction.set(balanceRefs[balanceRefIndex].ref, {
          id: userIDs.join('_'),
          users: userIDs,
          amount: revertedAmount,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      });

      // 3. Apply new balance changes
      newParticipants.forEach((participantId: string) => {
        const userIDs = [originalExpense.payerId, participantId].sort();
        const balanceRefIndex = balanceRefs.findIndex(({ participantId }) => participantId === participantId);
        const balanceDoc = balanceDocs[balanceRefIndex];
        const currentAmount = balanceDoc.exists() ? (balanceDoc.data() as any).amount : 0;
        
        // Apply the new balance change
        const amountChange = originalExpense.payerId === userIDs[0] ? newPerPersonShare : -newPerPersonShare;
        const newAmount = currentAmount + amountChange;

        transaction.set(balanceRefs[balanceRefIndex].ref, {
          id: userIDs.join('_'),
          users: userIDs,
          amount: newAmount,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      });
    });

    console.log('Expense updated successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Expense update failed:', error);
    return { error: `Failed to update expense: ${error.message}` };
  }
}

// --- DELETE EXPENSE ACTION ---

const deleteExpenseSchema = z.object({
  expenseId: z.string(),
});

export async function deleteExpense(values: z.infer<typeof deleteExpenseSchema>) {
  try {
    console.log('Deleting expense:', values.expenseId);
    
    const expenseRef = doc(db, 'expenses', values.expenseId);
    
    // Get the expense to calculate balance reversions
    const expenseDoc = await getDoc(expenseRef);
    if (!expenseDoc.exists()) {
      throw new Error('Expense not found');
    }
    
    const expense = expenseDoc.data() as any;
    const perPersonShare = expense.amount / expense.sharedWith.length;

    await runTransaction(db, async (transaction) => {
      // First, read all balance documents
      const participants = expense.sharedWith.filter((id: string) => id !== expense.payerId);
      const balanceRefs: { ref: any; userIDs: string[]; participantId: string }[] = [];
      
      for (const participantId of participants) {
        const userIDs = [expense.payerId, participantId].sort();
        const balanceDocId = userIDs.join('_');
        const balanceRef = doc(db, 'balances', balanceDocId);
        balanceRefs.push({ ref: balanceRef, userIDs, participantId });
      }

      // Read all balance documents first
      const balanceDocs = await Promise.all(
        balanceRefs.map(({ ref }) => transaction.get(ref))
      );

      // Now do all writes
      // 1. Delete the expense document
      transaction.delete(expenseRef);

      // 2. Revert balance changes for all participants
      balanceRefs.forEach(({ ref, userIDs, participantId }, index) => {
        const balanceDoc = balanceDocs[index];
        const currentAmount = balanceDoc.exists() ? (balanceDoc.data() as any).amount : 0;
        
        // Reverse the original balance change
        const amountChange = expense.payerId === userIDs[0] ? -perPersonShare : perPersonShare;
        const revertedAmount = currentAmount + amountChange;

        transaction.set(ref, {
          id: userIDs.join('_'),
          users: userIDs,
          amount: revertedAmount,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      });
    });

    console.log('Expense deleted successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Expense deletion failed:', error);
    return { error: `Failed to delete expense: ${error.message}` };
  }
}

// --- MIGRATION ACTIONS ---

export async function migrateExistingUsers() {
  try {
    console.log('Starting migration for existing users...');
    
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs;
    
    // Get all groups
    const groupsSnapshot = await getDocs(collection(db, 'groups'));
    const groups = groupsSnapshot.docs;
    
    console.log(`Found ${users.length} users and ${groups.length} groups`);
    
    // Create a map of group creators and initialize memberIds
    const groupCreators: { [key: string]: string } = {};
    const groupMemberIds: { [key: string]: string[] } = {};
    
    groups.forEach(groupDoc => {
      const groupData = groupDoc.data() as any;
      const groupId = groupDoc.id;
      groupCreators[groupData.createdBy] = groupId;
      groupMemberIds[groupId] = groupData.memberIds || [];
    });
    
    // Update users who are group creators
    let updatedCount = 0;
    for (const userDoc of users) {
      const userData = userDoc.data() as any;
      const userId = userDoc.id;
      
      // Check if this user created a group
      if (groupCreators[userId] && !userData.groupId) {
        await updateDoc(doc(db, 'users', userId), {
          groupId: groupCreators[userId],
          role: 'admin'
        });
        
        // Add creator to group memberIds if not already there
        const groupId = groupCreators[userId];
        if (!groupMemberIds[groupId].includes(userId)) {
          await updateDoc(doc(db, 'groups', groupId), {
            memberIds: arrayUnion(userId)
          });
          groupMemberIds[groupId].push(userId);
        }
        
        console.log(`Updated user ${userId} with groupId ${groupId} and role admin`);
        updatedCount++;
      }
      
      // Also add users who have groupId but are not in memberIds
      if (userData.groupId && groupMemberIds[userData.groupId]) {
        if (!groupMemberIds[userData.groupId].includes(userId)) {
          await updateDoc(doc(db, 'groups', userData.groupId), {
            memberIds: arrayUnion(userId)
          });
          groupMemberIds[userData.groupId].push(userId);
          console.log(`Added user ${userId} to group ${userData.groupId} memberIds`);
        }
      }
    }
    
    console.log(`Migration completed. Updated ${updatedCount} users.`);
    return { success: true, updatedCount };
    
  } catch (error: any) {
    console.error('Migration failed:', error);
    return { error: `Migration failed: ${error.message}` };
  }
}

// --- GROUP ACTIONS ---

const addGroupMemberSchema = z.object({
  groupId: z.string(),
  adminId: z.string(),
  memberEmail: z.string().email(),
});

export async function addGroupMember(values: z.infer<typeof addGroupMemberSchema>) {
  try {
    // Check if the user adding the member is an admin of the group
    const adminDoc = await getDoc(doc(db, 'users', values.adminId));
    if (!adminDoc.exists()) {
      return { error: 'Admin user not found' };
    }

    const adminData = adminDoc.data() as any;
    if (adminData.groupId !== values.groupId || adminData.role !== 'admin') {
      return { error: 'Only group admins can add members' };
    }

    // Check if the group exists
    const groupDoc = await getDoc(doc(db, 'groups', values.groupId));
    if (!groupDoc.exists()) {
      return { error: 'Group not found' };
    }

    const groupData = groupDoc.data() as any;

    // Check if email is already in the group
    if (groupData.memberEmails.includes(values.memberEmail)) {
      return { error: 'This email is already a member of the group' };
    }

    // Add the email to the group's memberEmails array
    await updateDoc(doc(db, 'groups', values.groupId), {
      memberEmails: [...groupData.memberEmails, values.memberEmail],
      updatedAt: serverTimestamp(),
    });

    console.log('Member added to group successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Error adding group member:', error);
    return { error: `Failed to add member: ${error.message}` };
  }
}

// New function to handle when a user actually joins after being invited
export async function joinGroupAfterInvitation(userId: string, groupId: string) {
  try {
    // Add user to group's memberIds array
    await updateDoc(doc(db, 'groups', groupId), {
      memberIds: arrayUnion(userId)
    });

    console.log('User added to group memberIds successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Error adding user to group memberIds:', error);
    return { error: `Failed to join group: ${error.message}` };
  }
}

export async function checkEmailInvitation(email: string) {
  try {
    const groupsQuery = query(collection(db, 'groups'), where('memberEmails', 'array-contains', email));
    const groupsSnapshot = await getDocs(groupsQuery);
    
    if (!groupsSnapshot.empty) {
      const groupDoc = groupsSnapshot.docs[0];
      const groupData = groupDoc.data() as any;
      
      // Get creator info
      const creatorDoc = await getDoc(doc(db, 'users', groupData.createdBy));
      const creatorData = creatorDoc.exists() ? creatorDoc.data() : null;
      
      return {
        groupInfo: {
          id: groupDoc.id,
          name: groupData.name,
          creatorName: creatorData?.name || 'Unknown',
        }
      };
    }
    
    return { groupInfo: null };
  } catch (error: any) {
    console.error('Error checking email invitation:', error);
    return { error: `Failed to check invitation: ${error.message}` };
  }
}

export async function recordPartialPayment(values: any) {
  try {
    console.log('Recording partial payment:', values);
    
    const { fromUserId, toUserId, amount } = values;
    
    await runTransaction(db, async (transaction) => {
      // Create balance document ID (sorted user IDs)
      const userIDs = [fromUserId, toUserId].sort();
      const balanceDocId = userIDs.join('_');
      const balanceRef = doc(db, 'balances', balanceDocId);

      // Read the current balance
      const balanceDoc = await transaction.get(balanceRef);
      if (!balanceDoc.exists()) {
        throw new Error('Balance document not found');
      }

      const currentBalance = (balanceDoc.data() as any).amount;
      console.log('Current balance:', currentBalance);

      // Determine the direction of the payment
      // Positive balance means userIDs[1] owes userIDs[0]
      // Negative balance means userIDs[0] owes userIDs[1]
      // Payment should always move the balance toward zero
      let newBalance: number;
      
      if (currentBalance > 0) {
        // userIDs[1] owes userIDs[0]
        // If fromUserId is userIDs[1] (payer), reduce positive balance
        newBalance = fromUserId === userIDs[1] 
          ? Math.max(0, currentBalance - amount)  // Don't go below zero
          : currentBalance + amount;
      } else {
        // userIDs[0] owes userIDs[1]
        // If fromUserId is userIDs[0] (payer), increase negative balance toward zero
        newBalance = fromUserId === userIDs[0] 
          ? Math.min(0, currentBalance + amount)  // Don't go above zero
          : currentBalance - amount;
      }

      console.log('New balance after partial payment:', newBalance);

      // Update the balance
      transaction.set(balanceRef, {
        id: balanceDocId,
        users: userIDs,
        amount: newBalance,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Create a payment record for tracking
      const paymentRef = doc(collection(db, 'payments'));
      transaction.set(paymentRef, {
        fromUserId,
        toUserId,
        amount,
        type: 'partial',
        timestamp: serverTimestamp(),
      });
    });
    
    console.log('Partial payment recorded successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Error recording partial payment:', error);
    return { error: `Failed to record partial payment: ${error.message}` };
  }
}
