
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
import { useUser } from '@/firebase';
import type { SocialReport } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export default function SocialReportingPage() {
    const { toast } = useToast();
    const { user } = useUser();

    const [summary, setSummary] = React.useState('');
    const [metrics, setMetrics] = React.useState('');
    const [plans, setPlans] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [reports, setReports] = React.useState<SocialReport[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    // Mock loading and initial data
    React.useEffect(() => {
        setIsLoading(true);
        setTimeout(() => {
             setReports([
                {
                    id: uuidv4(),
                    userId: 'mock-media-user-123',
                    reportDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
                    summary: "Completed the Winter Skincare campaign graphics and scheduled posts for the week.",
                    metrics: "Engagement up 5% week-over-week. Reach increased by 2K followers.",
                    plans: "Begin planning for the Valentine's Day promotion. Coordinate with sales team for offer details."
                }
            ]);
            setIsLoading(false);
        }, 500);
    }, []);


    const handleReportSubmit = async () => {
        if (!user) {
            toast({ variant: "destructive", title: "Error", description: "Authentication error." });
            return;
        }
        if (!summary.trim() || !plans.trim() || !metrics.trim()) {
            toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all report fields." });
            return;
        }

        setIsSubmitting(true);
        const newReport: SocialReport = {
            id: uuidv4(),
            userId: user.id,
            reportDate: new Date().toISOString(),
            summary,
            metrics,
            plans,
        };

        // Mock submission
        setTimeout(() => {
            setReports(prev => [newReport, ...prev]);
            toast({ title: "Report Submitted", description: "Your social media report has been saved." });
            setSummary('');
            setMetrics('');
            setPlans('');
            setIsSubmitting(false);
        }, 500);
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-6 w-6"/>
                        Submit Social Media Report
                    </CardTitle>
                    <CardDescription>Submit your periodic report for management review.</CardDescription>
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports?.map(report => (
                                <TableRow key={report.id}>
                                    <TableCell className="font-medium whitespace-nowrap">{format(new Date(report.reportDate), 'MMM dd, yyyy')}</TableCell>
                                    <TableCell><p className="line-clamp-3">{report.summary}</p></TableCell>
                                    <TableCell><p className="line-clamp-3">{report.metrics}</p></TableCell>
                                    <TableCell><p className="line-clamp-3">{report.plans}</p></TableCell>
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
