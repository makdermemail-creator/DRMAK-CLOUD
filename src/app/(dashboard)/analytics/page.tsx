'use client';
import { useAnalyticsData } from '@/hooks/use-analytics-data';
import { Loader2, AlertCircle, LineChart as LucideLineChart, Users, Eye, TrendingUp, Download } from 'lucide-react';
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
    LineChart,
    Line,
} from 'recharts';
import { Button } from '@/components/ui/button';

export default function AnalyticsPage() {
    const {
        isLoading,
        error,
        performanceData,
        followerGrowthData,
        summaryMetrics
    } = useAnalyticsData();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Fetching real-time analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4 text-center px-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <div className="space-y-2">
                    <h3 className="text-xl font-bold">Failed to load analytics</h3>
                    <p className="text-muted-foreground max-w-md">{error}</p>
                    <p className="text-sm text-muted-foreground">Please check your Google Sheet configuration in Settings.</p>
                </div>
            </div>
        );
    }

    if (performanceData.length === 0 && followerGrowthData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4 text-center px-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <div className="space-y-2">
                    <h3 className="text-xl font-bold">No data found</h3>
                    <p className="text-muted-foreground">Configure your Google Sheet link in Settings to see real analytics.</p>
                </div>
            </div>
        );
    }
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Social Analytics</h1>
                    <p className="text-muted-foreground">Track your social media performance and audience growth.</p>
                </div>
                <Button className="gap-2">
                    <Download className="h-4 w-4" />
                    Export Report
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryMetrics.totalReach.toLocaleString()}</div>
                        <p className={`text-xs ${summaryMetrics.reachChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {summaryMetrics.reachChange >= 0 ? '+' : ''}{summaryMetrics.reachChange}% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Followers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{summaryMetrics.newFollowers.toLocaleString()}</div>
                        <p className={`text-xs ${summaryMetrics.followerChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {summaryMetrics.followerChange >= 0 ? '+' : ''}{summaryMetrics.followerChange}% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryMetrics.engagementRate}%</div>
                        <p className={`text-xs ${summaryMetrics.engagementChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {summaryMetrics.engagementChange >= 0 ? '+' : ''}{summaryMetrics.engagementChange}% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                        <LucideLineChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryMetrics.activeCampaigns}</div>
                        <p className="text-xs text-muted-foreground">Updated in real-time</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Reach vs Engagement</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                    <Tooltip />
                                    <Bar dataKey="reach" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="engagement" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Follower Growth</CardTitle>
                        <CardDescription>Audience expansion over the last 5 weeks.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={followerGrowthData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="followers" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
