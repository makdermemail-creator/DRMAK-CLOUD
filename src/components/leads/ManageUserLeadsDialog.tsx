'use client';

import * as React from 'react';
import type { User, Lead } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ManageUserLeadsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User | null;
    allLeads: Lead[];
    onAssign: (leadIds: string[]) => Promise<void>;
    onUnassign: (leadIds: string[]) => Promise<void>;
    sheetUrl?: string;
}

export const ManageUserLeadsDialog = ({
    open,
    onOpenChange,
    user,
    allLeads,
    onAssign,
    onUnassign,
    sheetUrl
}: ManageUserLeadsDialogProps) => {
    const [selectedLeads, setSelectedLeads] = React.useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');

    // Reset selection when dialog opens or tab changes
    const [activeTab, setActiveTab] = React.useState('unassigned');

    React.useEffect(() => {
        if (open) {
            setSelectedLeads(new Set());
            setSearchTerm('');
        }
    }, [open, activeTab]);

    if (!user) return null;

    const assignedLeads = allLeads.filter(l => l.assignedTo === user.id);
    const unassignedLeads = allLeads.filter(l => !l.assignedTo || l.assignedTo === 'unassigned');

    const filterLeads = (leads: Lead[]) => {
        if (!searchTerm) return leads;
        const lower = searchTerm.toLowerCase();
        return leads.filter(l =>
            l.name.toLowerCase().includes(lower) ||
            l.email.toLowerCase().includes(lower) ||
            l.phone.includes(lower) ||
            l.product?.toLowerCase().includes(lower)
        );
    };

    const currentList = activeTab === 'unassigned' ? filterLeads(unassignedLeads) : filterLeads(assignedLeads);

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

    const handleAction = async () => {
        if (selectedLeads.size === 0) return;
        setIsProcessing(true);
        try {
            if (activeTab === 'unassigned') {
                await onAssign(Array.from(selectedLeads));
            } else {
                await onUnassign(Array.from(selectedLeads));
            }
            onOpenChange(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Manage Leads for {user.name}</DialogTitle>
                    <DialogDescription>
                        Assign new leads or remove existing assignments for this sales executive.
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
                            <TabsTrigger value="unassigned">Assign New ({unassignedLeads.length})</TabsTrigger>
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
                            {currentList.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No leads found in this category.
                                </div>
                            ) : (
                                currentList.map(lead => (
                                    <div key={lead.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox
                                            checked={selectedLeads.has(lead.id)}
                                            onCheckedChange={() => toggleSelection(lead.id)}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium truncate">{lead.name}</p>
                                                <Badge variant="secondary" className="text-[10px]">{lead.status}</Badge>
                                                {(lead as any).isOnlineOnly && <Badge variant="outline" className="text-[10px]">Online Only</Badge>}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="truncate">{lead.email}</span>
                                                <span className="truncate">{lead.phone}</span>
                                                {lead.product && <span className="truncate text-xs bg-slate-100 px-1 rounded">{lead.product}</span>}
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                                            {lead.source}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </Tabs>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancel</Button>
                    <Button onClick={handleAction} disabled={selectedLeads.size === 0 || isProcessing} variant={activeTab === 'assigned' ? "destructive" : "default"}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {activeTab === 'unassigned' ? `Assign ${selectedLeads.size} Leads` : `Unassign ${selectedLeads.size} Leads`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
