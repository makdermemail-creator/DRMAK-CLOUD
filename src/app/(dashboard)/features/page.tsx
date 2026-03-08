'use client';
import * as React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import type { UserRole, FeatureAccess } from '@/lib/types';
import { Save, Loader2, Shield, Settings, Users, Activity, LayoutDashboard, Share2, Sparkles, ShoppingBag, PieChart } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { availableFeatures, FeatureCategory } from '@/lib/features';
import { cn } from '@/lib/utils';

const availableRoles: UserRole[] = ['Admin', 'Doctor', 'Receptionist', 'Sales', 'Social Media Manager', 'Operations Manager', 'Designer'];

const categoryIcons: { [key in FeatureCategory]: any } = {
    'Operations': Settings,
    'Sales': Users,
    'Social Media': Share2,
    'Clinic': Activity,
    'Pharmacy': ShoppingBag,
    'Reports': PieChart,
    'Intelligence': Sparkles,
    'General': LayoutDashboard
};

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
    const [selectedRole, setSelectedRole] = React.useState<UserRole>('Admin');

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

    const handleCategoryToggle = (role: UserRole, category: FeatureCategory, checked: boolean) => {
        const categoryFeatures = availableFeatures.filter(f => f.category === category);
        const updatedFeatures = { ...featureAccess[role] };

        categoryFeatures.forEach(f => {
            updatedFeatures[f.id] = checked;
        });

        setFeatureAccess(prevState => ({
            ...prevState,
            [role]: updatedFeatures
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

    const isMainAdmin =
        userProfile?.email === 'admin1@skinsmith.com' ||
        userProfile?.isMainAdmin ||
        userProfile?.role === 'Admin' ||
        userProfile?.isAdmin ||
        userProfile?.role === 'Operations Manager';

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

    const categories = Array.from(new Set(availableFeatures.map(f => f.category))) as FeatureCategory[];

    return (
        <div className="space-y-8 pb-10">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Feature Access Control</h1>
                    <p className="text-muted-foreground">Manage granular permissions by category for each user role.</p>
                </div>
                <Button onClick={handleSaveChanges} disabled={isSaving} size="lg" className="shadow-lg">
                    {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                    Save All Changes
                </Button>
            </div>

            {/* Role Selection Tabs */}
            <div className="flex flex-wrap gap-2 p-1 bg-muted/50 rounded-xl w-fit">
                {availableRoles.map(role => (
                    <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className={cn(
                            "px-4 py-2 text-sm font-medium transition-all rounded-lg",
                            selectedRole === role
                                ? "bg-background shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                    >
                        {role}
                    </button>
                ))}
            </div>

            {/* Category Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(category => {
                    const featuresInCategory = availableFeatures.filter(f => f.category === category);
                    const allChecked = featuresInCategory.every(f => featureAccess[selectedRole]?.[f.id]);
                    const someChecked = featuresInCategory.some(f => featureAccess[selectedRole]?.[f.id]);
                    const Icon = categoryIcons[category] || Shield;

                    return (
                        <Card key={category} className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300">
                            <CardHeader className="bg-muted/30 border-b border-border/50 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-background rounded-lg shadow-sm">
                                            <Icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <CardTitle className="text-lg">{category}</CardTitle>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Grant Box</span>
                                        <Checkbox
                                            id={`toggle-${category}`}
                                            checked={allChecked}
                                            onCheckedChange={(checked) => handleCategoryToggle(selectedRole, category, !!checked)}
                                            className="h-5 w-5"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                {featuresInCategory.map(feature => (
                                    <div key={feature.id} className="flex items-center justify-between group/item">
                                        <label
                                            htmlFor={`${selectedRole}-${feature.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer group-hover/item:text-primary transition-colors"
                                        >
                                            {feature.label}
                                        </label>
                                        <Checkbox
                                            id={`${selectedRole}-${feature.id}`}
                                            checked={featureAccess[selectedRole]?.[feature.id] || false}
                                            onCheckedChange={(checked) => handleCheckboxChange(selectedRole, feature.id, !!checked)}
                                        />
                                    </div>
                                ))}
                            </CardContent>
                            <CardFooter className="bg-muted/5 py-2 px-6 flex justify-end">
                                <span className="text-[10px] text-muted-foreground italic">
                                    {featuresInCategory.filter(f => featureAccess[selectedRole]?.[f.id]).length} of {featuresInCategory.length} active
                                </span>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

