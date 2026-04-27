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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Shield, Settings, Users, Activity, LayoutDashboard, Share2, Sparkles, ShoppingBag, PieChart } from 'lucide-react';
import { useFirestore, useAuth, useCollection, useMemoFirebase, updateDocumentNonBlocking, getSecondaryAuth } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { availableFeatures, FeatureCategory } from '@/lib/features';
import type { User, Doctor } from '@/lib/types';

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

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
}

export const UserFormDialog = ({ open, onOpenChange, user }: UserFormDialogProps) => {
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = React.useState<Partial<User>>({});
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const doctorsRef = useMemoFirebase(() => firestore ? collection(firestore, 'doctors') : null, [firestore]);
  const { data: doctors } = useCollection<Doctor>(doctorsRef);

  React.useEffect(() => {
    if (open) {
      if (user) {
        setFormData(user);
      } else {
        setFormData({});
      }
      setPassword('');
    }
  }, [user, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleRoleChange = (value: User['role']) => {
    setFormData(prev => ({ ...prev, role: value, isAdmin: value === 'Admin' }));
  }

  const handleCategoryToggle = (category: FeatureCategory, checked: boolean) => {
    const categoryFeatures = availableFeatures.filter(f => f.category === category);
    setFormData(prev => {
      const updatedFeatureAccess = { ...prev.featureAccess };
      categoryFeatures.forEach(f => {
        updatedFeatureAccess[f.id] = checked;
      });
      return { ...prev, featureAccess: updatedFeatureAccess };
    });
  };

  const categories = Array.from(new Set(availableFeatures.map(f => f.category))) as FeatureCategory[];

  const handleSubmit = async () => {
    if (!firestore || !auth) return;
    if (!formData.email || !formData.role) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Email and Role are required.' });
      return;
    }

    setIsSubmitting(true);
    const collectionRef = collection(firestore, 'users');
    const isNowAdmin = formData.role === 'Admin';

    try {
      if (user?.id) {
        const docRef = doc(collectionRef, user.id);
        const updateData: any = {
          name: formData.name,
          role: formData.role,
          isAdmin: isNowAdmin,
          avatarUrl: formData.avatarUrl,
          featureAccess: formData.featureAccess,
        };
        
        if (formData.role === 'Doctor' && formData.doctorId) {
            updateData.doctorId = formData.doctorId;
        }

        await updateDocumentNonBlocking(docRef, updateData);
        toast({ title: "User Updated", description: "The user's details and permissions have been updated." });
        onOpenChange(false);
      } else {
        if (!password) {
          toast({ variant: 'destructive', title: 'Password required', description: 'Please set an initial password for the new user.' });
          setIsSubmitting(false);
          return;
        }
        const secondaryAuth = getSecondaryAuth();
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, password);
        const newUserId = userCredential.user.uid;
        await secondaryAuth.signOut();

        const newUserDoc: User = {
          id: newUserId,
          name: formData.name || formData.email.split('@')[0],
          email: formData.email,
          role: formData.role,
          isAdmin: isNowAdmin,
          avatarUrl: formData.avatarUrl || '',
          featureAccess: formData.featureAccess,
          status: 'Active',
          isDeleted: false,
          active: true
        };
        
        if (formData.role === 'Doctor' && formData.doctorId) {
          newUserDoc.doctorId = formData.doctorId;
        }

        await setDoc(doc(firestore, "users", newUserId), newUserDoc);
        toast({ title: "User Added", description: "The new user has been created successfully." });
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error managing user:", error);
      toast({ variant: 'destructive', title: 'Action Failed', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">{user ? 'Edit Staff Member' : 'Add New Staff'}</DialogTitle>
          <DialogDescription className="font-bold text-slate-400">
            {user ? "Update profile and permissions for " + user.name : "Create a new account for your clinic staff."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 overflow-y-auto">
          <div className="flex flex-col items-center gap-4">
            <AvatarUpload
              uid={user?.id || 'new-user'}
              firestore={firestore}
              currentPhotoURL={formData.avatarUrl}
              onUploadSuccess={(url) => setFormData(prev => ({ ...prev, avatarUrl: url }))}
            />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profile Photo</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</Label>
              <Input id="name" value={formData.name || ''} onChange={handleChange} className="rounded-xl border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</Label>
              <Input id="email" type="email" value={formData.email || ''} onChange={handleChange} className="rounded-xl border-slate-200" disabled={!!user} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {!user && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initial Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl border-slate-200" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Professional Role</Label>
              <Select onValueChange={handleRoleChange} value={formData.role}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Doctor">Doctor</SelectItem>
                  <SelectItem value="Receptionist">Receptionist</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Social Media Manager">Social Media Manager</SelectItem>
                  <SelectItem value="Operations Manager">Operations Manager</SelectItem>
                  <SelectItem value="Designer">Designer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.role === 'Doctor' && (
            <div className="space-y-2">
              <Label htmlFor="doctorId" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Link Doctor Profile</Label>
              <Select onValueChange={(val) => setFormData(prev => ({ ...prev, doctorId: val }))} value={formData.doctorId}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue placeholder="Select doctor profile" />
                </SelectTrigger>
                <SelectContent>
                  {doctors?.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.fullName} ({d.specialization})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Permission & Feature Access</Label>
            <ScrollArea className="h-[300px] rounded-2xl border border-slate-100 p-4 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                {categories.map(category => {
                  const featuresInCategory = availableFeatures.filter(f => f.category === category);
                  const allChecked = featuresInCategory.every(f => formData.featureAccess?.[f.id]);
                  const selectedCount = featuresInCategory.filter(f => formData.featureAccess?.[f.id]).length;
                  const Icon = categoryIcons[category] || Shield;

                  return (
                    <Card key={category} className="overflow-hidden border-none shadow-sm bg-white rounded-2xl">
                      <CardHeader className="bg-slate-100/50 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-indigo-600" />
                          <CardTitle className="text-xs font-black uppercase tracking-tight">{category}</CardTitle>
                        </div>
                        <Checkbox
                          checked={allChecked}
                          onCheckedChange={(checked) => handleCategoryToggle(category, !!checked)}
                          className="rounded-md"
                        />
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        {featuresInCategory.map(feature => (
                          <div key={feature.id} className="flex items-center justify-between">
                            <Label
                              htmlFor={`feature-${feature.id}`}
                              className="text-[10px] font-bold text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors"
                            >
                              {feature.label}
                            </Label>
                            <Checkbox
                              id={`feature-${feature.id}`}
                              checked={formData.featureAccess?.[feature.id] || false}
                              onCheckedChange={(checked) => {
                                setFormData(prev => ({
                                  ...prev,
                                  featureAccess: {
                                    ...prev.featureAccess,
                                    [feature.id]: !!checked
                                  }
                                }));
                              }}
                              className="rounded-md h-3.5 w-3.5"
                            />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter className="mt-auto pt-6 border-t border-slate-100">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="rounded-xl h-12 px-8 bg-indigo-600 text-white font-black uppercase tracking-widest shadow-lg shadow-indigo-100"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {user ? 'Save Changes' : 'Create Staff Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
