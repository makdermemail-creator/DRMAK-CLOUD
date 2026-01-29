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
  const [open, setOpen] = React.useState(true);
  const isMobile = useIsMobile();
  const { user, isUserLoading } = useUser();
  const { viewMode } = useViewMode();
  const router = useRouter();

  React.useEffect(() => {
    if (isMobile) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [isMobile]);

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [isUserLoading, user, router]);


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
      <SidebarProvider open={open} onOpenChange={setOpen}>
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
