'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import Header from '@/components/Header';
import Nav from '@/components/Nav';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { SearchProvider } from '@/context/SearchProvider';
import { cn } from '@/lib/utils';
import { useViewMode } from '@/context/ViewModeContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const SIDEBAR_KEY = 'sidebar_open';

  const [open, setOpen] = React.useState<boolean>(() => {
    // Read persisted preference on first render (SSR-safe)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SIDEBAR_KEY);
      if (stored !== null) return stored === 'true';
    }
    return true; // default open on desktop
  });

  // When isMobile resolves, force-close on mobile (always), force-open on desktop if no saved pref
  React.useEffect(() => {
    if (isMobile === undefined) return; // not resolved yet
    if (isMobile) {
      setOpen(false);
    } else {
      // On desktop, restore saved preference (or default open)
      const stored = localStorage.getItem(SIDEBAR_KEY);
      setOpen(stored !== null ? stored === 'true' : true);
    }
  }, [isMobile]);

  // Persist the user's toggle choice
  const handleSetOpen = React.useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setOpen(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (!isMobile) {
        localStorage.setItem(SIDEBAR_KEY, String(next));
      }
      return next;
    });
  }, [isMobile]);

  const { user, authUser, isUserLoading } = useUser();
  const { viewMode } = useViewMode();
  const router = useRouter();

  React.useEffect(() => {
    if (!isUserLoading && !authUser) {
      router.replace('/login');
    }
  }, [isUserLoading, authUser, router]);


  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


  const isMainAdmin = user?.email === 'admin1@skinsmith.com' || user?.isMainAdmin || user?.role === 'Admin' || user?.isAdmin || user?.role === 'Operations Manager';
  const showSidebar = !isMainAdmin || viewMode !== 'none';

  return (
    <SearchProvider>
      <SidebarProvider open={open} onOpenChange={handleSetOpen}>
        {showSidebar && (
          <Sidebar>
            <Nav />
          </Sidebar>
        )}
        <SidebarInset className="flex flex-col">
          {showSidebar && <Header />}
          <main className={cn("flex-1 overflow-y-auto p-4 md:p-6 lg:p-8", !showSidebar && "p-0")}>
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </SearchProvider>
  );
}
