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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import type { UserRole, FeatureAccess } from '@/lib/types';
import { Save, Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

const availableRoles: UserRole[] = ['Admin', 'Doctor', 'Receptionist', 'Sales', 'Social Media Manager', 'Operations Manager', 'Designer'];

const availableFeatures = [
    // General & Admin
    { id: 'dashboard', label: 'Dashboard Access' },
    { id: 'appointments', label: 'Appointments Management' },
    { id: 'patients', label: 'Patient Management' },
    { id: 'doctors', label: 'Doctor Management' },
    { id: 'userManagement', label: 'User Management' },
    { id: 'featureControl', label: 'Feature Access Control' },
    { id: 'aiTools', label: 'AI Recommendations' },

    // Pharmacy
    { id: 'pharmacy.full', label: 'Pharmacy (Full Access)' },
    { id: 'pharmacy.pos', label: 'Pharmacy (POS Only)' },

    // Reports
    { id: 'reports.full', label: 'Reports (Full Access)' },
    { id: 'reports.financial', label: 'Financial Reports' },
    { id: 'reports.inventory', label: 'Inventory Reports' },

    // Doctor Specific
    { id: 'healthRecords', label: 'Health Records (Doctor)' },
    { id: 'ePrescription', label: 'E-Prescription (Doctor)' },

    // Sales Specific
    { id: 'leads', label: 'Leads Management (Sales)' },
    { id: 'dailyReporting', label: 'Daily Reporting (Sales)' },
    { id: 'dailyTasks', label: 'Daily Tasks (Sales)' },
    { id: 'dailyProgress', label: 'Daily Progress (Sales)' },

    // Social Media Specific
    { id: 'socialReporting', label: 'Social Media Reporting' },
    { id: 'contentPlanner', label: 'Content Planner' },
    { id: 'analytics', label: 'Social Analytics' },
    { id: 'socialInbox', label: 'Social Inbox' },
];


type FeatureAccessState = {
    [role in UserRole]?: {
        [featureId: string]: boolean;
    };
};

export default function FeaturesPage() {
    const { user: userProfile, isUserLoading: isProfileLoading } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSaving, setIsSaving] = React.useState(false);

    const featureAccessQuery = useMemoFirebase(() => firestore ? collection(firestore, 'feature_access') : null, [firestore]);
    const { data: savedFeatureAccess, isLoading } = useCollection<FeatureAccess>(featureAccessQuery);

    const [featureAccess, setFeatureAccess] = React.useState<FeatureAccessState>({});

    React.useEffect(() => {
        if (savedFeatureAccess) {
            const newState: FeatureAccessState = {};
            savedFeatureAccess.forEach(roleAccess => {
                newState[roleAccess.role as UserRole] = roleAccess.features;
            });
            setFeatureAccess(newState);
        } else {
            const initialState: FeatureAccessState = {};
            availableRoles.forEach(role => {
                initialState[role] = {};
                availableFeatures.forEach(feature => {
                    if (initialState[role]) {
                        (initialState[role] as any)[feature.id] = role === 'Admin';
                    }
                });
            });
            setFeatureAccess(initialState);
        }
    }, [savedFeatureAccess]);


    const handleCheckboxChange = (role: UserRole, featureId: string, checked: boolean) => {
        setFeatureAccess(prevState => ({
            ...prevState,
            [role]: {
                ...prevState[role],
                [featureId]: checked,
            },
        }));
    };

    const handleSaveChanges = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firestore not available.' });
            return;
        }
        setIsSaving(true);
        try {
            const featureAccessCollection = collection(firestore, 'feature_access');
            for (const role of availableRoles) {
                const roleDocRef = doc(featureAccessCollection, role);
                const featuresForRole = featureAccess[role] || {};
                await setDoc(roleDocRef, { role, features: featuresForRole }, { merge: true });
            }
            toast({
                title: "Settings Saved",
                description: "Feature access rights have been updated successfully.",
            });
        } catch (error) {
            console.error("Error saving feature access:", error);
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save settings.' });
        } finally {
            setIsSaving(false);
        }
    };

    const isMainAdmin = userProfile?.email === 'admin1@skinsmith.com' || userProfile?.isMainAdmin;

    if (isProfileLoading || isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!isMainAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <h1 className="text-2xl font-bold text-destructive">Unauthorized Access</h1>
                <p>Only the Main Admin can manage feature permissions.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Feature Access Control</CardTitle>
                            <CardDescription>
                                Manage which user roles have access to specific application features.
                            </CardDescription>
                        </div>
                        <Button onClick={handleSaveChanges} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px] sticky left-0 bg-background z-10">Feature</TableHead>
                                    {availableRoles.map(role => (
                                        <TableHead key={role} className="text-center">{role}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {availableFeatures.map(feature => (
                                    <TableRow key={feature.id}>
                                        <TableCell className="font-medium sticky left-0 bg-background z-10">{feature.label}</TableCell>
                                        {availableRoles.map(role => (
                                            <TableCell key={`${role}-${feature.id}`} className="text-center">
                                                <Checkbox
                                                    checked={featureAccess[role]?.[feature.id] || false}
                                                    onCheckedChange={(checked) => handleCheckboxChange(role, feature.id, !!checked)}
                                                    aria-label={`Access for ${role} to ${feature.label}`}
                                                />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
