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
import { Plus, Pencil, Trash2, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export interface Procedure {
    id: string;
    name: string;
    price: number;
}

export default function ProceduresPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const proceduresRef = useMemoFirebase(() => firestore ? collection(firestore, 'procedures') : null, [firestore]);
    const { data: procedures, isLoading } = useCollection<Procedure>(proceduresRef);

    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingProcedure, setEditingProcedure] = React.useState<Procedure | null>(null);

    // Form State
    const [name, setName] = React.useState('');
    const [price, setPrice] = React.useState<number | string>('');

    const handleOpenDialog = (procedure?: Procedure) => {
        if (procedure) {
            setEditingProcedure(procedure);
            setName(procedure.name);
            setPrice(procedure.price);
        } else {
            setEditingProcedure(null);
            setName('');
            setPrice('');
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!name.trim() || !price || isNaN(Number(price))) {
            toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please provide a valid name and price.' });
            return;
        }

        if (!firestore) return;

        try {
            const numPrice = Number(price);
            if (editingProcedure) {
                updateDocumentNonBlocking(doc(firestore, 'procedures', editingProcedure.id), { name, price: numPrice });
                toast({ title: 'Procedure Updated', description: 'The procedure has been updated successfully.' });
            } else {
                addDocumentNonBlocking(collection(firestore, 'procedures'), { name, price: numPrice, createdAt: new Date().toISOString() });
                toast({ title: 'Procedure Added', description: 'The new procedure has been created.' });
            }
            setIsDialogOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    const handleDelete = (id: string) => {
        if (!firestore) return;
        if (confirm('Are you sure you want to delete this procedure? This cannot be undone.')) {
            deleteDocumentNonBlocking(doc(firestore, 'procedures', id));
            toast({ title: 'Procedure Deleted', description: 'The procedure has been removed from the catalog.' });
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Activity className="h-6 w-6 text-primary" />
                        Procedures Management
                    </h2>
                    <p className="text-muted-foreground">Manage your clinic's catalog of medical procedures and their default pricing.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" /> Add Procedure
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Available Procedures</CardTitle>
                    <CardDescription>A list of all active procedures that can be billed to patients.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Procedure Name</TableHead>
                                    <TableHead className="text-right">Default Price (Rs)</TableHead>
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading procedures...</TableCell>
                                    </TableRow>
                                ) : !procedures || procedures.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">
                                            No procedures found. Click "Add Procedure" to create one.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    procedures.map((proc) => (
                                        <TableRow key={proc.id}>
                                            <TableCell className="font-medium">{proc.name}</TableCell>
                                            <TableCell className="text-right font-medium">{proc.price.toLocaleString()} Rs</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleOpenDialog(proc)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(proc.id)}>
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
                        <DialogTitle>{editingProcedure ? 'Edit Procedure' : 'Add New Procedure'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Procedure Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g., HydraFacial, Laser Therapy..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="price">Default Price (Rs)</Label>
                            <Input
                                id="price"
                                type="number"
                                placeholder="0"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Procedure</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
