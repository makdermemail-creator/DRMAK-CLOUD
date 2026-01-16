'use client';

import { useAuthUser } from '@/firebase/provider';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User } from '@/lib/types';

/**
 * Hook to get the fully-profiled user object from Firestore, including their role.
 * It uses the basic auth user's UID to fetch the corresponding document from the `/users` collection.
 */
export function useUser() {
  const { user: authUser, isUserLoading: isAuthLoading, userError: authError } = useAuthUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
    [firestore, authUser]
  );

  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useDoc<User>(userDocRef);

  const isLoading = isAuthLoading || (authUser && isProfileLoading);

  return {
    user: userProfile,
    authUser,
    isUserLoading: isLoading,
    error: authError || profileError,
  };
}
