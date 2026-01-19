'use client';
import * as React from 'react';
import { useFirestore } from '@/firebase/provider';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Lead, User } from '@/lib/types';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export const LeadFormDialog = ({ open, onOpenChange, lead, users, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, lead?: Lead, users: User[], onSuccess?: () => void }) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [formData, setFormData] = React.useState<Partial<Lead>>({});

    React.useEffect(() => {
        if (open) {
            if (lead) {
                setFormData(lead);
            } else {
                setFormData({ status: 'New Lead', source: 'Manual Entry' });
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
        if (onSuccess) onSuccess();
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
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="product" className="text-right">Product/Interest</Label>
                        <Input id="product" value={formData.product || ''} onChange={handleChange} className="col-span-3" placeholder="e.g. Skin Whitening, Hair Transplant" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>{lead ? 'Save Changes' : 'Add Lead'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
