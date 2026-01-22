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
    ListTodo,
    Sparkles,
    Activity,
    Instagram,
    Video,
    Clock,
    ArrowUpRight,
    CalendarCheck,
    Share2,
    LineChart
} from 'lucide-react';
import type { DailyPosting, SocialReport, AdminTaskTemplate } from '@/lib/types';
import { Loader2 } from 'lucide-react';

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
        return query(collection(firestore, 'adminTaskTemplates'), where('category', '==', 'Social Media'), limit(5));
    }, [firestore, user]);

    const { data: todayPosts, isLoading: postsLoading } = useCollection<DailyPosting>(postQuery);
    const { data: todayReports, isLoading: reportsLoading } = useCollection<SocialReport>(reportQuery);
    const { data: adminTasks, isLoading: tasksLoading } = useCollection<AdminTaskTemplate>(tasksQuery);

    // Progress Logic
    const dailyGoals = { posts: 3, report: 1 };
    const postsDone = todayPosts?.length || 0;
    const reportsDone = todayReports?.length || 0;
    const totalGoal = dailyGoals.posts + dailyGoals.report;
    const currentDone = Math.min(postsDone, dailyGoals.posts) + Math.min(reportsDone, dailyGoals.report);
    const completionPercentage = (currentDone / totalGoal) * 100;

    if (isUserLoading || postsLoading || reportsLoading || tasksLoading) {
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
                    <Button variant="outline" className="border-indigo-100 text-indigo-700 font-bold" asChild>
                        <a href="/content-planner">
                            <CalendarCheck className="mr-2 h-4 w-4" />
                            Planner
                        </a>
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold" asChild>
                        <a href="/daily-posting">
                            <Share2 className="mr-2 h-4 w-4" />
                            New Post Log
                        </a>
                    </Button>
                </div>
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
                                        <a href="/daily-tasks">REVIEW</a>
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
                                <a href="/daily-posting" className="flex items-center justify-center gap-2">
                                    View Full History
                                    <ArrowUpRight className="h-3 w-3" />
                                </a>
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
                                <a href="/analytics/reach" className="flex items-center justify-center gap-2">
                                    OPEN ANALYTICS
                                    <ArrowUpRight className="h-4 w-4" />
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
