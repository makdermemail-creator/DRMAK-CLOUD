'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
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
import { MoreHorizontal, PlusCircle, Loader2, Search, Edit, Trash2, Printer, FileDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { differenceInDays, parseISO, format } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import type { PharmacyItem } from '@/lib/types';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSearch } from '@/context/SearchProvider';
import { DatePicker } from '@/components/DatePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PharmacyFormDialog = ({ open, onOpenChange, item, mode }: { open: boolean, onOpenChange: (open: boolean) => void, item?: PharmacyItem, mode: 'add' | 'edit' | 'stock' }) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [formData, setFormData] = React.useState<Partial<PharmacyItem>>({});
    const [stockChange, setStockChange] = React.useState(0);
    
    const isStockMode = mode === 'stock';

    React.useEffect(() => {
        if (open) {
            if (item) {
                setFormData(item);
                setStockChange(0);
            } else {
                setFormData({ expiryDate: format(new Date(), 'yyyy-MM-dd'), active: true });
            }
        }
    }, [item, open, mode]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? Number(value) : value }));
    };

    const handleSubmit = () => {
        if (!firestore) return;
        const collectionRef = collection(firestore, 'pharmacyItems');

        if (isStockMode && item?.id) {
            const newQuantity = (item.quantity || 0) + stockChange;
            updateDocumentNonBlocking(doc(collectionRef, item.id), { quantity: newQuantity });
            toast({ title: 'Stock Updated', description: `Stock for ${item.productName} is now ${newQuantity}.`});
        } else if (item?.id && mode === 'edit') { 
            updateDocumentNonBlocking(doc(collectionRef, item.id), formData);
            toast({ title: 'Product Updated', description: 'The product details have been saved.' });
        } else { // Add mode
            addDocumentNonBlocking(collectionRef, formData);
            toast({ title: 'Product Added', description: 'New product added to the pharmacy.' });
        }
        onOpenChange(false);
    };

    const getTitle = () => {
        if(isStockMode) return 'Update Stock';
        if(mode === 'edit') return 'Edit Product';
        return 'Add New Product';
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{getTitle()}</DialogTitle>
                    <DialogDescription>
                        {isStockMode ? `Current quantity: ${item?.quantity}` : 'Fill in the product details below.'}
                    </DialogDescription>
                </DialogHeader>

                {isStockMode ? (
                     <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="stockChange" className="text-right">Change Quantity</Label>
                            <Input id="stockChange" type="number" value={stockChange} onChange={(e) => setStockChange(Number(e.target.value))} className="col-span-3" placeholder="e.g., 10 or -5"/>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="productName">Product Name</Label>
                            <Input id="productName" value={formData.productName || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="genericName">Generic Name</Label>
                            <Input id="genericName" value={formData.genericName || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="barcode">Barcode</Label>
                            <Input id="barcode" value={formData.barcode || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Input id="category" value={formData.category || ''} onChange={handleChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="manufacturer">Manufacturer</Label>
                            <Input id="manufacturer" value={formData.manufacturer || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="supplier">Supplier</Label>
                            <Input id="supplier" value={formData.supplier || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="purchasePrice">Purchase Price (Rs)</Label>
                            <Input id="purchasePrice" type="number" value={formData.purchasePrice || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sellingPrice">Selling Price (Rs)</Label>
                            <Input id="sellingPrice" type="number" value={formData.sellingPrice || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input id="quantity" type="number" value={formData.quantity || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stockingUnit">Stocking Unit</Label>
                            <Input id="stockingUnit" type="number" value={formData.stockingUnit || ''} onChange={handleChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="conversionUnit">Conversion Unit</Label>
                            <Input id="conversionUnit" type="number" value={formData.conversionUnit || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expiryDate">Expiry Date</Label>
                            <Input id="expiryDate" type="date" value={formData.expiryDate || ''} onChange={handleChange} />
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button onClick={handleSubmit}>
                        {isStockMode ? 'Update Quantity' : (mode === 'edit' ? 'Save Changes' : 'Add Product')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function PharmacyItemsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { searchTerm, setSearchTerm } = useSearch();
    const pharmacyQuery = useMemoFirebase(() => firestore ? collection(firestore, 'pharmacyItems') : null, [firestore]);
    const { data: pharmacyItems, isLoading } = useCollection<PharmacyItem>(pharmacyQuery);

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [selectedItem, setSelectedItem] = React.useState<PharmacyItem | undefined>(undefined);
    const [formMode, setFormMode] = React.useState<'add' | 'edit' | 'stock'>('add');

    const filteredItems = React.useMemo(() => {
        if (!pharmacyItems) return [];
        const term = searchTerm.toLowerCase();
        if (!term) return pharmacyItems;
        return pharmacyItems.filter(item => 
            item.productName.toLowerCase().includes(term) ||
            (item.genericName && item.genericName.toLowerCase().includes(term)) ||
            (item.barcode && item.barcode.toLowerCase().includes(term)) ||
            item.category.toLowerCase().includes(term) ||
            item.supplier.toLowerCase().includes(term)
        );
      }, [pharmacyItems, searchTerm]);

    const handleOpenForm = (mode: 'add' | 'edit' | 'stock', item?: PharmacyItem) => {
        setFormMode(mode);
        setSelectedItem(item);
        setIsFormOpen(true);
    }
    
    const handleDelete = (itemId: string) => {
      if(!firestore) return;
      const docRef = doc(firestore, 'pharmacyItems', itemId);
      deleteDocumentNonBlocking(docRef);
      toast({
          variant: 'destructive',
          title: 'Product Deleted',
          description: "The product has been removed from the pharmacy."
      })
    }
    
    const handleStatusChange = (item: PharmacyItem, newStatus: boolean) => {
        if(!firestore) return;
        const docRef = doc(firestore, 'pharmacyItems', item.id);
        updateDocumentNonBlocking(docRef, { active: newStatus });
        toast({ title: 'Status Updated', description: `${item.productName} is now ${newStatus ? 'Active' : 'Inactive'}.` });
    }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Pharmacy Items</CardTitle>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <div className="flex flex-wrap gap-2">
                <DatePicker date={undefined} onDateChange={() => {}} />
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by Name..." className="pl-8 w-48" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <Select><SelectTrigger className="w-40"><SelectValue placeholder="Select Supplier" /></SelectTrigger><SelectContent></SelectContent></Select>
                <Select><SelectTrigger className="w-40"><SelectValue placeholder="Select Manufacturer" /></SelectTrigger><SelectContent></SelectContent></Select>
                <Select><SelectTrigger className="w-40"><SelectValue placeholder="Select Category" /></SelectTrigger><SelectContent></SelectContent></Select>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline"><FileDown className="mr-2 h-4 w-4" /> Excel</Button>
                <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
            </div>
        </div>
         <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <div className="flex flex-wrap gap-2">
                <Select><SelectTrigger className="w-40"><SelectValue placeholder="Select Stock(All Item)" /></SelectTrigger><SelectContent></SelectContent></Select>
                <Select><SelectTrigger className="w-40"><SelectValue placeholder="Select Stock Level" /></SelectTrigger><SelectContent></SelectContent></Select>
                <Select><SelectTrigger className="w-40"><SelectValue placeholder="Select Active/Inactive" /></SelectTrigger><SelectContent></SelectContent></Select>
                <Select><SelectTrigger className="w-40"><SelectValue placeholder="Select Rack" /></SelectTrigger><SelectContent></SelectContent></Select>
            </div>
             <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => toast({title: "Coming Soon"})}><PlusCircle className="mr-2 h-4 w-4" /> Add Multiple Items</Button>
                <Button size="sm" onClick={() => handleOpenForm('add')}><PlusCircle className="mr-2 h-4 w-4" /> Add New Item</Button>
                <Button size="sm" onClick={() => {
                    if (filteredItems.length > 0) handleOpenForm('stock', filteredItems[0])
                    else toast({variant: "destructive", title: "No Item Selected"})
                }}><PlusCircle className="mr-2 h-4 w-4" /> Add Stock</Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Generic Name</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Supplier(s)</TableHead>
              <TableHead>Stocking Unit</TableHead>
              <TableHead>Conversion Unit</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems?.map((item) => (
              <TableRow key={item.id} className="group">
                <TableCell>
                    <Switch
                        checked={item.active}
                        onCheckedChange={(newStatus) => handleStatusChange(item, newStatus)}
                    />
                </TableCell>
                <TableCell className="font-medium">{item.productName}</TableCell>
                <TableCell>{item.genericName}</TableCell>
                <TableCell>{item.barcode}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.manufacturer}</TableCell>
                <TableCell>{item.supplier}</TableCell>
                <TableCell>{item.stockingUnit}</TableCell>
                <TableCell>{item.conversionUnit}</TableCell>
                <TableCell className="text-right">Rs{item.sellingPrice.toLocaleString()}</TableCell>
                <TableCell>
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenForm('edit', item)}>
                             <Edit className="h-4 w-4"/>
                        </Button>
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
    <PharmacyFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} item={selectedItem} mode={formMode} />
    </>
  );
}
