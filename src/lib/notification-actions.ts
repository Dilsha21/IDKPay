'use client';

import { db } from '@/lib/firebase';
import {
    doc,
    updateDoc,
    deleteDoc,
    collection,
    getDocs,
    query,
    where,
    addDoc,
    serverTimestamp,
} from 'firebase/firestore';

export async function markNotificationAsRead(notificationId: string) {
    await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
    });
}

export async function deleteNotification(notificationId: string) {
    await deleteDoc(doc(db, 'notifications', notificationId));
    return { success: true };
}

export async function getUnreadNotifications(userId: string) {
    const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
}
