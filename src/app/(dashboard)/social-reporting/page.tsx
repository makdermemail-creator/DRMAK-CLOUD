
'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Send, Save, Edit3 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import type { SocialReport } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { collection, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';

export default function SocialReportingPage() {
    const { toast } = useToast();
    const { user } = useUser();

    const firestore = useFirestore();

    const [summary, setSummary] = React.useState('');
    const [metrics, setMetrics] = React.useState('');
    const [plans, setPlans] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [editingReport, setEditingReport] = React.useState<SocialReport | null>(null);

    // Filter reports by user
    const reportsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.id) return null;
        return query(collection(firestore, 'socialReports'), where('userId', '==', user.id), orderBy('reportDate', 'desc'));
    }, [firestore, user]);

    const { data: reports, isLoading } = useCollection<SocialReport>(reportsQuery);


    const handleReportSubmit = async () => {
        if (!firestore || !user) {
            toast({ variant: "destructive", title: "Error", description: "Authentication error." });
            return;
        }
        if (!summary.trim() || !plans.trim() || !metrics.trim()) {
            toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all report fields." });
            return;
        }

        setIsSubmitting(true);
        const reportData = {
            userId: user.id,
            reportDate: editingReport ? editingReport.reportDate : new Date().toISOString(),
            summary: summary.trim(),
            metrics: metrics.trim(),
            plans: plans.trim(),
        };

        try {
            if (editingReport) {
                await updateDoc(doc(firestore, 'socialReports', editingReport.id), reportData);
                toast({ title: "Report Updated", description: "Changes saved successfully." });
            } else {
                await addDocumentNonBlocking(collection(firestore, 'socialReports'), reportData);
                toast({ title: "Report Submitted", description: "Your social media report has been saved." });
            }
            
            setSummary('');
            setMetrics('');
            setPlans('');
            setEditingReport(null);
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to save report." });
        } finally {
            setIsSubmitting(false);
        }
    }

    const startEditing = (report: SocialReport) => {
        setEditingReport(report);
        setSummary(report.summary);
        setMetrics(report.metrics);
        setPlans(report.plans);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const cancelEditing = () => {
        setEditingReport(null);
        setSummary('');
        setMetrics('');
        setPlans('');
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-6 w-6"/>
                        {editingReport ? 'Edit Social Media Report' : 'Submit Social Media Report'}
                    </CardTitle>
                    <CardDescription>
                        {editingReport ? `Editing report from ${format(new Date(editingReport.reportDate), 'MMM dd, yyyy')}` : 'Submit your periodic report for management review.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="summary">Activity Summary</Label>
                            <Textarea id="summary" placeholder="Summarize your key activities for the period..." value={summary} onChange={(e) => setSummary(e.target.value)} rows={4}/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="metrics">Key Metrics & Highlights</Label>
                            <Textarea id="metrics" placeholder="Detail important metrics like engagement, reach, follower growth, and campaign highlights..." value={metrics} onChange={(e) => setMetrics(e.target.value)} rows={4}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="plans">Plans for Next Period</Label>
                            <Textarea id="plans" placeholder="Outline your main objectives and plans for the next reporting period..." value={plans} onChange={(e) => setPlans(e.target.value)} rows={4}/>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        {editingReport && (
                            <Button variant="ghost" onClick={cancelEditing}>
                                Cancel Edit
                            </Button>
                        )}
                        <Button onClick={handleReportSubmit} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (editingReport ? <Save className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />)}
                            {editingReport ? 'Update Report' : 'Submit Report'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>My Past Reports</CardTitle>
                    <CardDescription>A history of your submitted social media reports.</CardDescription>
                </CardHeader>
                <CardContent>
                     {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Summary</TableHead>
                                <TableHead>Metrics/Highlights</TableHead>
                                <TableHead>Next Plans</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports?.map(report => (
                                <TableRow key={report.id}>
                                    <TableCell className="font-medium whitespace-nowrap">{format(new Date(report.reportDate), 'MMM dd, yyyy')}</TableCell>
                                    <TableCell><p className="line-clamp-3 text-sm">{report.summary}</p></TableCell>
                                    <TableCell><p className="line-clamp-3 text-sm">{report.metrics}</p></TableCell>
                                    <TableCell><p className="line-clamp-3 text-sm">{report.plans}</p></TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => startEditing(report)} className="h-8 text-indigo-600 hover:text-indigo-700">
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {reports?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        You have not submitted any reports yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
