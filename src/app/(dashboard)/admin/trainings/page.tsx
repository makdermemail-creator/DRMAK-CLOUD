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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Trash2, GraduationCap, Link as LinkIcon, Pencil, X } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { SalesTraining } from '@/lib/types';
import { TrainingDetailDialog } from '@/components/TrainingDetailDialog';
import { Eye } from 'lucide-react';

export default function AdminTrainingsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user } = useUser();

    // Restricted Access Check - Dynamic feature-based
    const hasAccess = user?.role === 'Admin' || user?.email === 'admin1@skinsmith.com' || user?.featureAccess?.['trainings'];

    const [title, setTitle] = React.useState('');
    const [content, setContent] = React.useState('');
    const [videoUrl, setVideoUrl] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [selectedTraining, setSelectedTraining] = React.useState<SalesTraining | null>(null);
    const [isDetailOpen, setIsDetailOpen] = React.useState(false);

    const trainingsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'salesTrainings'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: trainings, isLoading, forceRerender } = useCollection<SalesTraining>(trainingsQuery);

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            toast({
                variant: 'destructive',
                title: 'Required Fields',
                description: 'Please provide at least a title and content.'
            });
            return;
        }
        if (!firestore || !user) return;

        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateDocumentNonBlocking(doc(firestore, 'salesTrainings', editingId), {
                    title,
                    content,
                    videoUrl,
                    updatedAt: new Date().toISOString()
                });
                toast({ title: 'Training Updated', description: 'Sales training material updated successfully.' });
            } else {
                await addDocumentNonBlocking(collection(firestore, 'salesTrainings'), {
                    title,
                    content,
                    videoUrl,
                    createdAt: new Date().toISOString(),
                    createdBy: user.id
                });
                toast({ title: 'Training Added', description: 'Sales training material created successfully.' });
            }
            resetForm();
            forceRerender();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: editingId ? 'Failed to update training material.' : 'Failed to add training material.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (training: SalesTraining) => {
        setEditingId(training.id);
        setTitle(training.title);
        setContent(training.content);
        setVideoUrl(training.videoUrl || '');
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingId(null);
        setTitle('');
        setContent('');
        setVideoUrl('');
    };

    const handleDelete = async (id: string) => {
        if (!firestore) return;
        if (!window.confirm('Are you sure you want to delete this training material?')) return;

        try {
            await deleteDocumentNonBlocking(doc(firestore, 'salesTrainings', id));
            toast({ title: 'Deleted', description: 'Training material removed.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete training.' });
        }
    };

    if (!hasAccess && user) {
        return <div className="p-8 text-center text-muted-foreground">You do not have permission to view this page.</div>;
    }

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">Sales Training Management</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Add New Training Material</CardTitle>
                    <CardDescription>Create instructional content for the sales team.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input
                            placeholder="e.g., How to handle objections"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Content / Instructions (Supports HTML/Markdown)</label>
                        <Textarea
                            placeholder="Provide detailed training content here..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={6}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" /> Video Link (Optional)
                        </label>
                        <Input
                            placeholder="https://youtube.com/..."
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={handleSubmit} className="w-full md:w-auto" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : editingId ? (
                                <Pencil className="mr-2 h-4 w-4" />
                            ) : (
                                <PlusCircle className="mr-2 h-4 w-4" />
                            )}
                            {editingId ? 'Update Training' : 'Publish Training'}
                        </Button>
                        {editingId && (
                            <Button variant="outline" onClick={resetForm} disabled={isSubmitting}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel Edit
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Existing Training Materials</CardTitle>
                    <CardDescription>All published training content for sales personnel.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Training Title</TableHead>
                                    <TableHead>Video</TableHead>
                                    <TableHead>Published On</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
                                ) : trainings?.map(t => (
                                    <TableRow key={t.id}>
                                        <TableCell className="font-medium">
                                            <button
                                                onClick={() => {
                                                    setSelectedTraining(t);
                                                    setIsDetailOpen(true);
                                                }}
                                                className="hover:text-primary hover:underline underline-offset-4 transition-colors text-left"
                                            >
                                                {t.title}
                                            </button>
                                        </TableCell>
                                        <TableCell>
                                            {t.videoUrl ? (
                                                <a href={t.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                                    <LinkIcon className="h-3 w-3" /> Watch
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground text-xs italic">No video</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {format(new Date(t.createdAt), 'MMM dd, yyyy')}
                                        </TableCell>
                                        <TableCell className="text-right flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setSelectedTraining(t);
                                                    setIsDetailOpen(true);
                                                }}
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4 text-slate-500 hover:text-primary" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(t)}
                                                title="Edit Training"
                                            >
                                                <Pencil className="h-4 w-4 text-slate-500 hover:text-primary" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} title="Delete Training">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {trainings?.length === 0 && !isLoading && (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">No training materials found. Add one above to get started.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <TrainingDetailDialog
                training={selectedTraining}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />
        </div>
    );
}
