'use client';
import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Video, Calendar, User, GraduationCap, ExternalLink } from 'lucide-react';
import type { SalesTraining } from '@/lib/types';
import { format } from 'date-fns';

interface TrainingDetailDialogProps {
    training: SalesTraining | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TrainingDetailDialog({ training, open, onOpenChange }: TrainingDetailDialogProps) {
    if (!training) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                        <GraduationCap className="h-6 w-6" />
                        <span className="text-xs font-bold uppercase tracking-wider">Training Module</span>
                    </div>
                    <DialogTitle className="text-2xl font-bold leading-tight">{training.title}</DialogTitle>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(training.createdAt), 'MMMM dd, yyyy')}
                        </div>
                        {training.videoUrl && (
                            <div className="flex items-center gap-1 text-blue-600 font-medium">
                                <Video className="h-3 w-3" />
                                Video Included
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <div className="py-6 border-t border-b border-slate-100 my-4">
                    <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap">
                        {training.content}
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    {training.videoUrl && (
                        <Button asChild className="w-full sm:w-auto gap-2">
                            <a href={training.videoUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" /> Watch Video Tutorial
                            </a>
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
