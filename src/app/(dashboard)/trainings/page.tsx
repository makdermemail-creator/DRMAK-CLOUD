'use client';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { SalesTraining, SalesTrainingCompletion } from '@/lib/types';
import { collection, query, orderBy, where, doc, setDoc } from 'firebase/firestore';
import { Loader2, Video, GraduationCap, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { TrainingDetailDialog } from '@/components/TrainingDetailDialog';
import { Eye } from 'lucide-react';

export default function TrainingsPage() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const [selectedTraining, setSelectedTraining] = React.useState<SalesTraining | null>(null);
    const [isDetailOpen, setIsDetailOpen] = React.useState(false);

    const trainingsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'salesTrainings'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const completionsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.id) return null;
        return query(collection(firestore, 'salesTrainingCompletions'), where('userId', '==', user.id));
    }, [firestore, user]);

    const { data: trainings, isLoading: trainingsLoading } = useCollection<SalesTraining>(trainingsQuery);
    const { data: completions, isLoading: completionsLoading } = useCollection<SalesTrainingCompletion>(completionsQuery);

    const handleMarkTrainingComplete = async (trainingId: string) => {
        if (!firestore || !user) return;
        const completionId = `${user.id}_${trainingId}`;
        const completionRef = doc(firestore, 'salesTrainingCompletions', completionId);

        try {
            await setDoc(completionRef, {
                id: completionId,
                userId: user.id,
                trainingId,
                completedAt: new Date().toISOString()
            });
            toast({ title: 'Training Completed', description: 'Great job! Training marked as complete.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update completion status.' });
        }
    };

    const isTrainingCompleted = (trainingId: string) => {
        return completions?.some(c => c.trainingId === trainingId);
    };

    if (isUserLoading || trainingsLoading || completionsLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <div className="p-8 text-center text-muted-foreground">Please sign in to view training materials.</div>;
    }

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="h-10 w-10 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">Sales Training Hub</h1>
                    <p className="text-muted-foreground italic">Master your skills and boost your performance.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {trainings?.map(training => {
                    const completed = isTrainingCompleted(training.id);
                    return (
                        <Card
                            key={training.id}
                            className={`overflow-hidden border-l-4 ${completed ? 'border-l-green-500' : 'border-l-primary'} hover:shadow-lg transition-all cursor-pointer group`}
                            onClick={() => {
                                setSelectedTraining(training);
                                setIsDetailOpen(true);
                            }}
                        >
                            <CardHeader className="pb-3 bg-slate-50/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{training.title}</CardTitle>
                                        {completed && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Published: {new Date(training.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="prose prose-sm max-w-none text-slate-600 line-clamp-3">
                                    {training.content}
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => {
                                                setSelectedTraining(training);
                                                setIsDetailOpen(true);
                                            }}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        {training.videoUrl && (
                                            <Button variant="outline" size="sm" asChild className="gap-2">
                                                <a href={training.videoUrl} target="_blank" rel="noopener noreferrer">
                                                    <Video className="h-4 w-4" /> Watch Video
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                    <div>
                                        {!completed ? (
                                            <Button onClick={() => handleMarkTrainingComplete(training.id)} className="gap-2 shadow-sm">
                                                Mark as Complete
                                            </Button>
                                        ) : (
                                            <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4" /> Completed on {completions?.find(c => c.trainingId === training.id)?.completedAt ? new Date(completions.find(c => c.trainingId === training.id)!.completedAt).toLocaleDateString() : ''}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {trainings?.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">No training materials yet</h3>
                        <p className="text-slate-400">Instructors are preparing your content. Check back soon!</p>
                    </div>
                )}
            </div>

            <TrainingDetailDialog
                training={selectedTraining}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />
        </div>
    );
}
