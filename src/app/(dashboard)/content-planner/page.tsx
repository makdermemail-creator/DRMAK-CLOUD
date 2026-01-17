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
import { Calendar as CalendarIcon, Plus, Info, Clock, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const scheduledPosts = [
    { id: 1, title: 'Winter Skincare Tips', platform: 'Instagram', time: 'Today, 5:00 PM', status: 'Scheduled' },
    { id: 2, title: 'Hydration Benefits', platform: 'Facebook', time: 'Tomorrow, 10:00 AM', status: 'Draft' },
    { id: 3, title: 'New Laser Treatment Reveal', platform: 'TikTok', time: 'Jan 20, 2:00 PM', status: 'Scheduled' },
    { id: 4, title: 'Client Transformation Story', platform: 'Instagram', time: 'Jan 22, 6:00 PM', status: 'Draft' },
];

export default function ContentPlannerPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Content Planner</h1>
                    <p className="text-muted-foreground">Plan and schedule your clinic's social media presence.</p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Post
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:row-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            Calendar Overview
                        </CardTitle>
                        <CardDescription>Visual timeline of upcoming posts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Simple Mock Calendar Grid */}
                        <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden border">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                <div key={day} className="bg-background p-2 text-center text-xs font-medium text-muted-foreground uppercase">{day}</div>
                            ))}
                            {Array.from({ length: 31 }).map((_, i) => (
                                <div key={i} className="bg-background p-2 h-24 relative hover:bg-muted/50 transition-colors">
                                    <span className="text-xs text-muted-foreground">{i + 1}</span>
                                    {i === 16 && (
                                        <div className="mt-1 p-1 bg-primary/10 text-primary rounded text-[10px] leading-tight font-medium border border-primary/20 truncate">
                                            IG: Winter Tips
                                        </div>
                                    )}
                                    {i === 17 && (
                                        <div className="mt-1 p-1 bg-blue-100 text-blue-700 rounded text-[10px] leading-tight font-medium border border-blue-200 truncate">
                                            FB: Hydration
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Upcoming Queue
                        </CardTitle>
                        <CardDescription>Next posts set to go live.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {scheduledPosts.map(post => (
                                <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm">{post.title}</span>
                                        <span className="text-xs text-muted-foreground">{post.platform} • {post.time}</span>
                                    </div>
                                    <Badge variant={post.status === 'Scheduled' ? 'default' : 'secondary'}>
                                        {post.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-primary" />
                            Campaign Goals
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Winter Skincare Campaign</span>
                                <span className="font-medium">85% Complete</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full">
                                <div className="h-2 bg-primary rounded-full" style={{ width: '85%' }}></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>Coordinated with "HydrateMe" promo codes.</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
