'use client';
import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  ChevronRight,
  User,
  LogOut,
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
import { useUser, useAuth } from '@/firebase';
import { useSearch } from '@/context/SearchProvider';
import { signOut } from 'firebase/auth';

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
        <React.Fragment key={segment}>
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
  const router = useRouter();
  const { searchTerm, setSearchTerm } = useSearch();

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
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatarUrl || undefined} alt={displayName} />
              <AvatarFallback>{displayInitial}</AvatarFallback>
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
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
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
