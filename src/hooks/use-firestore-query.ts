'use client';

import { useState, useEffect, useMemo } from 'react';
import { onSnapshot, Query, DocumentData } from 'firebase/firestore';

export function useFirestoreQuery<T>(query: Query<DocumentData> | null) {
  const [docs, setDocs] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const serializedQuery = query ? query.toString() : 'null';

  useEffect(() => {
    if (!query) {
      setDocs([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const unsubscribe = onSnapshot(
      query,
      (querySnapshot) => {
        const data = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as T)
        );
        setDocs(data);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore query error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [serializedQuery]);

  return { docs, loading, error };
}
