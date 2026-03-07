'use client';

import * as React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Truck,
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    Phone,
    Mail,
    MapPin,
    Building2,
    Users2,
    CheckCircle2,
    XCircle,
    Loader2,
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface Supplier {
    id: string;
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    category: string;  // e.g. 'Pharmaceutical', 'Medical Equipment', 'Cosmetics', etc.
    status: 'Active' | 'Inactive';
    notes: string;
    createdAt: string;
}

const SUPPLIER_CATEGORIES = [
    'Pharmaceutical',
    'Medical Equipment',
    'Cosmetics & Skincare',
    'Lab Supplies',
    'Office Supplies',
    'Other',
];

const emptyForm = (): Omit<Supplier, 'id' | 'createdAt'> => ({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    category: '',
    status: 'Active',
    notes: '',
});

export default function SupplierPage() {
    const { toast } = useToast();
    const firestore = useFirestore();

    const suppliersRef = useMemoFirebase(
        () => (firestore ? collection(firestore, 'suppliers') : null),
        [firestore]
    );

    const { data: suppliers, isLoading } = useCollection<Supplier>(suppliersRef);

    // Search & Filter
    const [search, setSearch] = React.useState('');
    const [filterCategory, setFilterCategory] = React.useState('all');
    const [filterStatus, setFilterStatus] = React.useState('all');

    // Dialog State
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editingSupplier, setEditingSupplier] = React.useState<Supplier | null>(null);
    const [formData, setFormData] = React.useState(emptyForm());
    const [isSaving, setIsSaving] = React.useState(false);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = React.useState<Supplier | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

    const filteredSuppliers = React.useMemo(() => {
        if (!suppliers) return [];
        return suppliers.filter(s => {
            const matchesSearch =
                !search ||
                s.name.toLowerCase().includes(search.toLowerCase()) ||
                s.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
                s.phone?.includes(search) ||
                s.city?.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = filterCategory === 'all' || s.category === filterCategory;
            const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [suppliers, search, filterCategory, filterStatus]);

    const stats = React.useMemo(() => {
        const total = suppliers?.length || 0;
        const active = suppliers?.filter(s => s.status === 'Active').length || 0;
        const categories = new Set(suppliers?.map(s => s.category).filter(Boolean)).size;
        return { total, active, inactive: total - active, categories };
    }, [suppliers]);

    const openAddDialog = () => {
        setEditingSupplier(null);
        setFormData(emptyForm());
        setDialogOpen(true);
    };

    const openEditDialog = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            contactPerson: supplier.contactPerson || '',
            phone: supplier.phone || '',
            email: supplier.email || '',
            address: supplier.address || '',
            city: supplier.city || '',
            category: supplier.category || '',
            status: supplier.status || 'Active',
            notes: supplier.notes || '',
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!firestore || !suppliersRef) return;
        if (!formData.name.trim()) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Supplier name is required.' });
            return;
        }
        setIsSaving(true);
        try {
            if (editingSupplier) {
                await updateDocumentNonBlocking(doc(firestore, 'suppliers', editingSupplier.id), formData);
                toast({ title: 'Supplier Updated', description: `${formData.name} has been updated.` });
            } else {
                await addDocumentNonBlocking(suppliersRef, {
                    ...formData,
                    createdAt: new Date().toISOString(),
                });
                toast({ title: 'Supplier Added', description: `${formData.name} has been added to Suppliers.` });
            }
            setDialogOpen(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!firestore || !deleteTarget) return;
        await deleteDocumentNonBlocking(doc(firestore, 'suppliers', deleteTarget.id));
        toast({ title: 'Supplier Deleted', description: `${deleteTarget.name} has been removed.` });
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-1">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Truck className="h-8 w-8 text-primary" />
                        Supplier Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage all clinic vendors and supply partners.
                    </p>
                </div>
                <Button onClick={openAddDialog} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Supplier
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
                        <Users2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Registered vendors</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                        <p className="text-xs text-muted-foreground">Currently active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-muted-foreground">{stats.inactive}</div>
                        <p className="text-xs text-muted-foreground">Paused or discontinued</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Categories</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.categories}</div>
                        <p className="text-xs text-muted-foreground">Distinct supply types</p>
                    </CardContent>
                </Card>
            </div>

            {/* Table Card */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Supplier Directory</CardTitle>
                            <CardDescription>
                                {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''} found
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-none">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search name, city, phone..."
                                    className="pl-9 w-full sm:w-56"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {SUPPLIER_CATEGORIES.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Contact Person</TableHead>
                                <TableHead>Contact Info</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSuppliers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <Truck className="h-8 w-8 opacity-30" />
                                            <p className="font-medium">No suppliers found</p>
                                            <p className="text-xs">Add your first supplier to get started.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSuppliers.map(supplier => (
                                    <TableRow key={supplier.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <Truck className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{supplier.name}</p>
                                                    {supplier.notes && (
                                                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-[180px]">{supplier.notes}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{supplier.contactPerson || '—'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-0.5">
                                                {supplier.phone && (
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Phone className="h-3 w-3" />
                                                        {supplier.phone}
                                                    </div>
                                                )}
                                                {supplier.email && (
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Mail className="h-3 w-3" />
                                                        {supplier.email}
                                                    </div>
                                                )}
                                                {!supplier.phone && !supplier.email && <span className="text-xs text-muted-foreground">—</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {supplier.city ? (
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {supplier.city}
                                                </div>
                                            ) : <span className="text-muted-foreground text-xs">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            {supplier.category ? (
                                                <Badge variant="secondary" className="text-xs font-medium">
                                                    {supplier.category}
                                                </Badge>
                                            ) : <span className="text-muted-foreground text-xs">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={supplier.status === 'Active' ? 'default' : 'outline'}
                                                className={supplier.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100' : 'text-muted-foreground'}
                                            >
                                                {supplier.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditDialog(supplier)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit Supplier
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600"
                                                        onClick={() => { setDeleteTarget(supplier); setDeleteDialogOpen(true); }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Supplier
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5 text-primary" />
                            {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingSupplier
                                ? `Update details for ${editingSupplier.name}.`
                                : 'Fill in the supplier details to add them to your directory.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2 space-y-1.5">
                                <Label htmlFor="sup-name">
                                    Supplier / Company Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="sup-name"
                                    placeholder="e.g., MedPlus Pharmaceuticals"
                                    value={formData.name}
                                    onChange={e => handleChange('name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="sup-contact">Contact Person</Label>
                                <Input
                                    id="sup-contact"
                                    placeholder="e.g., Ali Raza"
                                    value={formData.contactPerson}
                                    onChange={e => handleChange('contactPerson', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="sup-phone">Phone Number</Label>
                                <Input
                                    id="sup-phone"
                                    placeholder="e.g., +92 300 1234567"
                                    value={formData.phone}
                                    onChange={e => handleChange('phone', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="sup-email">Email Address</Label>
                                <Input
                                    id="sup-email"
                                    type="email"
                                    placeholder="e.g., supplier@medplus.com"
                                    value={formData.email}
                                    onChange={e => handleChange('email', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="sup-city">City</Label>
                                <Input
                                    id="sup-city"
                                    placeholder="e.g., Lahore"
                                    value={formData.city}
                                    onChange={e => handleChange('city', e.target.value)}
                                />
                            </div>
                            <div className="sm:col-span-2 space-y-1.5">
                                <Label htmlFor="sup-address">Full Address</Label>
                                <Input
                                    id="sup-address"
                                    placeholder="e.g., 42 Medical Complex, Gulberg III"
                                    value={formData.address}
                                    onChange={e => handleChange('address', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Category</Label>
                                <Select value={formData.category} onValueChange={v => handleChange('category', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SUPPLIER_CATEGORIES.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Status</Label>
                                <Select value={formData.status} onValueChange={v => handleChange('status', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="sm:col-span-2 space-y-1.5">
                                <Label htmlFor="sup-notes">Notes</Label>
                                <Textarea
                                    id="sup-notes"
                                    placeholder="e.g., Preferred supplier for skincare products. 30-day net payment terms."
                                    value={formData.notes}
                                    onChange={e => handleChange('notes', e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {editingSupplier ? 'Save Changes' : 'Add Supplier'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-5 w-5" />
                            Delete Supplier
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete{' '}
                            <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
