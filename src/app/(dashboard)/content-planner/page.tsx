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
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/DatePicker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, useUser } from '@/firebase';
import { query, collection, where, orderBy } from 'firebase/firestore';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    startOfDay
} from 'date-fns';
import { Loader2, CalendarCheck, Plus, Info, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ScheduledPost } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";

const ContentPlannerPage = () => {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    // Calendar State
    const [currentMonth, setCurrentMonth] = React.useState(new Date());

    // Data Fetching
    const postsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        const start = startOfMonth(currentMonth).toISOString();
        const end = endOfMonth(currentMonth).toISOString();
        // Fetch posts for the current month view
        return query(
            collection(firestore, 'scheduledPosts'),
            where('userId', '==', user.id),
            orderBy('scheduledAt', 'asc')
        );
    }, [firestore, user, currentMonth]);

    const { data: posts, isLoading } = useCollection<ScheduledPost>(postsQuery);

    // Form States
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [title, setTitle] = React.useState('');
    const [platform, setPlatform] = React.useState('Instagram');
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [time, setTime] = React.useState('12:00');
    const [description, setDescription] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleCreatePost = async () => {
        if (!title || !date) {
            toast({ variant: "destructive", title: "Wait", description: "Please fill in the title and date." });
            return;
        }
        setIsSubmitting(true);
        try {
            const scheduledDatetime = new Date(date);
            const [hours, minutes] = time.split(':');
            scheduledDatetime.setHours(parseInt(hours), parseInt(minutes));

            const newPost: Omit<ScheduledPost, 'id'> = {
                userId: user?.id || '',
                title,
                platform: platform as any,
                scheduledAt: scheduledDatetime.toISOString(),
                status: 'Scheduled',
                description,
            };

            await addDocumentNonBlocking(collection(firestore, 'scheduledPosts'), newPost);
            toast({ title: "Post Scheduled", description: "Your content has been added to the calendar." });
            setIsDialogOpen(false);
            setTitle('');
            setDescription('');
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to schedule post." });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calendar Helper Functions
    const days = React.useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const getPostsForDay = (day: Date) => {
        if (!posts) return [];
        return posts.filter(p => isSameDay(new Date(p.scheduledAt), day));
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        );
    }

    const upcomingQueue = posts?.filter(p => new Date(p.scheduledAt) >= new Date()).slice(0, 5) || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Content Planner</h1>
                    <p className="text-muted-foreground">Plan and schedule your clinic's social media presence.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-teal-700 hover:bg-teal-800 text-white px-6">
                            <Plus className="h-4 w-4" />
                            Create Post
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Schedule New Content</DialogTitle>
                            <DialogDescription>Fill in the details for your upcoming social media post.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Platform</Label>
                                    <Select value={platform} onValueChange={setPlatform}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Instagram">Instagram</SelectItem>
                                            <SelectItem value="Facebook">Facebook</SelectItem>
                                            <SelectItem value="TikTok">TikTok</SelectItem>
                                            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                            <SelectItem value="YouTube">YouTube</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <DatePicker date={date} onDateChange={setDate} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Time</Label>
                                <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this post about?" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreatePost} disabled={isSubmitting} className="bg-teal-700 hover:bg-teal-800">
                                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Schedule Post"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 dark:bg-slate-900/50 py-4">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-teal-800 dark:text-teal-400">
                                <CalendarCheck className="h-5 w-5" />
                                Calendar Overview
                            </CardTitle>
                            <CardDescription>Visual timeline of upcoming posts.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
                            <span className="text-sm font-bold min-w-[100px] text-center">{format(currentMonth, 'MMMM yyyy')}</span>
                            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 border-b">
                            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                                <div key={day} className="bg-background p-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800">
                            {days.map((day, i) => {
                                const dayPosts = getPostsForDay(day);
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const isToday = isSameDay(day, new Date());

                                return (
                                    <div key={i} className={cn(
                                        "bg-background p-1 h-24 sm:h-32 relative group hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors",
                                        !isCurrentMonth && "bg-slate-50/50 dark:bg-slate-900/20 text-slate-400"
                                    )}>
                                        <span className={cn(
                                            "text-[10px] font-bold",
                                            isToday ? "bg-teal-600 text-white rounded-full w-5 h-5 flex items-center justify-center" : "text-slate-500"
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                        <div className="mt-1 space-y-1 overflow-y-auto max-h-[70%] custom-scrollbar">
                                            {dayPosts.map(p => (
                                                <div key={p.id} className="px-1 py-0.5 bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 rounded text-[9px] leading-tight font-semibold border border-teal-100 dark:border-teal-800/50 truncate flex items-center gap-1">
                                                    <span className="uppercase text-[7px] bg-teal-200 dark:bg-teal-800 px-0.5 rounded opacity-70">{p.platform.substring(0, 2)}</span>
                                                    {p.title}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                                <Clock className="h-4 w-4 text-teal-600" />
                                Upcoming Queue
                            </CardTitle>
                            <CardDescription className="text-[11px]">Next posts set to go live.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {upcomingQueue.length > 0 ? upcomingQueue.map(post => (
                                    <div key={post.id} className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-lg hover:border-teal-200 dark:hover:border-teal-900 transition-colors bg-slate-50/30 dark:bg-slate-900/30">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{post.title}</span>
                                            <span className="text-[10px] text-zinc-500 font-medium">{post.platform} • {isSameDay(new Date(post.scheduledAt), new Date()) ? 'Today' : format(new Date(post.scheduledAt), 'MMM dd')}, {format(new Date(post.scheduledAt), 'h:mm a')}</span>
                                        </div>
                                        <Badge className={cn(
                                            "text-[9px] h-5 px-2 font-bold",
                                            post.status === 'Scheduled' ? "bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-100" : "bg-slate-100 text-slate-800 border-slate-200"
                                        )}>
                                            {post.status}
                                        </Badge>
                                    </div>
                                )) : (
                                    <div className="text-center py-10">
                                        <div className="mx-auto w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-2">
                                            <CalendarCheck className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">Nothing queued for this month.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-orange-100 bg-orange-50/30 dark:bg-orange-950/10 dark:border-orange-900/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-orange-700 dark:text-orange-400">
                                <Info className="h-4 w-4" />
                                Planning Tips
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-[11px] text-orange-800/80 dark:text-orange-300/60 leading-relaxed">
                                Consistency is key! Aim to schedule at least 3 posts per week to keep your audience engaged. Use the "Quick Actions" to jump between tools.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ContentPlannerPage;
