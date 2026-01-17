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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Video, Send, Instagram, Facebook, Share2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, useUser } from '@/firebase';
import type { DailyPosting } from '@/lib/types';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function DailyPostingPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user } = useUser();

    const [platform, setPlatform] = React.useState<string>('Instagram');
    const [activityType, setActivityType] = React.useState<string>('Post');
    const [description, setDescription] = React.useState('');
    const [link, setLink] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const postingsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.id) return null;
        return query(collection(firestore, 'dailyPostings'), where('userId', '==', user.id), orderBy('postedAt', 'desc'));
    }, [firestore, user]);

    const { data: postings, isLoading, forceRerender } = useCollection<DailyPosting>(postingsQuery);

    const handleSubmit = async () => {
        if (!firestore || !user) return;
        if (!description.trim()) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a description.' });
            return;
        }

        setIsSubmitting(true);
        const posting: Omit<DailyPosting, 'id'> = {
            userId: user.id,
            platform: platform as any,
            activityType: activityType as any,
            description,
            link: link.trim() || undefined,
            postedAt: new Date().toISOString(),
        };

        try {
            await addDocumentNonBlocking(collection(firestore, 'dailyPostings'), posting);
            toast({ title: 'Post Logged', description: 'Your social media activity has been recorded.' });
            setDescription('');
            setLink('');
            forceRerender();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not log your activity.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPlatformIcon = (plt: string) => {
        switch (plt) {
            case 'Instagram': return <Instagram className="h-4 w-4" />;
            case 'Facebook': return <Facebook className="h-4 w-4" />;
            case 'WhatsApp': return <Share2 className="h-4 w-4" />;
            default: return <Video className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Video className="h-6 w-6" />
                        Log Daily Social Posting
                    </CardTitle>
                    <CardDescription>Record your social media updates and video uploads for the day.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Platform</Label>
                            <Select onValueChange={setPlatform} value={platform}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Platform" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Instagram">Instagram</SelectItem>
                                    <SelectItem value="Facebook">Facebook</SelectItem>
                                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                    <SelectItem value="TikTok">TikTok</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Activity Type</Label>
                            <Select onValueChange={setActivityType} value={activityType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Post">Post</SelectItem>
                                    <SelectItem value="Story">Story</SelectItem>
                                    <SelectItem value="Reel">Reel</SelectItem>
                                    <SelectItem value="Video">Video</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Content Description / Video Topic</Label>
                        <Textarea
                            placeholder="Briefly describe what you posted (e.g., 'Skincare routine reel', 'Client testimonial story')..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Post Link (Optional)</Label>
                        <Input
                            placeholder="https://..."
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Log Activity
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Posting History</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Platform</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Link</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {postings?.map(post => (
                                    <TableRow key={post.id}>
                                        <TableCell className="whitespace-nowrap">{format(new Date(post.postedAt), 'MMM dd, HH:mm')}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getPlatformIcon(post.platform)}
                                                {post.platform}
                                            </div>
                                        </TableCell>
                                        <TableCell>{post.activityType}</TableCell>
                                        <TableCell>{post.description}</TableCell>
                                        <TableCell>
                                            {post.link ? (
                                                <a href={post.link} target="_blank" className="text-primary hover:underline">View Post</a>
                                            ) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {postings?.length === 0 && (
                                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No activities logged yet.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

