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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, useUser } from '@/firebase';
import { query, collection, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
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
} from 'date-fns';
import { Loader2, CalendarCheck, Plus, Clock, ChevronLeft, ChevronRight, Instagram, Facebook, Share2, Video, Youtube, Trash2, Edit3, CheckCircle2 } from 'lucide-react';
import type { ScheduledPost } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";

const PLATFORM_CONFIG = {
    Instagram: { icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100' },
    Facebook: { icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    TikTok: { icon: Video, color: 'text-slate-900', bg: 'bg-slate-50', border: 'border-slate-200' },
    WhatsApp: { icon: Share2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    YouTube: { icon: Youtube, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
    Other: { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100' },
};

export default function ContentPlannerUpgrade() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    // Calendar & Query States
    const [currentMonth, setCurrentMonth] = React.useState(new Date());
    
    // Data Fetching
    const postsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'scheduledPosts'),
            where('userId', '==', user.id)
        );
    }, [firestore, user]);

    const { data: rawPosts, isLoading } = useCollection<ScheduledPost>(postsQuery);

    // Sort client-side to avoid index requirement
    const posts = React.useMemo(() => {
        if (!rawPosts) return [];
        return [...rawPosts].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    }, [rawPosts]);

    // Form States
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingPost, setEditingPost] = React.useState<ScheduledPost | null>(null);
    const [title, setTitle] = React.useState('');
    const [platform, setPlatform] = React.useState('Instagram');
    const [selectedDay, setSelectedDay] = React.useState<Date | null>(null);
    const [time, setTime] = React.useState('12:00');
    const [description, setDescription] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleCreateOrUpdate = async () => {
        if (!title.trim() || !selectedDay || !firestore || !user) {
            toast({ variant: "destructive", title: "Wait", description: "Please enter a title and select a date." });
            return;
        }
        setIsSubmitting(true);
        try {
            const scheduledDatetime = new Date(selectedDay);
            const [hours, minutes] = time.split(':');
            scheduledDatetime.setHours(parseInt(hours), parseInt(minutes));

            const postData: Omit<ScheduledPost, 'id'> = {
                userId: user.id,
                title: title.trim(),
                platform: platform as any,
                scheduledAt: scheduledDatetime.toISOString(),
                status: editingPost ? editingPost.status : 'Scheduled',
                description: description.trim(),
            };

            if (editingPost) {
                await updateDoc(doc(firestore, 'scheduledPosts', editingPost.id), postData);
                toast({ title: "Updated", description: "Post details have been updated." });
            } else {
                await addDocumentNonBlocking(collection(firestore, 'scheduledPosts'), postData);
                toast({ title: "Scheduled", description: "Content added to your planner." });
            }
            
            closeDialog();
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to save post." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeletePost = async (id: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'scheduledPosts', id));
            toast({ title: "Deleted", description: "Content removed from planner." });
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete post." });
        }
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingPost(null);
        setTitle('');
        setDescription('');
        setTime('12:00');
        setSelectedDay(null);
    };

    const openCreateDialog = (day: Date) => {
        setSelectedDay(day);
        setEditingPost(null);
        setTitle('');
        setPlatform('Instagram');
        setTime('12:00');
        setDescription('');
        setIsDialogOpen(true);
    };

    const openEditDialog = (e: React.MouseEvent, post: ScheduledPost) => {
        e.stopPropagation();
        setEditingPost(post);
        setSelectedDay(new Date(post.scheduledAt));
        setTitle(post.title);
        setPlatform(post.platform);
        setTime(format(new Date(post.scheduledAt), 'HH:mm'));
        setDescription(post.description || '');
        setIsDialogOpen(true);
    };

    // Calendar Helpers
    const days = React.useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const getPostsForDay = (day: Date) => posts.filter(p => isSameDay(new Date(p.scheduledAt), day));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        );
    }

    const upcomingQueue = posts.filter(p => new Date(p.scheduledAt) >= new Date());

    return (
        <div className="space-y-6 p-1">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <CalendarCheck className="h-10 w-10 text-teal-600" />
                        Content Planner
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Plan, schedule, and track your clinic's social media presence.</p>
                </div>
                <div className="bg-teal-50 border border-teal-100 rounded-2xl px-5 py-3 text-center">
                    <p className="text-2xl font-black text-teal-700">{upcomingQueue.length}</p>
                    <p className="text-[10px] uppercase font-black text-teal-400 tracking-widest">Planned Posts</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* CALENDAR PART */}
                <Card className="lg:col-span-2 border-slate-200 shadow-sm overflow-hidden bg-white">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 py-4">
                        <div className="space-y-0.5">
                            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-800">
                                Calendar Overview
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold text-slate-400">CLICK A DAY TO SCHEDULE CONTENT</CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 hover:bg-white hover:shadow-sm"><ChevronLeft className="h-4 w-4" /></Button>
                            <span className="text-sm font-black min-w-[110px] text-center text-slate-700">{format(currentMonth, 'MMMM yyyy')}</span>
                            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 hover:bg-white hover:shadow-sm"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-7 gap-px bg-slate-200 border-b">
                            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                                <div key={day} className="bg-white p-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-px bg-slate-200">
                            {days.map((day, i) => {
                                const dayPosts = getPostsForDay(day);
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const isToday = isSameDay(day, new Date());

                                return (
                                    <div
                                        key={i}
                                        onClick={() => openCreateDialog(day)}
                                        className={cn(
                                            "bg-white p-1.5 h-32 relative cursor-pointer group hover:bg-teal-50/60 transition-colors",
                                            !isCurrentMonth && "bg-slate-50/50 text-slate-300"
                                        )}
                                    >
                                        <span className={cn(
                                            "text-[11px] font-black",
                                            isToday ? "bg-teal-600 text-white rounded-full w-5 h-5 flex items-center justify-center" : "text-slate-400"
                                        )}>
                                            {format(day, 'd')}
                                        </span>

                                        <div className="mt-1 space-y-0.5 overflow-hidden max-h-[75%]">
                                            {dayPosts.slice(0, 3).map(p => {
                                                const config = PLATFORM_CONFIG[p.platform as keyof typeof PLATFORM_CONFIG] || PLATFORM_CONFIG.Other;
                                                const Icon = config.icon;
                                                return (
                                                    <div
                                                        key={p.id}
                                                        onClick={(e) => openEditDialog(e, p)}
                                                        className={cn(
                                                            "px-1 py-0.5 rounded text-[8px] font-bold leading-tight truncate border flex items-center gap-1",
                                                            config.bg, config.color, config.border
                                                        )}
                                                    >
                                                        <Icon className="h-2 w-2" />
                                                        {p.title}
                                                    </div>
                                                );
                                            })}
                                            {dayPosts.length > 3 && (
                                                <p className="text-[8px] font-black text-teal-400 pl-1">+{dayPosts.length - 3} more</p>
                                            )}
                                        </div>

                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Plus className="h-3 w-3 text-teal-400" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* SIDEBAR */}
                <div className="space-y-6">
                    <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="pb-3 border-b bg-slate-50/50">
                            <CardTitle className="text-xs font-black flex items-center gap-2 text-slate-800 uppercase tracking-widest">
                                <Clock className="h-4 w-4 text-teal-600" />
                                Upcoming Queue
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                                {upcomingQueue.length > 0 ? upcomingQueue.map(post => {
                                    const config = PLATFORM_CONFIG[post.platform as keyof typeof PLATFORM_CONFIG] || PLATFORM_CONFIG.Other;
                                    const Icon = config.icon;
                                    return (
                                        <div
                                            key={post.id}
                                            onClick={(e) => openEditDialog(e, post)}
                                            className="flex items-start justify-between p-3 border border-slate-100 rounded-2xl hover:border-teal-200 hover:bg-teal-50/20 transition-all cursor-pointer group"
                                        >
                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <Icon className={cn("h-3 w-3", config.color)} />
                                                    <p className="font-black text-xs text-slate-800 truncate">{post.title}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                                                        {format(new Date(post.scheduledAt), 'MMM dd')} · {format(new Date(post.scheduledAt), 'hh:mm a')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeletePost(post.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-10 opacity-60">
                                        <CalendarCheck className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Nothing planned yet.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* LEGEND */}
                    <Card className="border-teal-100 bg-teal-50/30">
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className="text-[10px] font-black text-teal-700 uppercase tracking-widest">Platform Key</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 grid grid-cols-2 gap-2">
                            {Object.entries(PLATFORM_CONFIG).map(([name, cfg]) => {
                                const Icon = cfg.icon;
                                return (
                                    <div key={name} className="flex items-center gap-2">
                                        <div className={cn("p-1 rounded-md", cfg.bg)}>
                                            <Icon className={cn("h-3 w-3", cfg.color)} />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-600">{name}</span>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* CREATE/EDIT DIALOG */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-800 font-black text-xl">
                            {editingPost ? <Edit3 className="h-6 w-6 text-teal-600" /> : <Plus className="h-6 w-6 text-teal-600" />}
                            {editingPost ? 'Edit Post' : 'Schedule Content'}
                        </DialogTitle>
                        <DialogDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">
                            {selectedDay ? format(selectedDay, 'MMMM dd, yyyy') : ''}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Post Title</Label>
                            <Input
                                placeholder="e.g., Weekend Skincare Tips Carousel"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="h-12 rounded-2xl border-slate-200 focus:ring-teal-500 font-bold"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Platform</Label>
                                <Select value={platform} onValueChange={setPlatform}>
                                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(PLATFORM_CONFIG).map(plt => (
                                            <SelectItem key={plt} value={plt} className="font-bold">{plt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Time</Label>
                                <Input
                                    type="time"
                                    value={time}
                                    onChange={e => setTime(e.target.value)}
                                    className="h-12 rounded-2xl border-slate-200 font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Description (Internal Notes)</Label>
                            <Textarea
                                placeholder="Drafting details, hashtags, or designer instructions..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="rounded-2xl border-slate-200 resize-none h-24 font-medium"
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex flex-row justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                            {editingPost && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-rose-500 hover:bg-rose-50 rounded-xl"
                                    onClick={() => {
                                        handleDeletePost(editingPost.id);
                                        closeDialog();
                                    }}
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            )}
                            <Button variant="ghost" onClick={closeDialog} className="rounded-2xl font-black text-slate-400 hover:text-slate-600">Cancel</Button>
                        </div>
                        <Button
                            onClick={handleCreateOrUpdate}
                            disabled={isSubmitting}
                            className="bg-teal-600 hover:bg-teal-700 text-white rounded-2xl px-8 font-black shadow-lg shadow-teal-100 transition-all active:scale-95"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : (editingPost ? 'Update Post' : 'Schedule Content')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
