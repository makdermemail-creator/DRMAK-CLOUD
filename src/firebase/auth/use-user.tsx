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
        avatarUrl: '',
        role: 'Admin',
        isAdmin: true,
        isMainAdmin: true,
      }
      : null, [isProfileLoading, userProfile, authUser]);

  const user = React.useMemo(() => {
    if (!authUser) return null;

    // Use current profile if it exists, otherwise use fallback
    const baseUser = userProfile || adminFallback;

    if (!baseUser) return null;

    // Determine avatar URL: 
    // 1. Firestore avatarUrl (highest priority)
    // 2. Auth photoURL
    // 3. Fallback initials if needed (handled by UI components)
    let avatarUrl = userProfile ? userProfile.avatarUrl : (authUser.photoURL || '');

    return {
      ...baseUser,
      id: baseUser.id || authUser.uid,
      email: baseUser.email || authUser.email || '',
      name: baseUser.name || authUser.displayName || authUser.email?.split('@')[0] || 'User',
      avatarUrl: avatarUrl,
      role: baseUser.role || 'Guest',
    };
  }, [userProfile, adminFallback, authUser]);

  return React.useMemo(() => ({
    user,
    authUser,
    isUserLoading: isLoading,
    error: authError || profileError,
  }), [user, authUser, isLoading, authError, profileError]);
}
