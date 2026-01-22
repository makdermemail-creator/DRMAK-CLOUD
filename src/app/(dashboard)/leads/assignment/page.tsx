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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc } from 'firebase/firestore';
import { LinkIcon, Users, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User, SocialSettings, AdminTaskTemplate } from '@/lib/types';

export default function LeadAssignmentPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    // Data Fetching
    const { data: salesUsers } = useCollection<User>(
        useMemoFirebase(() => {
            if (!firestore) return null;
            return query(collection(firestore, 'users'), where('role', '==', 'Sales'));
        }, [firestore])
    );

    const { data: socialSettings } = useDoc<SocialSettings>(
        useMemoFirebase(() => {
            if (!firestore) return null;
            return doc(firestore, 'settings', 'socialMedia');
        }, [firestore])
    );

    const [sheetLink, setSheetLink] = React.useState('');
    const [selectedSales, setSelectedSales] = React.useState('');
    const [isSavingLink, setIsSavingLink] = React.useState(false);
    const [isAssigning, setIsAssigning] = React.useState(false);

    React.useEffect(() => {
        if (socialSettings?.googleSheetLink) setSheetLink(socialSettings.googleSheetLink);
    }, [socialSettings]);

    const handleSaveLink = async () => {
        if (!sheetLink.trim()) return;
        setIsSavingLink(true);
        try {
            await setDoc(doc(firestore, 'settings', 'socialMedia'), { googleSheetLink: sheetLink }, { merge: true });
            toast({ title: "Settings Saved", description: "Google Sheet link updated successfully." });
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to save link." });
        } finally {
            setIsSavingLink(false);
        }
    };

    const handleAssignLeads = async () => {
        if (!selectedSales || !sheetLink) {
            toast({ variant: "destructive", title: "Wait", description: "Select a sales executive and ensure sheet link is set." });
            return;
        }
        setIsAssigning(true);
        try {
            const assignmentTask: Omit<AdminTaskTemplate, 'id'> = {
                content: `High Priority: Assign leads from Google Sheet: ${sheetLink}`,
                category: 'Sales',
                assignedTo: selectedSales,
                createdAt: new Date().toISOString(),
                createdBy: user?.id || 'social-manager',
            };
            await addDocumentNonBlocking(collection(firestore, 'adminTaskTemplates'), assignmentTask);
            toast({ title: "Leads Assigned", description: "Sales executive has been notified via task." });
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to assign leads." });
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Lead Assignment</h1>
                <p className="text-muted-foreground">Manage lead sheets and assign them to your sales team.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LinkIcon className="h-5 w-5 text-teal-600" />
                            Google Lead Sheet
                        </CardTitle>
                        <CardDescription>Configure the central lead source.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Sheet URL</Label>
                            <Input value={sheetLink} onChange={e => setSheetLink(e.target.value)} placeholder="https://docs.google.com/spreadsheets/..." />
                        </div>
                        <div className="flex gap-2">
                            <Button className="flex-1" onClick={handleSaveLink} disabled={isSavingLink}>
                                {isSavingLink ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                                Save Link
                            </Button>
                            {sheetLink && (
                                <Button variant="outline" asChild>
                                    <a href={sheetLink} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-teal-700">
                            <Users className="h-5 w-5" />
                            Assign to Sales
                        </CardTitle>
                        <CardDescription>Notify sales team about new leads.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Select Sales Executive</Label>
                            <Select value={selectedSales} onValueChange={setSelectedSales}>
                                <SelectTrigger><SelectValue placeholder="Select a team member..." /></SelectTrigger>
                                <SelectContent>
                                    {salesUsers?.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name || s.email}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="w-full bg-teal-600 hover:bg-teal-700 font-bold" onClick={handleAssignLeads} disabled={isAssigning || !selectedSales}>
                            {isAssigning ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                            Assign Leads Now
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
