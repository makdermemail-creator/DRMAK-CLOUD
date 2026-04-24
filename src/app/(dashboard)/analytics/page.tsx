'use client';
import { useAnalyticsData } from '@/hooks/use-analytics-data';
import { 
    Loader2, 
    AlertCircle, 
    TrendingUp, 
    Users, 
    Eye, 
    DollarSign, 
    ArrowUpRight, 
    ArrowDownRight, 
    Activity, 
    Share2, 
    Calendar,
    Download,
    Sparkles,
    BarChart3,
    ArrowRight
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    LineChart,
    Line,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
    const {
        isLoading,
        error,
        performanceData,
        followerGrowthData,
        revenueTrend,
        summaryMetrics
    } = useAnalyticsData();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] gap-6">
                <div className="relative">
                    <Loader2 className="h-16 w-16 animate-spin text-amber-500/20" />
                    <Loader2 className="h-16 w-16 animate-spin text-amber-500 absolute top-0 left-0 [animation-duration:1.5s]" />
                </div>
                <div className="space-y-2 text-center">
                    <h3 className="text-xl font-bold tracking-tight">Compiling Intelligence</h3>
                    <p className="text-muted-foreground animate-pulse text-sm">Aggregating financial, clinical, and social data streams...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] gap-6 text-center px-4">
                <div className="p-4 bg-destructive/10 rounded-full">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                </div>
                <div className="space-y-4 max-w-md">
                    <h3 className="text-2xl font-black tracking-tight">System Desync</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        The intelligence engine encountered an error while synchronizing with the data sources. 
                        Please verify your Google Sheet and Firestore configurations.
                    </p>
                    <div className="bg-muted p-3 rounded-lg text-xs font-mono text-left overflow-auto">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    const hasData = revenueTrend.length > 0 || performanceData.length > 0;

    if (!hasData) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] gap-8 text-center px-4">
                <div className="relative">
                    <div className="absolute -inset-4 bg-amber-500/10 blur-2xl rounded-full" />
                    <Sparkles className="h-16 w-16 text-amber-500/40 relative" />
                </div>
                <div className="space-y-3">
                    <h3 className="text-3xl font-black tracking-tighter">Unified Intelligence Ready</h3>
                    <p className="text-muted-foreground max-w-md text-sm">
                        Connect your operational and social data streams to begin monitoring your luxury growth trajectory.
                    </p>
                    <Button variant="outline" className="mt-4 rounded-full border-amber-500/20 hover:border-amber-500 hover:bg-amber-500/5">
                        Initialize Data Connectors
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* --- Executive Header --- */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/80">Live Performance Monitoring</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
                        Unified <span className="text-amber-500">Intelligence</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] opacity-70">SkinSmith Clinic Performance Dashboard</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 dark:bg-slate-900 rounded-full px-4 py-2 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">MTD: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                    </div>
                    <Button className="rounded-full bg-slate-900 dark:bg-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest px-6 h-11 hover:scale-105 transition-transform">
                        <Download className="mr-2 h-4 w-4" /> Export Audit
                    </Button>
                </div>
            </div>

            {/* --- Primary Growth Pillars --- */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <KPIBox 
                    title="Gross Revenue" 
                    value={`Rs ${(summaryMetrics.totalRevenue / 1000000).toFixed(1)}M`}
                    change={summaryMetrics.revenueChange}
                    icon={DollarSign}
                    color="amber"
                />
                <KPIBox 
                    title="Active Patients" 
                    value={summaryMetrics.newPatients.toLocaleString()}
                    change={summaryMetrics.patientChange}
                    icon={Users}
                    color="indigo"
                />
                <KPIBox 
                    title="Social Reach" 
                    value={(summaryMetrics.totalReach / 1000).toFixed(1) + 'K'}
                    change={summaryMetrics.reachChange}
                    icon={Eye}
                    color="emerald"
                />
                <KPIBox 
                    title="Avg Ticket" 
                    value={`Rs ${summaryMetrics.avgTicketSize.toLocaleString()}`}
                    change={5.2} // Placeholder for trend
                    icon={TrendingUp}
                    color="rose"
                />
            </div>

            {/* --- Main Intelligence Grid --- */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                
                {/* Revenue & Growth Trajectory */}
                <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200/50 dark:shadow-black/50 rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden">
                    <CardHeader className="p-8 pb-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-black tracking-tighter">Financial Trajectory</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Monthly Revenue vs Patient Acquisition</CardDescription>
                            </div>
                            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl">
                                <BarChart3 className="h-6 w-6 text-amber-500" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueTrend}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                                <XAxis 
                                    dataKey="name" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    fontWeight="black" 
                                    tick={{ fill: '#64748b' }} 
                                />
                                <YAxis 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    fontWeight="black" 
                                    tick={{ fill: '#64748b' }}
                                    tickFormatter={(v) => `Rs${v/1000}k`}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '24px', 
                                        border: 'none', 
                                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
                                        fontWeight: '800',
                                        fontSize: '12px'
                                    }} 
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#f59e0b" 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#colorRev)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Patient Conversion Funnel */}
                <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-black/50 rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
                    <CardHeader className="p-8">
                        <CardTitle className="text-xl font-black tracking-tighter text-amber-500">Patient Conversion</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">Monthly New Patient Volume</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '16px'}} />
                                <Bar dataKey="patients" fill="#f59e0b" radius={[8, 8, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400">Retention Rate</span>
                                <span className="text-xs font-black text-amber-500">84.2%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full w-[84.2%]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Social Reach Footprint */}
                <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-black/50 rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden">
                    <CardHeader className="p-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black tracking-tighter">Social Reach</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">Platform Engagement Mix</CardDescription>
                            </div>
                            <Share2 className="h-5 w-5 text-indigo-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={performanceData}>
                                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} fontWeight="black" tick={{ fill: '#64748b' }} />
                                <Tooltip />
                                <Line type="step" dataKey="reach" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} />
                                <Line type="step" dataKey="engagement" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                            </LineChart>
                        </ResponsiveContainer>
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Engagement</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">{summaryMetrics.engagementRate}%</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Followers</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">+{summaryMetrics.newFollowers}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Follower Expansion */}
                <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200/50 dark:shadow-black/50 rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden">
                    <CardHeader className="p-8 pb-0">
                        <CardTitle className="text-xl font-black tracking-tighter">Audience Expansion</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Follower Growth Projection</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={followerGrowthData}>
                                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} fontWeight="black" tick={{ fill: '#64748b' }} />
                                <YAxis fontSize={10} tickLine={false} axisLine={false} fontWeight="black" tick={{ fill: '#64748b' }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="followers" stroke="#f59e0b" strokeWidth={5} dot={{ r: 6, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function KPIBox({ title, value, change, icon: Icon, color }: { title: string, value: string, change: number, icon: any, color: 'amber' | 'indigo' | 'emerald' | 'rose' }) {
    const colorMap = {
        amber: 'bg-amber-600 text-amber-600 shadow-amber-100',
        indigo: 'bg-indigo-600 text-indigo-600 shadow-indigo-100',
        emerald: 'bg-emerald-600 text-emerald-600 shadow-emerald-100',
        rose: 'bg-rose-600 text-rose-600 shadow-rose-100',
    };

    return (
        <Card className="border-none shadow-xl shadow-slate-200/40 dark:shadow-black/20 rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all duration-500 bg-white dark:bg-slate-900">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className={cn("p-3 rounded-2xl shadow-lg bg-opacity-10", colorMap[color].split(' ')[0], colorMap[color].split(' ')[1])}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <Badge className={cn(
                        "rounded-full px-2.5 py-1 font-black text-[9px] uppercase border-none",
                        change >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                        {change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1 inline" /> : <ArrowDownRight className="h-3 w-3 mr-1 inline" />}
                        {Math.abs(change)}%
                    </Badge>
                </div>
                <div className="space-y-1">
                    <h3 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">{value}</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between group-hover:text-amber-500 transition-colors">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Deep Analysis</span>
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                </div>
            </CardContent>
        </Card>
    );
}

