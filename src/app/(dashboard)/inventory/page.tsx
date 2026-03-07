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
import { Plus, Pencil, Trash2, Boxes } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export interface PharmacyItem {
    id: string;
    name: string;
    sellingPrice: number;
    quantity: number;
}

export default function InventoryPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const pharmacyRef = useMemoFirebase(() => firestore ? collection(firestore, 'pharmacy') : null, [firestore]);
    const { data: inventoryItems, isLoading } = useCollection<PharmacyItem>(pharmacyRef);

    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<PharmacyItem | null>(null);

    // Form State
    const [name, setName] = React.useState('');
    const [price, setPrice] = React.useState<number | string>('');
    const [quantity, setQuantity] = React.useState<number | string>('');

    const handleOpenDialog = (item?: PharmacyItem) => {
        if (item) {
            setEditingItem(item);
            setName(item.name);
            setPrice(item.sellingPrice);
            setQuantity(item.quantity);
        } else {
            setEditingItem(null);
            setName('');
            setPrice('');
            setQuantity('');
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!name.trim() || price === '' || isNaN(Number(price)) || quantity === '' || isNaN(Number(quantity))) {
            toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please provide valid values for all fields.' });
            return;
        }

        if (!firestore) return;

        try {
            const numPrice = Number(price);
            const numQty = Number(quantity);

            if (editingItem) {
                updateDocumentNonBlocking(doc(firestore, 'pharmacy', editingItem.id), { name, sellingPrice: numPrice, quantity: numQty });
                toast({ title: 'Item Updated', description: 'The inventory item has been updated successfully.' });
            } else {
                addDocumentNonBlocking(collection(firestore, 'pharmacy'), { name, sellingPrice: numPrice, quantity: numQty, createdAt: new Date().toISOString() });
                toast({ title: 'Item Added', description: 'The new item has been added to inventory.' });
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Boxes className="h-6 w-6 text-primary" />
                        Inventory Management
                    </h2>
                    <p className="text-muted-foreground">Manage physical stock, pharmacy items, and material pricing.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
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
                                    <TableHead className="text-right">Selling Price (Rs)</TableHead>
                                    <TableHead className="text-right">Current Stock Qty</TableHead>
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading inventory...</TableCell>
                                    </TableRow>
                                ) : !inventoryItems || inventoryItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
                                            No items found in inventory. Click "Add Item" to create one.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    inventoryItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-right font-medium">{Number(item.sellingPrice).toLocaleString()} Rs</TableCell>
                                            <TableCell className="text-right">
                                                <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.quantity <= 0 ? 'bg-red-100 text-red-800' : item.quantity < 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                                    {item.quantity}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleOpenDialog(item)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(item.id)}>
                                                    <Trash2 className="h-4 w-4" />
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
                            <Label htmlFor="name">Item Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Vitamin C Serum, Painkillers..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="price">Selling Price (Rs)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    placeholder="0"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="quantity">Quantity in Stock</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    placeholder="0"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
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
