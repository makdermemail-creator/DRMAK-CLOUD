'use client';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { User, Lead, DailyPosting, DailyReport, DailyTask } from '@/lib/types';
import { LeadFormDialog } from '@/components/leads/LeadFormDialog';
import { collection, query, where, orderBy, limit, doc, getDoc, addDoc } from 'firebase/firestore';
import { Loader2, TrendingUp, Users, Video, FileText, RefreshCw, Upload, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, RadialBarChart, RadialBar } from 'recharts';
import { Checkbox } from '@/components/ui/checkbox';
import { updateDocumentNonBlocking } from '@/firebase';

export default function SalesDashboardPage() {
    const firestore = useFirestore();
    const { user, isUserLoading: userLoading } = useUser();
    const { toast } = useToast();
    const [isSyncing, setIsSyncing] = React.useState(false);
    const [sheetUrl, setSheetUrl] = React.useState<string | null>(null);
    const [mounted, setMounted] = React.useState(false);
    const [isAddLeadOpen, setIsAddLeadOpen] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const leadsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.id) return null;
        return query(collection(firestore, 'leads'), where('assignedTo', '==', user.id), orderBy('createdAt', 'desc'));
    }, [firestore, user]);

    const postingsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.id) return null;
        return query(collection(firestore, 'dailyPostings'), where('userId', '==', user.id), orderBy('postedAt', 'desc'));
    }, [firestore, user]);

    const reportsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.id) return null;
        return query(collection(firestore, 'dailyReports'), where('userId', '==', user.id), orderBy('reportDate', 'desc'), limit(7));
    }, [firestore, user]);

    const tasksQuery = useMemoFirebase(() => {
        if (!firestore || !user?.id) return null;
        return query(collection(firestore, 'dailyTasks'), where('userId', '==', user.id), where('status', '==', 'Pending'));
    }, [firestore, user]);

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'));
    }, [firestore]);

    const { data: leads, isLoading: leadsLoading } = useCollection<Lead>(leadsQuery);
    const { data: postings, isLoading: postingsLoading } = useCollection<DailyPosting>(postingsQuery);
    const { data: reports, isLoading: reportsLoading } = useCollection<DailyReport>(reportsQuery);
    const { data: tasks, isLoading: tasksLoading } = useCollection<DailyTask>(tasksQuery);
    const { data: usersList } = useCollection<User>(usersQuery);

    const stats = React.useMemo(() => {
        const totalLeads = leads?.length || 0;
        const convertedLeads = leads?.filter(l => l.status === 'Converted').length || 0;
        const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
        const totalPostings = postings?.length || 0;
        const reportsCount = reports?.length || 0;
        const pendingTasks = tasks?.length || 0;

        return { totalLeads, conversionRate, totalPostings, reportsCount, pendingTasks };
    }, [leads, postings, reports, tasks]);

    const chartData = React.useMemo(() => {
        if (!leads) return [];
        // Last 7 days activity (leads added)
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        return last7Days.map(date => ({
            date: date.split('-').slice(1).join('/'),
            leads: leads.filter(l => l.createdAt.startsWith(date)).length,
        }));
    }, [leads]);

    // Fetch settings
    React.useEffect(() => {
        if (!firestore) return;
        const fetchSettings = async () => {
            const settingsRef = doc(firestore, 'settings', 'sales');
            const snap = await getDoc(settingsRef);
            if (snap.exists() && snap.data().googleSheetUrl) {
                setSheetUrl(snap.data().googleSheetUrl);
            }
        };
        fetchSettings();
    }, [firestore]);

    const handleSync = async () => {
        if (!sheetUrl || !firestore || !user) {
            toast({ variant: 'destructive', title: 'Sync Error', description: 'Please configure your Google Sheet link in Leads settings first.' });
            return;
        }

        setIsSyncing(true);
        try {
            const sheetIdMatch = sheetUrl.match(/\/d\/(.*?)(\/|$)/);
            if (!sheetIdMatch) throw new Error("Invalid Google Sheet URL");
            const sheetId = sheetIdMatch[1];
            const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

            const response = await fetch(exportUrl);
            if (!response.ok) throw new Error("Failed to fetch sheet data");
            const text = await response.text();

            const rows = text.split('\n').slice(1);
            const leadsCollection = collection(firestore, 'leads');
            let count = 0;

            for (const row of rows) {
                const [name, email, phone] = row.split(',');
                if (name && name.trim()) {
                    await addDoc(leadsCollection, {
                        name: name.trim(),
                        email: email?.trim() || '',
                        phone: phone?.trim() || '',
                        status: 'New Lead',
                        source: 'Dashboard Sync',
                        assignedTo: user.id,
                        createdAt: new Date().toISOString(),
                    });
                    count++;
                }
            }
            toast({ title: 'Sync Successful', description: `${count} leads have been imported.` });
        } catch (error) {
            console.error("Sync error:", error);
            toast({ variant: 'destructive', title: 'Sync Failed', description: "Ensure the sheet is public/readable." });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleTaskStatusChange = (task: DailyTask, isCompleted: boolean) => {
        if (!firestore) return;
        const taskRef = doc(firestore, 'dailyTasks', task.id);
        updateDocumentNonBlocking(taskRef, { status: isCompleted ? 'Completed' : 'Pending' });
    };

    if (!mounted || userLoading || leadsLoading || postingsLoading || reportsLoading || tasksLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-8 text-center">
                <p className="text-muted-foreground">Please sign in to view your dashboard.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsAddLeadOpen(true)} className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Add Lead
                    </Button>
                    <Button onClick={handleSync} disabled={isSyncing || !sheetUrl} variant="outline" className="gap-2">
                        {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Sync from Sheet
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalLeads}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.conversionRate}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Postings</CardTitle>
                        <Video className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalPostings}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Daily Reports</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.reportsCount}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Conversion Progress</CardTitle>
                        <CardDescription>Leads converted to customers.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0 flex items-center justify-center min-h-[250px]">
                        <ResponsiveContainer width="100%" height={200}>
                            <RadialBarChart
                                cx="50%"
                                cy="50%"
                                innerRadius="70%"
                                outerRadius="100%"
                                barSize={20}
                                data={[{ name: 'Conversion', value: stats?.conversionRate || 0, fill: '#3b82f6' }]}
                                startAngle={90}
                                endAngle={90 + (3.6 * (stats?.conversionRate || 0))}
                            >
                                <RadialBar background dataKey="value" cornerRadius={10} />
                                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                                    {stats?.conversionRate}%
                                </text>
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Daily Remaining Tasks</CardTitle>
                        <CardDescription>Tasks you need to complete today.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto max-h-[250px]">
                        <div className="space-y-4">
                            {tasks?.map(task => (
                                <div key={task.id} className="flex items-start gap-2 border-b pb-2 last:border-0 last:pb-0">
                                    <Checkbox
                                        id={task.id}
                                        checked={task.status === 'Completed'}
                                        onCheckedChange={(checked) => handleTaskStatusChange(task, !!checked)}
                                    />
                                    <label htmlFor={task.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {task.task}
                                    </label>
                                </div>
                            ))}
                            {tasks?.length === 0 && <p className="text-center text-muted-foreground py-4">All caught up! 🎉</p>}
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex flex-col overflow-hidden">
                    <CardHeader>
                        <CardTitle>Recent Leads</CardTitle>
                        <CardDescription>Displaying your latest 5 leads.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto max-h-[250px]">
                        <div className="space-y-4">
                            {leads?.slice(0, 5).map(lead => (
                                <div key={lead.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium">{lead.name}</p>
                                        <p className="text-sm text-muted-foreground">{lead.status}</p>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(lead.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                            {leads?.length === 0 && <p className="text-center text-muted-foreground">No leads found.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lead Activity (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="leads" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <LeadFormDialog
                open={isAddLeadOpen}
                onOpenChange={setIsAddLeadOpen}
                users={usersList || []}
            />
        </div>
    );
}
