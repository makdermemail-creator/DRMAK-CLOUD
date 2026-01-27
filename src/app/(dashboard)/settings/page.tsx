'use client';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useAuth } from '@/firebase';
import { updatePassword, updateProfile, getAuth, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Lock, Save, ShieldCheck, Link } from 'lucide-react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function SettingsPage() {
    const { user: userProfile, isUserLoading } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [displayName, setDisplayName] = React.useState('');
    const [currentPassword, setCurrentPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [sheetLink, setSheetLink] = React.useState('');
    const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);
    const [isUpdatingSocial, setIsUpdatingSocial] = React.useState(false);

    React.useEffect(() => {
        if (userProfile?.name) {
            setDisplayName(userProfile.name);
        }
    }, [userProfile]);

    React.useEffect(() => {
        if (!firestore) return;
        const fetchSocialSettings = async () => {
            const docRef = doc(firestore, 'settings', 'socialMedia');
            const snap = await getDoc(docRef);
            if (snap.exists() && snap.data().googleSheetLink) {
                setSheetLink(snap.data().googleSheetLink);
            }
        };
        fetchSocialSettings();
    }, [firestore]);

    const handleUpdateSocial = async () => {
        if (!firestore) return;
        setIsUpdatingSocial(true);
        try {
            await setDoc(doc(firestore, 'settings', 'socialMedia'), { googleSheetLink: sheetLink }, { merge: true });
            toast({ title: 'Settings Saved', description: 'Social Media configuration updated.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        } finally {
            setIsUpdatingSocial(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!auth?.currentUser) return;
        setIsUpdatingProfile(true);
        try {
            await updateProfile(auth.currentUser, { displayName });
            toast({ title: 'Profile Updated', description: 'Your display name has been updated.' });
        } catch (error: any) {
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
            // Re-authenticate is required for sensitive operations like password change
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
                <TabsList className="grid w-full max-w-lg grid-cols-3">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" /> Profile
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <ShieldCheck className="h-4 w-4" /> Security
                    </TabsTrigger>
                    <TabsTrigger value="social" className="gap-2">
                        <Link className="h-4 w-4" /> Social Media
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-6">
                    <Card>
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
                                <p className="text-[10px] text-muted-foreground italic">Email changes are managed by administrators.</p>
                            </div>
                            <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile} className="gap-2">
                                {isUpdatingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Changes
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Settings</CardTitle>
                            <CardDescription>Update your password to keep your account secure.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
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
                            <div className="pt-4">
                                <Button onClick={handleChangePassword} disabled={isUpdatingPassword} className="gap-2">
                                    {isUpdatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                                    Update Password
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="social" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Social Media Settings</CardTitle>
                            <CardDescription>Configure links for real-time analytics data.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="sheet-link">Google Sheet Link (Analytics Data)</Label>
                                <Input
                                    id="sheet-link"
                                    value={sheetLink}
                                    onChange={(e) => setSheetLink(e.target.value)}
                                    placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                                />
                                <p className="text-[11px] text-muted-foreground italic">
                                    Make sure the sheet is shared so the system can access it (export to CSV).
                                </p>
                            </div>
                            <Button onClick={handleUpdateSocial} disabled={isUpdatingSocial} className="gap-2">
                                {isUpdatingSocial ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Social Settings
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
