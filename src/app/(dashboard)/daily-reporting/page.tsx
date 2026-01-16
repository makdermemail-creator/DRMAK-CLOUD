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
import { Loader2, FileText, Send } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, useUser } from '@/firebase';
import type { DailyReport } from '@/lib/types';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function DailyReportingPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user } = useUser();

    const [summary, setSummary] = React.useState('');
    const [plans, setPlans] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const reportsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.id) return null;
        return query(collection(firestore, 'dailyReports'), where('userId', '==', user.id), orderBy('reportDate', 'desc'));
    }, [firestore, user]);
    
    const { data: reports, isLoading, forceRerender } = useCollection<DailyReport>(reportsQuery);

    const handleReportSubmit = async () => {
        if (!firestore || !user) {
            toast({ variant: "destructive", title: "Error", description: "Authentication error." });
            return;
        }
        if (!summary.trim() || !plans.trim()) {
            toast({ variant: "destructive", title: "Missing Information", description: "Please fill out both summary and plans." });
            return;
        }

        setIsSubmitting(true);
        const report = {
            userId: user.id,
            reportDate: new Date().toISOString(),
            summary,
            plans,
        };

        try {
            await addDocumentNonBlocking(collection(firestore, 'dailyReports'), report);
            toast({ title: "Report Submitted", description: "Your daily report has been saved." });
            setSummary('');
            setPlans('');
            forceRerender();
        } catch (error) {
            console.error("Failed to submit report:", error);
            toast({ variant: "destructive", title: "Submission Failed", description: "Could not save your report." });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-6 w-6"/>
                        Submit Daily Report
                    </CardTitle>
                    <CardDescription>Submit your end-of-day report.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="summary">Today's Summary</Label>
                            <Textarea id="summary" placeholder="Summarize your key activities and achievements today..." value={summary} onChange={(e) => setSummary(e.target.value)} rows={5}/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="plans">Plans for Tomorrow</Label>
                            <Textarea id="plans" placeholder="Outline your main objectives and plans for tomorrow..." value={plans} onChange={(e) => setPlans(e.target.value)} rows={5}/>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleReportSubmit} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                            Submit Report
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>My Past Reports</CardTitle>
                    <CardDescription>A history of your submitted daily reports.</CardDescription>
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
                                <TableHead>Plans for Next Day</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports?.map(report => (
                                <TableRow key={report.id}>
                                    <TableCell className="font-medium whitespace-nowrap">{format(new Date(report.reportDate), 'MMM dd, yyyy')}</TableCell>
                                    <TableCell><p className="line-clamp-3">{report.summary}</p></TableCell>
                                    <TableCell><p className="line-clamp-3">{report.plans}</p></TableCell>
                                </TableRow>
                            ))}
                            {reports?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">
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
