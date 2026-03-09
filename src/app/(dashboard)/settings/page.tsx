'use client';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useAuth } from '@/firebase';
import { updatePassword, updateProfile, getAuth, EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Lock, Save, ShieldCheck, Link } from 'lucide-react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function SettingsPage() {
    const { user: userProfile, isUserLoading } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [displayName, setDisplayName] = React.useState('');
    const [currentPassword, setCurrentPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [photoURL, setPhotoURL] = React.useState('');
    const [selectedIcon, setSelectedIcon] = React.useState('');
    const [newEmail, setNewEmail] = React.useState('');
    const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);
    const [isUpdatingEmail, setIsUpdatingEmail] = React.useState(false);

    const [isInitialized, setIsInitialized] = React.useState(false);

    React.useEffect(() => {
        if (!isUserLoading && userProfile && !isInitialized) {
            if (userProfile.name) setDisplayName(userProfile.name);
            if (userProfile.avatarUrl) setPhotoURL(userProfile.avatarUrl);
            if (userProfile.icon) setSelectedIcon(userProfile.icon);
            if (userProfile.email) setNewEmail(userProfile.email);
            setIsInitialized(true);
        }
    }, [userProfile, isUserLoading, isInitialized]);

    const handleUpdateProfile = async () => {
        if (!auth?.currentUser || !firestore) return;
        setIsUpdatingProfile(true);
        try {
            // 1. Update Firestore user document (Primary source of truth for the app)
            const userRef = doc(firestore, 'users', auth.currentUser.uid);
            await setDoc(userRef, {
                name: displayName,
                avatarUrl: photoURL || null,
                icon: selectedIcon || null,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            // 2. Update Firebase Auth profile (Secondary/Fallback)
            try {
                await updateProfile(auth.currentUser, {
                    displayName,
                    photoURL: photoURL || undefined
                });
            } catch (authError) {
                console.warn('Firebase Auth profile update failed (non-critical):', authError);
                // We proceed since Firestore is updated
            }

            toast({ title: 'Profile Updated', description: 'Your profile has been updated successfully.' });
        } catch (error: any) {
            console.error('Profile update error:', error);
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (!auth?.currentUser) return;
        if (newPassword !== confirmPassword) {
            toast({ variant: 'destructive', title: 'Error', description: 'Passwords do not match.' });
            return;
        }
        if (newPassword.length < 6) {
            toast({ variant: 'destructive', title: 'Error', description: 'Password must be at least 6 characters long.' });
            return;
        }

        setIsUpdatingPassword(true);
        try {
            const user = auth.currentUser;
            if (user.email && currentPassword) {
                const credential = EmailAuthProvider.credential(user.email, currentPassword);
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, newPassword);
                toast({ title: 'Password Changed', description: 'Your password has been updated successfully.' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Please provide your current password.' });
            }
        } catch (error: any) {
            console.error(error);
            let message = 'Failed to change password.';
            if (error.code === 'auth/wrong-password') {
                message = 'Incorrect current password.';
            }
            toast({ variant: 'destructive', title: 'Update Failed', description: message });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleUpdateEmail = async () => {
        if (!auth?.currentUser || !firestore) return;
        if (!newEmail || newEmail === auth.currentUser.email) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a new email address.' });
            return;
        }

        setIsUpdatingEmail(true);
        try {
            const user = auth.currentUser;
            if (user.email && currentPassword) {
                // Re-authenticate is required for email change
                const credential = EmailAuthProvider.credential(user.email, currentPassword);
                await reauthenticateWithCredential(user, credential);

                // Update in Auth
                await verifyBeforeUpdateEmail(user, newEmail);

                // Update in Firestore profile
                const userRef = doc(firestore, 'users', user.uid);
                await updateDoc(userRef, { email: newEmail });

                toast({
                    title: 'Email Update Initiated',
                    description: 'A verification email has been sent to your new address. Please verify it to complete the change.'
                });
                setCurrentPassword('');
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Please provide your current password for security.' });
            }
        } catch (error: any) {
            console.error('Email update error:', error);
            let message = 'Failed to update email.';
            if (error.code === 'auth/wrong-password') {
                message = 'Incorrect current password.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Invalid email address.';
            } else if (error.code === 'auth/email-already-in-use') {
                message = 'This email is already in use.';
            }
            toast({ variant: 'destructive', title: 'Update Failed', description: message });
        } finally {
            setIsUpdatingEmail(false);
        }
    };

    if (isUserLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                <p className="text-muted-foreground">Manage your account preferences and security.</p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full max-w-sm grid-cols-2">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" /> Profile
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <ShieldCheck className="h-4 w-4" /> Security
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profile Picture</CardTitle>
                                    <CardDescription>Manage your avatar</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AvatarUpload
                                        uid={auth?.currentUser?.uid || ''}
                                        firestore={firestore}
                                        currentPhotoURL={photoURL}
                                        onUploadSuccess={(url) => setPhotoURL(url)}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Profile Icon</CardTitle>
                                    <CardDescription>Choose a workspace icon</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['⚡', '🔥', '💎', '🚀', '🌟', '🎯', '🌈', '🎨'].map((icon) => (
                                            <button
                                                key={icon}
                                                onClick={() => setSelectedIcon(icon)}
                                                className={`text-2xl p-2 rounded-md transition-all hover:bg-accent ${selectedIcon === icon ? 'bg-accent ring-2 ring-primary' : ''
                                                    }`}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>Update your public profile details.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Display Name</Label>
                                    <Input
                                        id="name"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Your Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        value={userProfile?.email || ''}
                                        disabled
                                        className="bg-muted text-muted-foreground"
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">Email changes can be initiated in the Security tab.</p>
                                </div>
                                <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile} className="gap-2 w-full md:w-auto">
                                    {isUpdatingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save Profile Changes
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="security" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Settings</CardTitle>
                            <CardDescription>Update your credentials to keep your account secure.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password (Required for all changes)</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="border-t pt-6 space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Lock className="h-4 w-4" /> Change Password
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">New Password</Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleChangePassword} disabled={isUpdatingPassword} className="gap-2">
                                    {isUpdatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                                    Update Password
                                </Button>
                            </div>

                            <div className="border-t pt-6 space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <User className="h-4 w-4" /> Change Email
                                </h3>
                                <div className="space-y-2">
                                    <Label htmlFor="new-email">New Email Address</Label>
                                    <Input
                                        id="new-email"
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        placeholder="your-new-email@example.com"
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">Note: You&apos;ll need to verify the new email address before it becomes active.</p>
                                </div>
                                <Button onClick={handleUpdateEmail} disabled={isUpdatingEmail} className="gap-2">
                                    {isUpdatingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Update Email
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
