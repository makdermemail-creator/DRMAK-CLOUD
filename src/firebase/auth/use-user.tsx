'use client';

import * as React from 'react';
import { useAuthUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
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

  // Emergency fallback for main admin if Firestore profile is missing or broken
  const adminFallback: User | null = React.useMemo(() =>
    !isProfileLoading && !userProfile && authUser?.email === 'admin1@skinsmith.com'
      ? {
        id: authUser.uid,
        name: 'Main Admin (Recovered)',
        email: authUser.email!,
        avatarUrl: `https://i.pravatar.cc/150?u=${authUser.uid}`,
        role: 'Admin',
        isAdmin: true,
        isMainAdmin: true,
      }
      : null, [isProfileLoading, userProfile, authUser]);

  const user = userProfile || adminFallback;

  return React.useMemo(() => ({
    user,
    authUser,
    isUserLoading: isLoading,
    error: authError || profileError,
  }), [user, authUser, isLoading, authError, profileError]);
}
