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
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, useAuth, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useSearch } from '@/context/SearchProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const UserFormDialog = ({ open, onOpenChange, user }: { open: boolean, onOpenChange: (open: boolean) => void, user?: User }) => {
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = React.useState<Partial<User>>({});
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) { // Reset form only when dialog opens
      if (user) {
        setFormData(user);
      } else {
        setFormData({});
      }
      setPassword('');
    }
  }, [user, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleRoleChange = (value: User['role']) => {
    setFormData(prev => ({ ...prev, role: value, isAdmin: value === 'Admin' }));
  }

  const handleSubmit = async () => {
    if (!firestore || !auth) return;
    if (!formData.email || !formData.role) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Email and Role are required.' });
      return;
    }

    setIsSubmitting(true);
    const collectionRef = collection(firestore, 'users');
    const isNowAdmin = formData.role === 'Admin';

    if (user?.id) {
      // NOTE: Updating user email/password in Auth requires re-authentication and is a complex flow.
      // For this version, we will only update the Firestore document data (like name and role).
      const docRef = doc(collectionRef, user.id);
      await updateDocumentNonBlocking(docRef, { name: formData.name, role: formData.role, isAdmin: isNowAdmin });
      toast({ title: "User Updated", description: "The user's details have been updated." });
      onOpenChange(false);
    } else {
      // Create a new user
      if (!password) {
        toast({ variant: 'destructive', title: 'Password required', description: 'Please set an initial password for the new user.' });
        setIsSubmitting(false);
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, password);
        const newUserId = userCredential.user.uid;

        const newUserDoc: User = {
          id: newUserId,
          name: formData.name || formData.email.split('@')[0],
          email: formData.email,
          role: formData.role,
          isAdmin: isNowAdmin,
          avatarUrl: formData.avatarUrl || `https://i.pravatar.cc/150?u=${newUserId}`, // Placeholder avatar
        };

        // Use setDoc with the new user's UID as the document ID
        await setDoc(doc(firestore, "users", newUserId), newUserDoc);

        toast({ title: "User Added", description: "The new user has been created." });
        onOpenChange(false);
      } catch (error: any) {
        console.error("Error creating user:", error);
        let description = "An unexpected error occurred.";
        if (error.code === 'auth/email-already-in-use') {
          description = "This email address is already in use by another account.";
        } else if (error.code === 'auth/weak-password') {
          description = "The password is too weak. It must be at least 6 characters long.";
        } else if (error.code === 'auth/invalid-email') {
          description = "The email address is not valid.";
        }
        toast({ variant: 'destructive', title: 'User Creation Failed', description });
      }
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {user ? "Update the user's details below." : "Fill in the details to add a new user."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Full Name</Label>
            <Input id="name" value={formData.name || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" type="email" value={formData.email || ''} onChange={handleChange} className="col-span-3" disabled={!!user} />
          </div>
          {!user && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">Password</Label>
              <Input id="password" type="password" placeholder={'Set an initial password'} className="col-span-3" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">Role</Label>
            <Select onValueChange={handleRoleChange} value={formData.role}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Doctor">Doctor</SelectItem>
                <SelectItem value="Receptionist">Receptionist</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Social Media Manager">Social Media Manager</SelectItem>
                <SelectItem value="Operations Manager">Operations Manager</SelectItem>
                <SelectItem value="Designer">Designer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {user ? 'Save Changes' : 'Add User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function UserManagementPage() {
  const { user: userProfile, isUserLoading: isProfileLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { searchTerm } = useSearch();
  const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: users, isLoading } = useCollection<User>(usersQuery);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | undefined>(undefined);

  const filteredUsers = React.useMemo(() => {
    if (!users) return [];
    const term = searchTerm.toLowerCase();
    if (!term) return users;
    return users.filter(u =>
      (u.name && u.name.toLowerCase().includes(term)) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
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

  const handleDelete = (userId: string) => {
    if (!firestore) return;
    // Note: This only deletes the Firestore document.
    // In a real app, you would also need to delete the user from Firebase Auth, which is a privileged operation.
    const docRef = doc(firestore, 'users', userId);
    deleteDocumentNonBlocking(docRef);
    toast({
      variant: 'destructive',
      title: 'User Deleted',
      description: "The user's record has been removed."
    })
  }

  const isMainAdmin = userProfile?.email === 'admin1@skinsmith.com' || userProfile?.isMainAdmin;

  if (isProfileLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isMainAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h1 className="text-2xl font-bold text-destructive">Unauthorized Access</h1>
        <p>Only the Main Admin can manage user accounts.</p>
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
                        <AvatarFallback>{user.name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
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
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">Delete</DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the user's record from Firestore. The authentication record will remain.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(user.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
    </>
  );
}


