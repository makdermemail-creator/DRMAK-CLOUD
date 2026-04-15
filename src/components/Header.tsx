'use client';
import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  ChevronRight,
  User,
  LogOut,
  Bell,
  AlertTriangle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useUser, useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useSearch } from '@/context/SearchProvider';
import { signOut } from 'firebase/auth';
import { Supplier } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { collection } from 'firebase/firestore';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const Breadcrumbs = () => {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  // Don't show breadcrumbs on the root dashboard page
  if (segments.length === 0) {
    return (
      <div className="hidden items-center gap-2 text-sm font-medium md:flex">
        <span className="text-foreground">Dashboard</span>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 text-sm font-medium md:flex">
      <Link href="/">
        <span className={'text-muted-foreground hover:text-foreground'}>Dashboard</span>
      </Link>
      {segments.map((segment, index) => (
        <React.Fragment key={`${segment}-${index}`}>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Link href={`/${segments.slice(0, index + 1).join('/')}`}>
            <span
              className={
                index === segments.length - 1
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }
            >
              {capitalize(segment.replace(/-/g, ' '))}
            </span>
          </Link>
        </React.Fragment>
      ))}
    </div>
  );
};

export default function Header() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { searchTerm, setSearchTerm } = useSearch();

  const suppliersRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'suppliers') : null),
    [firestore]
  );
  const { data: suppliers } = useCollection<Supplier>(suppliersRef);

  const alerts = React.useMemo(() => {
    if (!suppliers) return [];
    const lowStockItems: { supplierName: string; productName: string; quantity: number; minThreshold: number }[] = [];
    
    suppliers.forEach(supplier => {
      supplier.products?.forEach(product => {
        if (product.quantity <= (product.minThreshold || 0) && product.minThreshold > 0) {
          lowStockItems.push({
            supplierName: supplier.name,
            productName: product.name,
            quantity: product.quantity,
            minThreshold: product.minThreshold
          });
        }
      });
    });
    return lowStockItems;
  }, [suppliers]);

  const displayName = user?.name || user?.email || 'User';
  const displayInitial = displayName?.charAt(0).toUpperCase() || 'U';

  const handleLogout = () => {
    signOut(auth);
    // The onAuthStateChanged listener will handle redirecting to /login
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <SidebarTrigger className="md:hidden" />

      <Breadcrumbs />

      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg bg-muted pl-8 md:w-[200px] lg:w-[320px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative group overflow-visible">
            <Bell className={cn(
              "h-5 w-5 transition-colors",
              alerts.length > 0 ? "text-red-500 animate-pulse" : "text-muted-foreground group-hover:text-foreground"
            )} />
            {alerts.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-[1rem] flex items-center justify-center p-0 text-[10px] bg-red-500 hover:bg-red-600 border-2 border-background font-black shadow-lg">
                {alerts.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 p-0 overflow-hidden" align="end">
          <DropdownMenuLabel className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm uppercase tracking-wider">Notifications</span>
              <Badge variant="outline" className="text-[10px] font-bold">{alerts.length} New</Badge>
            </div>
          </DropdownMenuLabel>
          <ScrollArea className="h-80">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">All products are within safety levels</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {alerts.map((alert, i) => (
                  <div key={i} className="flex gap-3 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-default">
                    <div className="mt-1 bg-red-100 dark:bg-red-950/50 p-2 rounded-full h-fit">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-tighter">Low Stock Alert</p>
                      <h4 className="text-sm font-bold leading-tight decoration-red-200 decoration-2 underline-offset-2">
                        {alert.productName}
                      </h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        From <span className="text-foreground font-semibold">{alert.supplierName}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] font-black h-5">
                          Qty: {alert.quantity}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-bold">Thresh: {alert.minThreshold}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="p-2 border-t bg-muted/10 text-center">
            <Link href="/supplier" className="text-[11px] font-black uppercase text-primary/60 hover:text-primary transition-colors tracking-widest">
              Manage Stock Levels
            </Link>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9 border border-primary/10">
              <AvatarImage src={user?.avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary/5 text-primary text-sm font-bold">
                {user?.icon || displayInitial}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex w-full items-center cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
