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
import { Loader2, User, Lock, Save, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
    const { user: userProfile, isUserLoading } = useUser();
    const auth = useAuth();
    const { toast } = useToast();

    const [displayName, setDisplayName] = React.useState('');
    const [currentPassword, setCurrentPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);

    React.useEffect(() => {
        if (userProfile?.name) {
            setDisplayName(userProfile.name);
        }
    }, [userProfile]);

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
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" /> Profile
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <ShieldCheck className="h-4 w-4" /> Security
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
            </Tabs>
        </div>
    );
}
