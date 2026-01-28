'use client';

import * as React from 'react';
import type { User, Lead } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search, ExternalLink, Edit, Trash2, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSheetLeads } from '@/hooks/use-sheet-leads';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, getFirestore } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ManageUserLeadsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User | null;
    allLeads: Lead[];
    onAssign: (leadIds: string[]) => Promise<void>;
    onUnassign: (leadIds: string[]) => Promise<void>;
    sheetUrl?: string;
    allUsers?: User[];
}

export const ManageUserLeadsDialog = ({
    open,
    onOpenChange,
    user,
    allLeads,
    onAssign,
    onUnassign,
    sheetUrl,
    allUsers = []
}: ManageUserLeadsDialogProps) => {
    const [selectedLeads, setSelectedLeads] = React.useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [activeTab, setActiveTab] = React.useState('sheet');
    const [editingLead, setEditingLead] = React.useState<Lead | null>(null);
    const { toast } = useToast();

    // Fetch sheet leads if sheetUrl is provided
    const { leads: sheetLeads, isLoading: isSheetLoading } = useSheetLeads(sheetUrl || '', !!sheetUrl && open);

    React.useEffect(() => {
        if (open) {
            setSelectedLeads(new Set());
            setSearchTerm('');
            setEditingLead(null);
        }
    }, [open, activeTab]);

    if (!user) return null;

    const assignedLeads = allLeads.filter(l => l.assignedTo === user.id);
    const unassignedLeads = allLeads.filter(l => !l.assignedTo || l.assignedTo === 'unassigned');

    // Combine sheet leads with unassigned firestore leads, removing duplicates
    const combinedUnassigned = React.useMemo(() => {
        const firestoreUnassigned = unassignedLeads;
        const existingEmails = new Set(firestoreUnassigned.map(l => l.email?.toLowerCase()).filter(e => e));
        const existingPhones = new Set(firestoreUnassigned.map(l => l.phone).filter(p => p));

        const uniqueSheetLeads = sheetLeads.filter(sl =>
            !existingEmails.has(sl.email?.toLowerCase()) &&
            !existingPhones.has(sl.phone)
        );

        return [...firestoreUnassigned, ...uniqueSheetLeads];
    }, [unassignedLeads, sheetLeads]);

    const filterLeads = (leads: Lead[]) => {
        if (!searchTerm) return leads;
        const lower = searchTerm.toLowerCase();
        return leads.filter(l =>
            l.name?.toLowerCase().includes(lower) ||
            l.email?.toLowerCase().includes(lower) ||
            l.phone?.includes(lower) ||
            l.product?.toLowerCase().includes(lower)
        );
    };

    const currentList = activeTab === 'sheet' ? filterLeads(combinedUnassigned) : filterLeads(assignedLeads);

    const toggleSelection = (id: string) => {
        const next = new Set(selectedLeads);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedLeads(next);
    };

    const toggleAll = () => {
        if (selectedLeads.size === currentList.length) {
            setSelectedLeads(new Set());
        } else {
            setSelectedLeads(new Set(currentList.map(l => l.id)));
        }
    };

    const handleBulkAction = async () => {
        if (selectedLeads.size === 0) return;
        setIsProcessing(true);
        try {
            if (activeTab === 'sheet') {
                await onAssign(Array.from(selectedLeads));
            } else {
                await onUnassign(Array.from(selectedLeads));
            }
            setSelectedLeads(new Set());
            toast({ title: "Success", description: `${selectedLeads.size} lead(s) updated.` });
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Error", description: "Failed to update leads." });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleIndividualAssign = async (lead: Lead, targetUserId: string) => {
        const firestore = getFirestore();
        try {
            if ((lead as any).isOnlineOnly) {
                // Import to Firestore
                const newLead: Omit<Lead, 'id'> = {
                    name: lead.name,
                    email: lead.email,
                    phone: lead.phone,
                    product: lead.product || '',
                    status: lead.status,
                    source: 'Google Sheet (Imported)',
                    assignedTo: targetUserId,
                    createdAt: new Date().toISOString(),
                };
                await addDocumentNonBlocking(collection(firestore, 'leads'), newLead);
                toast({ title: "Lead Imported & Assigned", description: `Assigned to ${allUsers.find(u => u.id === targetUserId)?.name || 'user'}.` });
            } else {
                // Update existing
                const docRef = doc(firestore, 'leads', lead.id);
                await updateDocumentNonBlocking(docRef, { assignedTo: targetUserId });
                toast({ title: "Reassigned", description: "Lead updated successfully." });
            }
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to assign lead." });
        }
    };

    const handleDelete = async (lead: Lead) => {
        if ((lead as any).isOnlineOnly) {
            toast({ variant: "destructive", title: "Cannot Delete", description: "Online-only leads cannot be deleted. They exist only in the sheet." });
            return;
        }

        const firestore = getFirestore();
        try {
            const docRef = doc(firestore, 'leads', lead.id);
            await deleteDocumentNonBlocking(docRef);
            toast({ title: "Deleted", description: "Lead removed successfully." });
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete lead." });
        }
    };

    const handleEdit = async (lead: Lead, updates: Partial<Lead>) => {
        if ((lead as any).isOnlineOnly) {
            toast({ variant: "destructive", title: "Cannot Edit", description: "Online-only leads must be imported first. Assign them to import." });
            return;
        }

        const firestore = getFirestore();
        try {
            const docRef = doc(firestore, 'leads', lead.id);
            await updateDocumentNonBlocking(docRef, updates);
            toast({ title: "Updated", description: "Lead details saved." });
            setEditingLead(null);
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update lead." });
        }
    };

    const LeadRow = ({ lead }: { lead: Lead }) => {
        const isEditing = editingLead?.id === lead.id;
        const [editName, setEditName] = React.useState(lead.name);
        const [editEmail, setEditEmail] = React.useState(lead.email);
        const [editPhone, setEditPhone] = React.useState(lead.phone);
        const [editProduct, setEditProduct] = React.useState(lead.product || '');

        React.useEffect(() => {
            if (isEditing) {
                setEditName(lead.name);
                setEditEmail(lead.email);
                setEditPhone(lead.phone);
                setEditProduct(lead.product || '');
            }
        }, [isEditing, lead]);

        if (isEditing) {
            return (
                <div className="p-4 border rounded-lg bg-slate-50 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs">Name</Label>
                            <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8" />
                        </div>
                        <div>
                            <Label className="text-xs">Email</Label>
                            <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} className="h-8" />
                        </div>
                        <div>
                            <Label className="text-xs">Phone</Label>
                            <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="h-8" />
                        </div>
                        <div>
                            <Label className="text-xs">Product</Label>
                            <Input value={editProduct} onChange={e => setEditProduct(e.target.value)} className="h-8" />
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setEditingLead(null)}>Cancel</Button>
                        <Button size="sm" onClick={() => handleEdit(lead, {
                            name: editName,
                            email: editEmail,
                            phone: editPhone,
                            product: editProduct
                        })}>Save</Button>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <Checkbox
                    checked={selectedLeads.has(lead.id)}
                    onCheckedChange={() => toggleSelection(lead.id)}
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{lead.name}</p>
                        <Badge variant="secondary" className="text-[10px]">{lead.status}</Badge>
                        {(lead as any).isOnlineOnly && <Badge variant="outline" className="text-[10px]">Sheet</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="truncate">{lead.email}</span>
                        <span className="truncate">{lead.phone}</span>
                        {lead.product && <span className="truncate text-xs bg-slate-100 px-1 rounded">{lead.product}</span>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Select
                        value={lead.assignedTo || 'unassigned'}
                        onValueChange={(val) => handleIndividualAssign(lead, val)}
                    >
                        <SelectTrigger className="h-8 w-[130px]">
                            <SelectValue placeholder="Assign" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {allUsers.filter(u => u.role === 'Sales').map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {!(lead as any).isOnlineOnly && (
                        <>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingLead(lead)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleDelete(lead)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Manage Leads for {user.name}</DialogTitle>
                    <DialogDescription>
                        View sheet leads, assign them, or manage existing assignments.
                    </DialogDescription>
                </DialogHeader>

                {sheetUrl && (
                    <div className="flex items-center gap-2 px-6 py-2 bg-slate-50 text-xs text-muted-foreground border-y">
                        <span className="font-semibold">Active Sheet:</span>
                        <a href={sheetUrl} target="_blank" rel="noopener noreferrer" className="flex items-center hover:underline text-teal-600 truncate max-w-[400px]">
                            {sheetUrl} <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <TabsList>
                            <TabsTrigger value="sheet">Sheet Leads ({combinedUnassigned.length})</TabsTrigger>
                            <TabsTrigger value="assigned">Current Assignments ({assignedLeads.length})</TabsTrigger>
                        </TabsList>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search leads..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2 px-1">
                        <Checkbox
                            id="select-all"
                            checked={currentList.length > 0 && selectedLeads.size === currentList.length}
                            onCheckedChange={toggleAll}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                            Select All {searchTerm && '(Filtered)'}
                        </label>
                        <span className="ml-auto text-sm text-muted-foreground">
                            {selectedLeads.size} selected
                        </span>
                    </div>

                    <ScrollArea className="flex-1 border rounded-md">
                        <div className="p-4 space-y-2">
                            {isSheetLoading && activeTab === 'sheet' ? (
                                <div className="text-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                                </div>
                            ) : currentList.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No leads found in this category.
                                </div>
                            ) : (
                                currentList.map(lead => <LeadRow key={lead.id} lead={lead} />)
                            )}
                        </div>
                    </ScrollArea>
                </Tabs>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancel</Button>
                    <Button onClick={handleBulkAction} disabled={selectedLeads.size === 0 || isProcessing} variant={activeTab === 'assigned' ? "destructive" : "default"}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {activeTab === 'sheet' ? `Assign ${selectedLeads.size} to ${user.name}` : `Unassign ${selectedLeads.size} Leads`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
