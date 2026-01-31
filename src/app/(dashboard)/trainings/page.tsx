'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import type { SalesTraining, SalesTrainingCompletion } from '@/lib/types';
import { collection, query, orderBy, doc, setDoc } from 'firebase/firestore';
import { Loader2, Video, GraduationCap, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { TrainingDetailDialog } from '@/components/TrainingDetailDialog';
import { Eye } from 'lucide-react';

interface TrainingCardProps {
    training: SalesTraining;
    userId: string;
    onViewDetails: (training: SalesTraining) => void;
}

function TrainingCard({ training, userId, onViewDetails }: TrainingCardProps) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const completionRef = useMemoFirebase(() => {
        if (!firestore || !userId || !training.id) return null;
        return doc(firestore, 'salesTrainingCompletions', `${userId}_${training.id}`);
    }, [firestore, userId, training.id]);

    const { data: completion, isLoading } = useDoc<SalesTrainingCompletion>(completionRef);

    const isCompleted = !!completion;

    const handleMarkTrainingComplete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!firestore || !userId) return;

        const completionId = `${userId}_${training.id}`;
        const completionRef = doc(firestore, 'salesTrainingCompletions', completionId);

        try {
            await setDoc(completionRef, {
                id: completionId,
                userId: userId,
                trainingId: training.id,
                completedAt: new Date().toISOString()
            });
            toast({ title: 'Training Completed', description: 'Great job! Training marked as complete.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update completion status.' });
        }
    };

    return (
        <Card
            className={`overflow-hidden border-l-4 ${isCompleted ? 'border-l-green-500' : 'border-l-primary'} hover:shadow-lg transition-all cursor-pointer group`}
            onClick={() => onViewDetails(training)}
        >
            <CardHeader className="pb-3 bg-slate-50/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{training.title}</CardTitle>
                        {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
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
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewDetails(training);
                            }}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        {training.videoUrl && (
                            <Button variant="outline" size="sm" asChild className="gap-2" onClick={(e) => e.stopPropagation()}>
                                <a href={training.videoUrl} target="_blank" rel="noopener noreferrer">
                                    <Video className="h-4 w-4" /> Watch Video
                                </a>
                            </Button>
                        )}
                    </div>
                    <div>
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : !isCompleted ? (
                            <Button onClick={handleMarkTrainingComplete} className="gap-2 shadow-sm">
                                Mark as Complete
                            </Button>
                        ) : (
                            <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" /> Completed on {completion?.completedAt ? new Date(completion.completedAt).toLocaleDateString() : ''}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function TrainingsPage() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const [selectedTraining, setSelectedTraining] = React.useState<SalesTraining | null>(null);
    const [isDetailOpen, setIsDetailOpen] = React.useState(false);

    const trainingsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'salesTrainings'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: trainings, isLoading: trainingsLoading } = useCollection<SalesTraining>(trainingsQuery);

    if (isUserLoading || trainingsLoading) {
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
                {trainings?.map(training => (
                    <TrainingCard
                        key={training.id}
                        training={training}
                        userId={user.id}
                        onViewDetails={(t) => {
                            setSelectedTraining(t);
                            setIsDetailOpen(true);
                        }}
                    />
                ))}

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
