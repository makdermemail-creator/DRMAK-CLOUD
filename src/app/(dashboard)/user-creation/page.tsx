'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, useAuth, useUser, getSecondaryAuth } from '@/firebase';
import { doc, setDoc, deleteDoc, collection } from 'firebase/firestore';
import type { User, Doctor } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useSearch } from '@/context/SearchProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { Checkbox } from '@/components/ui/checkbox';
import { availableFeatures, FeatureCategory } from '@/lib/features';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { Shield, Settings, Users, Activity, LayoutDashboard, Share2, Sparkles, ShoppingBag, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

import { UserFormDialog } from '@/components/UserFormDialog';

}

export default function UserManagementPage() {
  const { user: userProfile, isUserLoading: isProfileLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { searchTerm } = useSearch();
  const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: users, isLoading } = useCollection<User>(usersQuery);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | undefined>(undefined);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);

  const filteredUsers = React.useMemo(() => {
    if (!users) return [];
    
    // First remove deleted/inactive ghosts (hardened)
    const activeOnes = users.filter(u => {
      const status = (u.status || '').trim().toLowerCase();
      return status !== 'deleted' && 
             u.isDeleted !== true && 
             u.active !== false;
    });

    const term = searchTerm.toLowerCase();
    if (!term) return activeOnes;
    
    return activeOnes.filter(u =>
      ((u.name || '').toLowerCase().includes(term)) ||
      ((u.email || '').toLowerCase().includes(term)) ||
      (u.role && u.role.toLowerCase().includes(term))
    );
  }, [users, searchTerm]);

  const handleAdd = () => {
    setSelectedUser(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!firestore || !userToDelete) return;
    
    try {
      const docRef = doc(firestore, 'users', userToDelete.id);
      await deleteDoc(docRef);
      
      toast({
        title: 'User Permanent Deletion Successful',
        description: `Reference ${userToDelete.id} and associated identity metadata have been purged from the master registry.`
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: 'Insufficient permissions or database error. Please verify administrative status.'
      });
    } finally {
      setUserToDelete(null);
    }
  }

  const handlePasswordReset = async (email: string) => {
    if (!auth) return;
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password Reset Sent',
        description: `A password reset link has been sent to ${email}.`
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send password reset email.'
      });
    }
  }

  const isMainAdmin = userProfile?.email === 'admin1@skinsmith.com' || userProfile?.isMainAdmin;
  const hasUserManagementAccess = isMainAdmin || userProfile?.featureAccess?.['userManagement'];

  if (isProfileLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!hasUserManagementAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h1 className="text-2xl font-bold text-destructive">Unauthorized Access</h1>
        <p>You do not have permission to manage user accounts.</p>
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Create, edit, and manage user accounts and roles.
              </CardDescription>
            </div>
            <Button size="sm" className="gap-1" onClick={handleAdd}>
              <PlusCircle className="h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="grid">
                        <span className="font-semibold">{user.name}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(user)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePasswordReset(user.email)}>Reset Password</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setUserToDelete(user)}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <UserFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} user={selectedUser} />

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user's record from Firestore. The authentication record will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


