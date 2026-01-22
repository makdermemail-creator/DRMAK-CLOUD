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
import { format, startOfDay } from 'date-fns';
import { Loader2, Calendar as CalendarIcon, Plus, Info, Clock } from 'lucide-react';
import type { ScheduledPost } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const ContentPlannerPage = () => {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    // Data Fetching
    const postsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'scheduledPosts'), where('userId', '==', user.id), orderBy('scheduledAt', 'asc'));
    }, [firestore, user]);

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

    // Calendar Filtering Logic (Simple for now)
    const getPostsForDay = (day: number) => {
        if (!posts) return [];
        return posts.filter(p => {
            const d = new Date(p.scheduledAt);
            return d.getDate() === day && d.getMonth() === new Date().getMonth();
        });
    };

    const reminders = React.useMemo(() => {
        if (!posts) return [];
        const todayStr = startOfDay(new Date()).toDateString();
        return posts.filter(p => {
            const d = new Date(p.scheduledAt);
            return d.toDateString() === todayStr;
        });
    }, [posts]);

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Content Planner</h1>
                    <p className="text-muted-foreground">Plan and schedule your clinic's social media presence.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-teal-600 hover:bg-teal-700">
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
                            <Button onClick={handleCreatePost} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Schedule Post"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
                            <CalendarIcon className="h-5 w-5" />
                            Calendar Overview
                        </CardTitle>
                        <CardDescription>{format(new Date(), 'MMMM yyyy')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden border">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                <div key={day} className="bg-background p-2 text-center text-[10px] font-bold text-muted-foreground uppercase">{day}</div>
                            ))}
                            {Array.from({ length: 35 }).map((_, i) => {
                                const dayNum = i - 2;
                                const dayPosts = dayNum > 0 && dayNum <= 31 ? getPostsForDay(dayNum) : [];

                                return (
                                    <div key={i} className="bg-background p-1 h-20 sm:h-28 relative group hover:bg-muted/30 transition-colors border-t border-l first:border-l-0">
                                        <span className={`text-[10px] ${dayNum === new Date().getDate() ? 'bg-teal-600 text-white rounded-full w-5 h-5 flex items-center justify-center -m-1' : 'text-muted-foreground'}`}>
                                            {dayNum > 0 && dayNum <= 31 ? dayNum : ''}
                                        </span>
                                        <div className="mt-1 space-y-1 overflow-y-auto max-h-[80%] custom-scrollbar">
                                            {dayPosts.map(p => (
                                                <div key={p.id} className="p-1 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 rounded text-[9px] leading-tight font-medium border border-teal-100 dark:border-teal-800 truncate">
                                                    {p.platform.substring(0, 2)}: {p.title}
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
                    {/* Reminders/Alerts Widget */}
                    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-orange-700 dark:text-orange-400">
                                <Info className="h-4 w-4" />
                                Today's Reminders
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {reminders.length > 0 ? reminders.map(r => (
                                    <div key={r.id} className="flex gap-3 items-center p-2 bg-white dark:bg-background rounded-md shadow-sm border border-orange-100 dark:border-orange-800">
                                        <div className="h-8 w-8 rounded bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                                            <Clock className="h-4 w-4 text-orange-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold leading-none">{r.title}</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(r.scheduledAt), 'hh:mm a')} on {r.platform}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-[11px] text-muted-foreground text-center py-2">No posts scheduled for today.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-teal-600" />
                                Upcoming Queue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {posts?.slice(0, 5).map(post => (
                                    <div key={post.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-xs">{post.title}</span>
                                            <span className="text-[10px] text-muted-foreground">{post.platform} • {format(new Date(post.scheduledAt), 'MMM dd, hh:mm a')}</span>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] h-5">
                                            {post.status}
                                        </Badge>
                                    </div>
                                ))}
                                {(!posts || posts.length === 0) && <p className="text-xs text-muted-foreground text-center">Nothing queued.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ContentPlannerPage;
