'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, FileText, X } from 'lucide-react';
import { doc, setDoc, Firestore } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface PrescriptionTemplateUploadProps {
    uid: string;
    firestore: Firestore | null;
    currentTemplateURL?: string;
    onUploadSuccess: (url: string) => void;
    disableAutoSave?: boolean;
}

export function PrescriptionTemplateUpload({ uid, firestore, currentTemplateURL, onUploadSuccess, disableAutoSave = false }: PrescriptionTemplateUploadProps) {
    const [isUploading, setIsUploading] = React.useState(false);
    const [previewUrl, setPreviewUrl] = React.useState(currentTemplateURL);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        if (currentTemplateURL) {
            setPreviewUrl(currentTemplateURL);
        }
    }, [currentTemplateURL]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({
                variant: 'destructive',
                title: 'Invalid file type',
                description: 'Please upload an image file.',
            });
            return;
        }

        // Limit for Base64 (max 800KB for letterhead templates)
        if (file.size > 800 * 1024) {
            toast({
                variant: 'destructive',
                title: 'File too large',
                description: 'Please upload an image smaller than 800KB.',
            });
            return;
        }

        setIsUploading(true);

        try {
            const reader = new FileReader();

            reader.onloadend = async () => {
                const base64String = reader.result as string;

                if (!disableAutoSave && firestore && uid) {
                    try {
                        const docRef = doc(firestore, 'doctors', uid);
                        await setDoc(docRef, {
                            prescriptionTemplateUrl: base64String,
                            updatedAt: new Date().toISOString()
                        }, { merge: true });
                    } catch (fsError) {
                        console.error('Failed to auto-save template:', fsError);
                    }
                }

                setPreviewUrl(base64String);
                onUploadSuccess(base64String);

                toast({
                    title: 'Success',
                    description: 'Prescription template updated successfully.',
                });
                setIsUploading(false);
            };

            reader.onerror = () => {
                toast({
                    variant: 'destructive',
                    title: 'Conversion failed',
                    description: 'Failed to process image file.',
                });
                setIsUploading(false);
            };

            reader.readAsDataURL(file);

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Upload failed',
                description: error.message || 'Failed to process image.',
            });
            setIsUploading(false);
        }
    };

    const removeTemplate = () => {
        setPreviewUrl(undefined);
        onUploadSuccess('');
    };

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h4 className="text-sm font-medium">Prescription Template</h4>
                    <p className="text-xs text-muted-foreground">
                        Upload your digital letterhead. Max 800KB.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="gap-2"
                    >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {previewUrl ? 'Change Template' : 'Upload Template'}
                    </Button>
                    {previewUrl && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={removeTemplate}
                            disabled={isUploading}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <Input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>

            {previewUrl && (
                <div className="relative mt-2 border rounded-md overflow-hidden bg-white aspect-[1/1.4] max-w-[200px] mx-auto shadow-sm">
                    <img src={previewUrl} alt="Prescription Template Preview" className="w-full h-full object-contain" />
                </div>
            )}

            {!previewUrl && (
                <div className="mt-2 border border-dashed rounded-md p-8 flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
                    <FileText className="h-8 w-8 mb-2 opacity-20" />
                    <span className="text-xs italic">No template uploaded</span>
                </div>
            )}
        </div>
    );
}
