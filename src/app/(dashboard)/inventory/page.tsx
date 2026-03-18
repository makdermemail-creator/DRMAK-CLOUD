'use client';

import * as React from 'react';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Boxes, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSearch } from '@/context/SearchProvider';
import { Supplier, SupplierProduct } from '@/lib/types';
import Link from 'next/link';

export interface PharmacyItem {
    id: string;
    name: string;
    sellingPrice: number;
    quantity: number;
    rack?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';
}

export default function InventoryPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { searchTerm, setSearchTerm } = useSearch();
    const [rackFilter, setRackFilter] = React.useState<string>('all');
    
    const suppliersRef = useMemoFirebase(() => firestore ? collection(firestore, 'suppliers') : null, [firestore]);
    const { data: suppliers, isLoading } = useCollection<Supplier>(suppliersRef);

    const inventoryItems = React.useMemo(() => {
        if (!suppliers) return [];
        const items: (SupplierProduct & { supplierName: string; supplierId: string })[] = [];
        suppliers.forEach(s => {
            s.products?.forEach(p => {
                items.push({ ...p, supplierName: s.name, supplierId: s.id });
            });
        });
        return items;
    }, [suppliers]);

    const filteredItems = React.useMemo(() => {
        if (!inventoryItems) return [];
        const term = searchTerm.toLowerCase().trim();
        return inventoryItems.filter(item => {
            const itemName = (item.name || '').toLowerCase();
            const itemRack = (item.rack || '').toLowerCase();
            const sName = (item.supplierName || '').toLowerCase();
            
            const matchesSearch = !term ||
                itemName.includes(term) ||
                itemRack.includes(term) ||
                sName.includes(term);
            const matchesRack = rackFilter === 'all' || item.rack === rackFilter;
            return matchesSearch && matchesRack;
        });
    }, [inventoryItems, searchTerm, rackFilter]);

    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<(SupplierProduct & { supplierId: string; supplierName: string }) | null>(null);

    // Form State (Simplified for quick updates)
    const [price, setPrice] = React.useState<number | string>('');
    const [sellingPrice, setSellingPrice] = React.useState<number | string>('');
    const [quantity, setQuantity] = React.useState<number | string>('');
    const [rack, setRack] = React.useState<string>('');

    const handleOpenDialog = (item: SupplierProduct & { supplierId: string; supplierName: string }) => {
        setEditingItem(item);
        setPrice(item.price);
        setSellingPrice(item.sellingPrice || 0);
        setQuantity(item.quantity);
        setRack(item.rack || '');
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (price === '' || isNaN(Number(price)) || quantity === '' || isNaN(Number(quantity))) {
            toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please provide valid values for all fields.' });
            return;
        }

        if (!firestore || !editingItem) return;

        try {
            const numPrice = Number(price);
            const numSellingPrice = Number(sellingPrice);
            const numQty = Number(quantity);

            const supplier = suppliers?.find(s => s.id === editingItem.supplierId);
            if (supplier && supplier.products) {
                const newProducts = supplier.products.map(p => {
                    if (p.id === editingItem.id) {
                        return { ...p, price: numPrice, sellingPrice: numSellingPrice, quantity: numQty, rack };
                    }
                    return p;
                });
                updateDocumentNonBlocking(doc(firestore, 'suppliers', supplier.id), { products: newProducts });
                toast({ title: 'Inventory Updated', description: 'Changes synced to supplier records.' });
            }
            setIsDialogOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    const handleDelete = (id: string) => {
        if (!firestore) return;
        if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
            deleteDocumentNonBlocking(doc(firestore, 'pharmacy', id));
            toast({ title: 'Item Deleted', description: 'The item has been removed from inventory.' });
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Boxes className="h-6 w-6 text-primary" />
                        Inventory Management
                    </h2>
                    <p className="text-muted-foreground">Manage physical stock, pharmacy items, and material pricing.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                    <div className="relative w-full md:w-60">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by name..."
                            className="pl-8 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={rackFilter} onValueChange={setRackFilter}>
                        <SelectTrigger className="w-36 shrink-0">
                            <SelectValue placeholder="All Racks" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Racks</SelectItem>
                            <SelectItem value="A">Rack A</SelectItem>
                            <SelectItem value="B">Rack B</SelectItem>
                            <SelectItem value="C">Rack C</SelectItem>
                            <SelectItem value="D">Rack D</SelectItem>
                            <SelectItem value="E">Rack E</SelectItem>
                            <SelectItem value="F">Rack F</SelectItem>
                            <SelectItem value="G">Rack G</SelectItem>
                            <SelectItem value="H">Rack H</SelectItem>
                            <SelectItem value="I">Rack I</SelectItem>
                        </SelectContent>
                    </Select>
                    <Link href="/supplier">
                        <Button className="shrink-0">
                            <Plus className="h-4 w-4 mr-2" /> Manage Suppliers
                        </Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Current Stock</CardTitle>
                    <CardDescription>A list of all pharmacy and physical items available for billing.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Item Name</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Rack</TableHead>
                                    <TableHead className="text-right">Cost (Rs)</TableHead>
                                    <TableHead className="text-right">Sale (Rs)</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading inventory...</TableCell>
                                    </TableRow>
                                ) : !filteredItems || filteredItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground italic">
                                            {searchTerm ? 'No items match your search.' : 'No items found. Add products in the Suppliers section.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredItems.map((item) => (
                                        <TableRow key={`${item.supplierId}_${item.id}`}>
                                            <TableCell className="font-medium">
                                                <div>
                                                    <div className="font-bold">{item.name}</div>
                                                    <div className="text-[10px] text-muted-foreground uppercase">{item.id}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs font-semibold text-primary">{item.supplierName}</div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-muted border uppercase tracking-wider">
                                                    {item.rack || '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-muted-foreground">{item.price.toLocaleString()} Rs</TableCell>
                                            <TableCell className="text-right font-black text-primary">{item.sellingPrice?.toLocaleString()} Rs</TableCell>
                                            <TableCell className="text-right">
                                                <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-black ${Number(item.quantity) <= (item.minThreshold || 0) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                    {item.quantity}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleOpenDialog(item)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Inventory Item' : 'Add New Item'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Item Name</Label>
                            <div className="p-2 bg-muted rounded font-bold text-sm text-muted-foreground">
                                {editingItem?.name} ({editingItem?.supplierName})
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="price">Cost Price (Rs)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="sellingPrice">Selling Price (Rs)</Label>
                                <Input
                                    id="sellingPrice"
                                    type="number"
                                    value={sellingPrice}
                                    onChange={(e) => setSellingPrice(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="quantity">Stock Quantity</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="rack">Rack Location</Label>
                                <Input
                                    id="rack"
                                    placeholder="e.g. A1, B4..."
                                    value={rack}
                                    onChange={(e) => setRack(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Item</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
