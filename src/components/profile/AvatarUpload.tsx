'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, User, Image as ImageIcon } from 'lucide-react';
import { uploadFile } from '@/firebase/storage';
import { useToast } from '@/hooks/use-toast';

interface AvatarUploadProps {
    uid: string;
    currentPhotoURL?: string;
    onUploadSuccess: (url: string) => void;
}

export function AvatarUpload({ uid, currentPhotoURL, onUploadSuccess }: AvatarUploadProps) {
    const [isUploading, setIsUploading] = React.useState(false);
    const [previewUrl, setPreviewUrl] = React.useState(currentPhotoURL);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
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
        try {
            const fileName = `profile_${uid}_${Date.now()}`;
            const path = `profiles/${uid}/${fileName}`;
            const downloadUrl = await uploadFile(file, path);

            setPreviewUrl(downloadUrl);
            onUploadSuccess(downloadUrl);

            toast({
                title: 'Success',
                description: 'Profile picture uploaded successfully.',
            });
        } catch (error: any) {
            console.error('Upload error:', error);
            toast({
                variant: 'destructive',
                title: 'Upload failed',
                description: error.message || 'Failed to upload image.',
            });
        } finally {
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
