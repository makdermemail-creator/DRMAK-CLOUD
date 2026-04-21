'use client';

import * as React from 'react';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
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
    const [alternatives, setAlternatives] = React.useState<string[]>([]);
    const [altSearch, setAltSearch] = React.useState('');

    const handleOpenDialog = (item: SupplierProduct & { supplierId: string; supplierName: string }) => {
        setEditingItem(item);
        setPrice(item.price);
        setSellingPrice(item.sellingPrice || 0);
        setQuantity(item.quantity);
        setRack(item.rack || '');
        setAlternatives(item.alternatives || []);
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (price === '' || isNaN(Number(price)) || 
            sellingPrice === '' || isNaN(Number(sellingPrice)) || 
            quantity === '' || isNaN(Number(quantity))) {
            toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please provide valid numeric values for all price and quantity fields.' });
            return;
        }

        if (Number(sellingPrice) <= Number(price)) {
            toast({ 
                variant: 'destructive', 
                title: 'Pricing Error', 
                description: 'Sale price must be greater than cost price to maintain profit margins.' 
            });
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
                        return { ...p, price: numPrice, sellingPrice: numSellingPrice, quantity: numQty, rack, alternatives };
                    }
                    return p;
                });
                updateDocumentNonBlocking(doc(firestore, 'suppliers', supplier.id), { products: newProducts });
                
                // Sync to pharmacyItems for POS
                const pDocRef = doc(firestore, 'pharmacyItems', editingItem.id);
                setDocumentNonBlocking(pDocRef, {
                    productName: editingItem.name,
                    sellingPrice: numSellingPrice,
                    purchasePrice: numPrice,
                    quantity: numQty,
                    rack: rack,
                    supplier: supplier.name,
                    supplierId: supplier.id,
                    active: true
                }, { merge: true });

                toast({ title: 'Inventory Updated', description: 'Changes synced to supplier and POS records.' });
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
                                                    {item.alternatives && item.alternatives.length > 0 && (
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            {item.alternatives.map(altId => {
                                                                const alt = inventoryItems.find(i => i.id === altId);
                                                                return alt ? (
                                                                    <span key={altId} className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[8px] rounded font-bold uppercase">
                                                                        Alt: {alt.name}
                                                                    </span>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    )}
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
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-bold uppercase text-slate-400">Cost</span>
                                                    <span className="font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                                                        {item.price?.toLocaleString() || 0} Rs
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-bold uppercase text-slate-400">Sale</span>
                                                    <span className="font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100">
                                                        {item.sellingPrice?.toLocaleString() || 0} Rs
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {Number(item.quantity) <= 0 ? (
                                                    <span className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[10px] font-black bg-red-600 text-white animate-pulse">
                                                        OUT OF STOCK
                                                    </span>
                                                ) : Number(item.quantity) <= (item.minThreshold || 0) ? (
                                                    <span className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                                                        {item.quantity} Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                        {item.quantity} Available
                                                    </span>
                                                )}
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
                                <Select value={rack} onValueChange={setRack}>
                                    <SelectTrigger id="rack">
                                        <SelectValue placeholder="Select Rack" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map(r => (
                                            <SelectItem key={r} value={r}>Rack {r}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Alternatives Section */}
                        <div className="space-y-3 pt-4 border-t">
                            <Label className="text-sm font-bold flex items-center gap-2">
                                <Plus className="h-4 w-4" /> Product Alternatives
                            </Label>
                            
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Find alternative product..."
                                        className="pl-8 h-9 text-xs"
                                        value={altSearch}
                                        onChange={(e) => setAltSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            {altSearch && (
                                <div className="max-h-32 overflow-y-auto border rounded-md bg-muted/20 p-1 space-y-1">
                                    {inventoryItems
                                        .filter(i => 
                                            i.id !== editingItem?.id && 
                                            i.name.toLowerCase().includes(altSearch.toLowerCase()) &&
                                            !alternatives.includes(i.id)
                                        )
                                        .map(item => (
                                            <button
                                                key={item.id}
                                                className="w-full text-left px-2 py-1.5 text-xs hover:bg-background rounded flex items-center justify-between group"
                                                onClick={() => {
                                                    setAlternatives(prev => [...prev, item.id]);
                                                    setAltSearch('');
                                                }}
                                            >
                                                <span>{item.name} <span className="text-[10px] opacity-50">({item.supplierName})</span></span>
                                                <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                            </button>
                                        ))}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                {alternatives.map(altId => {
                                    const alt = inventoryItems.find(i => i.id === altId);
                                    return alt ? (
                                        <div key={altId} className="flex items-center gap-2 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-bold ring-1 ring-primary/20">
                                            {alt.name}
                                            <button 
                                                onClick={() => setAlternatives(prev => prev.filter(id => id !== altId))}
                                                className="hover:text-destructive transition-colors"
                                                title="Remove alternative"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : null;
                                })}
                                {alternatives.length === 0 && !altSearch && (
                                    <p className="text-xs text-muted-foreground italic">No alternatives set.</p>
                                )}
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
