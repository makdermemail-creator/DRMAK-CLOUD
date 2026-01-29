'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, User } from 'lucide-react';
import { doc, setDoc, Firestore } from 'firebase/firestore';
import { uploadFile } from '@/firebase/storage';
import { useToast } from '@/hooks/use-toast';

interface AvatarUploadProps {
    uid: string;
    firestore: Firestore | null;
    currentPhotoURL?: string;
    onUploadSuccess: (url: string) => void;
}

export function AvatarUpload({ uid, firestore, currentPhotoURL, onUploadSuccess }: AvatarUploadProps) {
    const [isUploading, setIsUploading] = React.useState(false);
    const [previewUrl, setPreviewUrl] = React.useState(currentPhotoURL);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Synchronize preview URL when currentPhotoURL changes (e.g., after loading from Firestore)
    React.useEffect(() => {
        if (currentPhotoURL) {
            console.log('AvatarUpload: Syncing preview with currentPhotoURL:', currentPhotoURL);
            setPreviewUrl(currentPhotoURL);
        }
    }, [currentPhotoURL]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        console.log('AvatarUpload: File selected:', file?.name, file?.size);
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            toast({
                variant: 'destructive',
                title: 'Invalid file type',
                description: 'Please upload an image file.',
            });
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast({
                variant: 'destructive',
                title: 'File too large',
                description: 'Please upload an image smaller than 2MB.',
            });
            return;
        }

        setIsUploading(true);
        console.log('AvatarUpload: Starting upload for user:', uid);
        console.log('AvatarUpload: Firestore available:', !!firestore);
        try {
            if (!uid) {
                throw new Error('User ID is missing. Please try again.');
            }
            const fileName = `profile_${uid}_${Date.now()}`;
            const path = `profiles/${uid}/${fileName}`;
            console.log('AvatarUpload: Upload path:', path);
            console.log('AvatarUpload: About to call uploadFile...');

            const downloadUrl = await uploadFile(file, path);
            console.log('AvatarUpload: Upload successful, URL:', downloadUrl);

            // Auto-save to Firestore for better UX
            if (firestore && uid) {
                console.log('AvatarUpload: Attempting Firestore save...');
                try {
                    const userRef = doc(firestore, 'users', uid);
                    console.log('AvatarUpload: Created doc ref:', userRef.path);
                    await setDoc(userRef, {
                        avatarUrl: downloadUrl,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                    console.log('AvatarUpload: Auto-saved to Firestore successfully');
                } catch (fsError) {
                    console.error('AvatarUpload: Failed to auto-save to Firestore:', fsError);
                }
            } else {
                console.warn('AvatarUpload: Skipping Firestore save - firestore or uid missing');
            }

            console.log('AvatarUpload: Setting preview URL...');
            setPreviewUrl(downloadUrl);
            console.log('AvatarUpload: Calling onUploadSuccess...');
            onUploadSuccess(downloadUrl);

            console.log('AvatarUpload: Showing success toast...');
            toast({
                title: 'Success',
                description: 'Profile picture updated successfully.',
            });
        } catch (error: any) {
            console.error('AvatarUpload error:', error);
            const errorMessage = error.code ? `${error.code}: ${error.message}` : error.message;
            toast({
                variant: 'destructive',
                title: 'Upload failed',
                description: errorMessage || 'Failed to upload image.',
            });
        } finally {
            console.log('AvatarUpload: Upload process finished, setting isUploading to false');
            setIsUploading(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex items-center gap-6 p-4 border rounded-lg bg-card/50 backdrop-blur-sm">
            <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-primary/20 transition-all group-hover:border-primary/50">
                    <AvatarImage src={previewUrl} alt="Profile" className="object-cover" />
                    <AvatarFallback className="bg-primary/5 text-primary text-2xl">
                        <User className="h-10 w-10" />
                    </AvatarFallback>
                </Avatar>
                {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full animate-in fade-in">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
            </div>

            <div className="space-y-3 flex-1">
                <div className="space-y-1">
                    <h4 className="text-sm font-medium">Profile Picture</h4>
                    <p className="text-xs text-muted-foreground">
                        JPG, PNG or WebP. Max size 2MB.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={triggerFileInput}
                        disabled={isUploading}
                        className="gap-2"
                    >
                        <Upload className="h-4 w-4" />
                        Upload Image
                    </Button>
                    <Input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>
            </div>
        </div>
    );
}
