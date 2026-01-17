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
import { MoreHorizontal, PlusCircle, Loader2, Upload, Trash2, Filter } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import type { Lead, User } from '@/lib/types';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useSearch } from '@/context/SearchProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/firebase/auth/use-user';

const LeadFormDialog = ({ open, onOpenChange, lead, users }: { open: boolean, onOpenChange: (open: boolean) => void, lead?: Lead, users: User[] }) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [formData, setFormData] = React.useState<Partial<Lead>>({});

  React.useEffect(() => {
    if (open) {
      if (lead) {
        setFormData(lead);
      } else {
        setFormData({ status: 'New', source: 'Manual Entry' });
      }
    }
  }, [lead, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: keyof Lead, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!firestore) return;

    if (!formData.name || !formData.status) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Name and Status are required.' });
      return;
    }

    const collectionRef = collection(firestore, 'leads');

    if (lead?.id) {
      const docRef = doc(collectionRef, lead.id);
      updateDocumentNonBlocking(docRef, formData);
      toast({ title: "Lead Updated", description: "The lead's details have been updated." });
    } else {
      addDocumentNonBlocking(collectionRef, {
        ...formData,
        createdAt: new Date().toISOString(),
      });
      toast({ title: "Lead Added", description: "The new lead has been added." });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{lead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
          <DialogDescription>
            {lead ? "Update the lead's details below." : "Fill in the details for the new lead."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={formData.name || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" type="email" value={formData.email || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">Phone</Label>
            <Input id="phone" value={formData.phone || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">Status</Label>
            <Select onValueChange={(value) => handleSelectChange('status', value)} value={formData.status}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New Lead">New Lead</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Dead">Dead</SelectItem>
                <SelectItem value="Previous">Previous</SelectItem>
                <SelectItem value="Converted">Converted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="source" className="text-right">Source</Label>
            <Input id="source" value={formData.source || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="assignedTo" className="text-right">Assigned To</Label>
            <Select onValueChange={(value) => handleSelectChange('assignedTo', value)} value={formData.assignedTo}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Assign to user" />
              </SelectTrigger>
              <SelectContent>
                {users.filter(u => u.role === 'Sales').map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>{lead ? 'Save Changes' : 'Add Lead'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const ImportLeadsDialog = ({ open, onOpenChange, onLeadsImported }: { open: boolean, onOpenChange: (open: boolean) => void, onLeadsImported: () => void }) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [file, setFile] = React.useState<File | null>(null);
  const { user } = useUser();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file || !firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a file to import.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') return;

      // Basic CSV parsing
      const rows = text.split('\n').slice(1); // Skip header
      const leadsCollection = collection(firestore, 'leads');

      for (const row of rows) {
        const [name, email, phone] = row.split(',');
        if (name) {
          const newLead: Omit<Lead, 'id'> = {
            name: name.trim(),
            email: email?.trim() || '',
            phone: phone?.trim() || '',
            status: 'New',
            source: `CSV: ${file.name}`,
            assignedTo: user.id, // Assign to current user
            createdAt: new Date().toISOString(),
          };
          await addDocumentNonBlocking(leadsCollection, newLead);
        }
      }
      toast({ title: 'Import Successful', description: `${rows.length} leads have been imported.` });
      onLeadsImported();
      onOpenChange(false);
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Leads from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns: Name, Email, Phone. The first row should be headers.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input type="file" accept=".csv" onChange={handleFileChange} />
        </div>
        <DialogFooter>
          <Button onClick={handleImport} disabled={!file}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function LeadsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { searchTerm } = useSearch();

  const leadsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'leads') : null, [firestore]);
  const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);

  const { data: leads, isLoading: leadsLoading, forceRerender } = useCollection<Lead>(leadsQuery);
  const { data: users, isLoading: usersLoading } = useCollection<User>(usersQuery);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState<Lead | undefined>(undefined);

  const isLoading = leadsLoading || usersLoading;

  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const filteredLeads = React.useMemo(() => {
    if (!leads) return [];
    let result = leads;

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(l => l.status === statusFilter);
    }

    // Search Filter
    const term = searchTerm.toLowerCase();
    if (term) {
      result = result.filter(l =>
        l.name.toLowerCase().includes(term) ||
        l.email.toLowerCase().includes(term) ||
        l.status.toLowerCase().includes(term)
      );
    }
    return result;
  }, [leads, searchTerm, statusFilter]);

  const usersMap = React.useMemo(() => {
    if (!users) return new Map();
    return new Map(users.map(u => [u.id, u.name]));
  }, [users]);

  const handleAdd = () => {
    setSelectedLead(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setIsFormOpen(true);
  };

  const handleDelete = (leadId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'leads', leadId);
    deleteDocumentNonBlocking(docRef);
    toast({
      variant: 'destructive',
      title: 'Lead Deleted',
      description: "The lead record has been removed."
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Leads</CardTitle>
              <CardDescription>
                Manage your sales leads and track their progress.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setIsImportOpen(true)}>
                <Upload className="h-4 w-4" />
                Import from Sheet
              </Button>
              <Button size="sm" className="gap-1" onClick={handleAdd}>
                <PlusCircle className="h-4 w-4" />
                Add Lead
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <Tabs defaultValue="all" onValueChange={setStatusFilter}>
              <TabsList className="grid grid-cols-6 w-full max-w-2xl">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="New Lead">New</TabsTrigger>
                <TabsTrigger value="In Progress">In Progress</TabsTrigger>
                <TabsTrigger value="Dead">Dead</TabsTrigger>
                <TabsTrigger value="Previous">Previous</TabsTrigger>
                <TabsTrigger value="Converted">Converted</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads?.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">
                      {lead.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{lead.email}</span>
                        <span className="text-xs text-muted-foreground">{lead.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.status}</Badge>
                    </TableCell>
                    <TableCell>{lead.source}</TableCell>
                    <TableCell>{usersMap.get(lead.assignedTo) || 'Unassigned'}</TableCell>
                    <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleEdit(lead)}>Edit</DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">Delete</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the lead record.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(lead.id)}>Delete</AlertDialogAction>
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
          )}
        </CardContent>
      </Card>
      <LeadFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} lead={selectedLead} users={users || []} />
      <ImportLeadsDialog open={isImportOpen} onOpenChange={setIsImportOpen} onLeadsImported={forceRerender} />
    </>
  );
}
