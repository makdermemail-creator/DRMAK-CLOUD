'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';

type ViewMode = 'none' | 'organization' | 'clinic';

interface ViewModeContextType {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

const VIEW_MODE_KEY = 'admin_view_mode';

export function ViewModeProvider({ children }: { children: ReactNode }) {
    const [viewMode, setViewModeState] = useState<ViewMode>(() => {
        // Restore saved view mode from localStorage immediately on first render
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(VIEW_MODE_KEY);
            if (stored === 'organization' || stored === 'clinic') return stored;
        }
        return 'none';
    });

    const auth = useAuth();
    // Track whether we have ever seen an authenticated user in this session
    const hadUserRef = useRef(false);

    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is authenticated — mark that we've seen a real user
                hadUserRef.current = true;
            } else if (hadUserRef.current) {
                // We previously had a user and now we don't — this is a real logout
                hadUserRef.current = false;
                localStorage.removeItem(VIEW_MODE_KEY);
                setViewModeState('none');
            }
            // If hadUserRef.current is false and user is null — this is the cold-start null
            // that Firebase fires before resolving the persisted session. Ignore it.
        });
        return () => unsubscribe();
    }, [auth]);

    const setViewMode = (mode: ViewMode) => {
        setViewModeState(mode);
        if (mode === 'none') {
            localStorage.removeItem(VIEW_MODE_KEY);
        } else {
            localStorage.setItem(VIEW_MODE_KEY, mode);
        }
    };

    return (
        <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
            {children}
        </ViewModeContext.Provider>
    );
}

export function useViewMode() {
    const context = useContext(ViewModeContext);
    if (context === undefined) {
        throw new Error('useViewMode must be used within a ViewModeProvider');
    }
    return context;
}
