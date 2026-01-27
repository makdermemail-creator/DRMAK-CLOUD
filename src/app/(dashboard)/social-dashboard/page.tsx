'use client';
import * as React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Badge
} from "@/components/ui/badge";
import {
    Progress
} from "@/components/ui/progress";
import {
    Checkbox
} from "@/components/ui/checkbox";
import {
    Button
} from "@/components/ui/button";
import {
    useCollection,
    useFirestore,
    useMemoFirebase,
    useUser
} from '@/firebase';
import {
    collection,
    query,
    where,
    limit
} from 'firebase/firestore';
import {
    format,
    startOfDay
} from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    ListTodo,
    Sparkles,
    Activity,
    Instagram,
    Video,
    Clock,
    ArrowUpRight,
    CalendarCheck,
    Share2,
    LineChart,
    Plus,
    Palette,
    ExternalLink,
    Users
} from 'lucide-react';
import type { DailyPosting, SocialReport, AdminTaskTemplate, DesignRequest, DesignerWork, User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase';
import { useAnalyticsData } from '@/hooks/use-analytics-data';
import Link from 'next/link';
import {
    orderBy,
    or
} from 'firebase/firestore';

export default function SocialDashboardPage() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    // Data Fetching
    const postQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        const today = startOfDay(new Date()).toISOString();
        return query(collection(firestore, 'dailyPostings'), where('userId', '==', user.id), where('postedAt', '>=', today));
    }, [firestore, user]);

    const reportQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        const today = startOfDay(new Date()).toISOString();
        return query(collection(firestore, 'socialReports'), where('userId', '==', user.id), where('reportDate', '>=', today));
    }, [firestore, user]);

    const tasksQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        query(
            collection(firestore, 'adminTaskTemplates'),
            where('category', '==', 'Social Media'),
            limit(10)
        )
        // Note: Removed OR filter due to QueryConstraintType incompatibility. 
        // In a real app, you might need to combine results or fix the SDK usage.
    }, [firestore, user]);

    const designersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('role', '==', 'Designer'));
    }, [firestore]);

    const { data: todayPosts, isLoading: postsLoading } = useCollection<DailyPosting>(postQuery);
    const { data: todayReports, isLoading: reportsLoading } = useCollection<SocialReport>(reportQuery);
    const { data: adminTasks, isLoading: tasksLoading } = useCollection<AdminTaskTemplate>(tasksQuery);
    const { data: designersList } = useCollection<User>(designersQuery);

    // Design Requests Query
    const requestsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'designRequests'), where('requesterId', '==', user.id), orderBy('createdAt', 'desc'), limit(10));
    }, [firestore, user]);

    const { data: designRequests, isLoading: requestsLoading } = useCollection<DesignRequest>(requestsQuery);
    const { summaryMetrics, isLoading: analyticsLoading } = useAnalyticsData();

    const { toast } = useToast();

    // Design Request Form State
    const [isRequestModalOpen, setIsRequestModalOpen] = React.useState(false);
    const [requestTitle, setRequestTitle] = React.useState('');
    const [requestDesc, setRequestDesc] = React.useState('');
    const [requestType, setRequestType] = React.useState('Post Graphic');
    const [requestDeadline, setRequestDeadline] = React.useState('');
    const [assignedTo, setAssignedTo] = React.useState('');
    const [isRequesting, setIsRequesting] = React.useState(false);

    const handleRequestDesign = async () => {
        if (!requestTitle.trim() || !user || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a title.' });
            return;
        }

        setIsRequesting(true);
        try {
            const newRequest: Omit<DesignRequest, 'id'> = {
                requesterId: user.id,
                title: requestTitle,
                description: requestDesc,
                assetType: requestType as any,
                status: 'Pending',
                createdAt: new Date().toISOString(),
                deadline: requestDeadline || undefined,
                assignedTo: assignedTo || undefined
            };

            await addDocumentNonBlocking(collection(firestore, 'designRequests'), newRequest);
            toast({ title: 'Request Sent', description: 'The designer team has been notified.' });
            setIsRequestModalOpen(false);
            setRequestTitle('');
            setRequestDesc('');
            setAssignedTo('');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to send request.' });
        } finally {
            setIsRequesting(false);
        }
    };

    // Progress Logic
    const dailyGoals = { posts: 3, report: 1 };
    const postsDone = todayPosts?.length || 0;
    const reportsDone = todayReports?.length || 0;
    const totalGoal = dailyGoals.posts + dailyGoals.report;
    const currentDone = Math.min(postsDone, dailyGoals.posts) + Math.min(reportsDone, dailyGoals.report);
    const completionPercentage = (currentDone / totalGoal) * 100;

    if (isUserLoading || postsLoading || reportsLoading || tasksLoading || analyticsLoading) {
        return (
            <div className="flex h-[600px] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Social Media Hub</h1>
                    <p className="text-slate-500 font-medium">Monitoring your daily digital presence & task queue.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-purple-600 hover:bg-purple-700 font-bold border-none shadow-lg shadow-purple-200">
                                <Plus className="mr-2 h-4 w-4" />
                                Request Creative
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Palette className="h-5 w-5 text-purple-600" />
                                    New Design Request
                                </DialogTitle>
                                <DialogDescription>Brief the designer on what you need for your social campaign.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-slate-500">Asset Title</Label>
                                    <Input
                                        placeholder="e.g., Winter Sale Instagram Post"
                                        value={requestTitle}
                                        onChange={e => setRequestTitle(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-slate-500">Asset Type</Label>
                                        <Select value={requestType} onValueChange={setRequestType}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Post Graphic">Post Graphic</SelectItem>
                                                <SelectItem value="Story Design">Story Design</SelectItem>
                                                <SelectItem value="Youtube Thumbnail">Youtube Thumbnail</SelectItem>
                                                <SelectItem value="Reel Edit">Reel Edit</SelectItem>
                                                <SelectItem value="Banner">Banner</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-slate-500">Assign To</Label>
                                        <Select value={assignedTo} onValueChange={setAssignedTo}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Designer" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {designersList?.map(d => (
                                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                                ))}
                                                {designersList?.length === 0 && <SelectItem value="none" disabled>No designers active</SelectItem>}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-slate-500">Brief / Requirements</Label>
                                    <Textarea
                                        placeholder="Color codes, text to include, dimensions, etc."
                                        className="h-24"
                                        value={requestDesc}
                                        onChange={e => setRequestDesc(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-slate-500">Deadline (Optional)</Label>
                                    <Input type="date" value={requestDeadline} onChange={e => setRequestDeadline(e.target.value)} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsRequestModalOpen(false)}>Cancel</Button>
                                <Button
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                                    onClick={handleRequestDesign}
                                    disabled={isRequesting}
                                >
                                    {isRequesting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                    Send Brief to Designer
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" className="border-indigo-100 text-indigo-700 font-bold" asChild>
                        <Link href="/content-planner">
                            <CalendarCheck className="mr-2 h-4 w-4" />
                            Planner
                        </Link>
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold" asChild>
                        <Link href="/daily-posting">
                            <Share2 className="mr-2 h-4 w-4" />
                            New Post Log
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-indigo-100 shadow-sm rounded-2xl overflow-hidden relative">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Share2 className="h-3 w-3 text-indigo-500" />
                            Total Reach
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-indigo-700">{summaryMetrics.totalReach.toLocaleString()}</div>
                        <p className={`text-[10px] font-bold mt-1 ${summaryMetrics.reachChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {summaryMetrics.reachChange >= 0 ? '↑' : '↓'} {Math.abs(summaryMetrics.reachChange)}% vs last month
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-purple-100 shadow-sm rounded-2xl overflow-hidden relative">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Users className="h-3 w-3 text-purple-500" />
                            New Followers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-purple-700">+{summaryMetrics.newFollowers.toLocaleString()}</div>
                        <p className={`text-[10px] font-bold mt-1 ${summaryMetrics.followerChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {summaryMetrics.followerChange >= 0 ? '↑' : '↓'} {Math.abs(summaryMetrics.followerChange)}% growth
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-emerald-100 shadow-sm rounded-2xl overflow-hidden relative">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="h-3 w-3 text-emerald-500" />
                            Engagement Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-700">{summaryMetrics.engagementRate}%</div>
                        <p className={`text-[10px] font-bold mt-1 ${summaryMetrics.engagementChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {summaryMetrics.engagementChange >= 0 ? '↑' : '↓'} {Math.abs(summaryMetrics.engagementChange)}% change
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Header with Progress */}
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100 dark:from-indigo-950 dark:to-blue-950 dark:border-indigo-900 shadow-sm border-2 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Share2 className="h-32 w-32 text-indigo-600 rotate-12" />
                </div>
                <CardHeader>
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <CardTitle className="text-xl text-indigo-700 dark:text-indigo-300 font-black uppercase tracking-tight">Performance Target</CardTitle>
                            <CardDescription className="text-indigo-600/70 font-bold">Goal: {dailyGoals.posts} Posts & {dailyGoals.report} Day End Report</CardDescription>
                        </div>
                        <div className="text-right">
                            <span className="text-4xl font-black text-indigo-600">{Math.round(completionPercentage)}%</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="relative z-10">
                    <Progress value={completionPercentage} className="h-4 bg-white/50 dark:bg-indigo-900/50 mb-6 border border-indigo-100" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className={`h-3 w-3 rounded-full ${postsDone >= dailyGoals.posts ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                                <span className="text-sm font-bold text-slate-700">Platform Posts</span>
                            </div>
                            <span className="text-lg font-black text-indigo-700">{postsDone} / {dailyGoals.posts}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className={`h-3 w-3 rounded-full ${reportsDone >= dailyGoals.report ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                                <span className="text-sm font-bold text-slate-700">Day End Report</span>
                            </div>
                            <span className="text-lg font-black text-indigo-700">{reportsDone} / {dailyGoals.report}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Design Requests Tracking */}
                <Card className="lg:col-span-2 shadow-sm border-slate-200">
                    <CardHeader className="border-b bg-slate-50/50 py-4">
                        <CardTitle className="flex items-center gap-2 text-purple-800 text-base font-black uppercase tracking-tight">
                            <Palette className="h-5 w-5 text-purple-600" />
                            Requested Creatives
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/30">
                                    <TableHead className="font-bold text-slate-500 py-4 h-11">Asset</TableHead>
                                    <TableHead className="font-bold text-slate-500 h-11">Status</TableHead>
                                    <TableHead className="font-bold text-slate-500 h-11 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {designRequests?.map(req => (
                                    <TableRow key={req.id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <p className="font-bold text-slate-800 text-sm">{req.title}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{req.assetType}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`
                                                ${req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                                    req.status === 'Submitted' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                                                        'bg-slate-100 text-slate-600'} border-none font-bold text-[10px] h-5
                                            `}>
                                                {req.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {req.submissionUrl ? (
                                                <Button size="sm" variant="outline" className="h-7 text-[10px] font-black border-blue-200 text-blue-700 hover:bg-blue-50" asChild>
                                                    <a href={req.submissionUrl} target="_blank" rel="noopener noreferrer">
                                                        VIEW ASSET
                                                    </a>
                                                </Button>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-300 italic">Designing...</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {designRequests?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-slate-400 text-xs italic">
                                            No design requests yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Admin Tasks */}
                <Card className="lg:col-span-2 shadow-sm border-slate-200">
                    <CardHeader className="border-b bg-slate-50/50 py-4">
                        <CardTitle className="flex items-center gap-2 text-indigo-800 text-base font-black">
                            <ListTodo className="h-5 w-5 text-indigo-600" />
                            ASSIGNED BRIEFINGS
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {adminTasks?.map(t => (
                                <div key={t.id} className="flex items-center justify-between p-4 border-2 rounded-2xl hover:bg-indigo-50/50 transition-all group border-slate-50">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1">
                                            <Checkbox id={`task-${t.id}`} className="h-5 w-5 border-slate-300 data-[state=checked]:bg-indigo-600 rounded-md" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 leading-snug">{t.content}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <p className="text-[10px] text-zinc-500 flex items-center gap-1 font-bold bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                                                    <Clock className="h-3 w-3" />
                                                    Due Soon
                                                </p>
                                                <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">{format(new Date(t.createdAt), 'MMM dd')}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="border-indigo-100 text-indigo-600 font-black text-[10px] h-8 px-4 rounded-lg bg-indigo-50/50" asChild>
                                        <Link href="/daily-tasks">REVIEW</Link>
                                    </Button>
                                </div>
                            ))}
                            {adminTasks?.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <ListTodo className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <p className="text-sm text-slate-500 font-bold">No briefings assigned. You're efficient!</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Status Column */}
                <div className="space-y-6">
                    <Card className="shadow-sm border-slate-200 overflow-hidden rounded-2xl">
                        <CardHeader className="bg-slate-50/50 border-b py-4">
                            <CardTitle className="text-xs font-black flex items-center gap-2 text-slate-800 uppercase tracking-widest">
                                <Activity className="h-4 w-4 text-emerald-500" />
                                Recent Output
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {todayPosts?.slice(0, 4).map(post => (
                                    <div key={post.id} className="p-4 flex items-center gap-4 hover:bg-indigo-50/20 transition-colors">
                                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 border border-slate-200 group-hover:bg-white transition-colors">
                                            {post.platform === 'Instagram' ? <Instagram className="h-5 w-5 text-pink-600" /> : <Video className="h-5 w-5 text-indigo-600" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate">{post.description}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{post.platform}</p>
                                                <span className="text-slate-300">•</span>
                                                <p className="text-[10px] text-slate-500 font-bold">{format(new Date(post.postedAt), 'h:mm a')}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {todayPosts?.length === 0 && (
                                    <div className="p-12 text-center bg-slate-50/30">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3 text-slate-300">
                                            <Activity className="h-6 w-6" />
                                        </div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Awaiting Logs</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <div className="p-4 bg-slate-50/50 border-t">
                            <Button variant="ghost" className="w-full text-[10px] font-black uppercase text-indigo-600 tracking-widest hover:bg-indigo-50" asChild>
                                <Link href="/daily-posting" className="flex items-center justify-center gap-2">
                                    View Full History
                                    <ArrowUpRight className="h-3 w-3" />
                                </Link>
                            </Button>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-xl border-none rounded-2xl relative overflow-hidden group">
                        <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
                        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
                            <div className="h-14 w-14 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center mb-6 border border-white/30 rotate-3 group-hover:rotate-0 transition-transform">
                                <LineChart className="h-7 w-7 text-white" />
                            </div>
                            <h3 className="text-xl font-black mb-2 tracking-tight">Reach Insights</h3>
                            <p className="text-sm text-indigo-100/80 mb-8 max-w-[200px] leading-relaxed font-bold">Check how your content is performing across platforms.</p>
                            <Button className="w-full bg-white text-indigo-700 hover:bg-slate-50 font-black text-xs h-12 rounded-xl shadow-lg border-none" variant="secondary" asChild>
                                <Link href="/analytics/reach" className="flex items-center justify-center gap-2">
                                    OPEN ANALYTICS
                                    <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
