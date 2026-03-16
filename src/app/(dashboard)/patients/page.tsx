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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Search, Loader2, Upload, Bell, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import type { Patient } from '@/lib/types';
import { collection, doc, setDoc, query, where, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useSearchParams } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearch } from '@/context/SearchProvider';
import { PatientImportDialog } from '@/components/patients/PatientImportDialog';

const PatientFormDialog = ({ open, onOpenChange, patient }: { open: boolean, onOpenChange: (open: boolean) => void, patient?: Patient }) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [formData, setFormData] = React.useState<Partial<Patient>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) { // Reset form only when dialog opens
      if (patient) {
        setFormData(patient);
      } else {
        setFormData({ gender: 'Other' });
      }
    }
  }, [patient, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: 'Male' | 'Female' | 'Other') => {
    setFormData(prev => ({ ...prev, gender: value }));
  }



  const handleSubmit = () => {
    if (!firestore) return;
    if (!formData.name || !formData.mobileNumber) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill in the Name and Mobile Number.' });
      return;
    }

    const collectionRef = collection(firestore, 'patients');

    if (patient?.id) {
      updateDocumentNonBlocking(doc(collectionRef, patient.id), formData);
      toast({ title: "Patient Updated", description: "The patient's details have been updated." });
    } else {
      // Firestore will auto-generate an ID, but mobileNumber must be unique for our model
      const newPatientDoc = {
        ...formData,
        age: formData.age ? Number(formData.age) : null,
        registrationDate: new Date().toISOString()
      };
      // Use mobileNumber as the document ID
      setDoc(doc(collectionRef, formData.mobileNumber), newPatientDoc);
      toast({ title: "Patient Added", description: "The new patient has been registered." });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{patient ? 'Edit Patient' : 'Add New Patient'}</DialogTitle>
          <DialogDescription>
            {patient ? "Update the patient's details below." : "Fill in the details to register a new patient."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={formData.name || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mobileNumber" className="text-right">Mobile No.</Label>
            <Input id="mobileNumber" value={formData.mobileNumber || ''} onChange={handleChange} className="col-span-3" disabled={!!patient} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="age" className="text-right">Age (Optional)</Label>
            <Input id="age" type="number" value={formData.age || ''} onChange={handleChange} className="col-span-3" placeholder="Enter age" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="gender" className="text-right">Gender</Label>
            <Select onValueChange={handleSelectChange} value={formData.gender}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">Address (Optional)</Label>
            <Input id="address" value={formData.address || ''} onChange={handleChange} className="col-span-3" placeholder="Enter address" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Photo (Optional)</Label>
            <div className="col-span-3">
              <AvatarUpload
                uid={patient?.id || formData.mobileNumber || 'new-patient'}
                currentPhotoURL={formData.avatarUrl}
                onUploadSuccess={(url) => setFormData(prev => ({ ...prev, avatarUrl: url }))}
                firestore={firestore!}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>{patient ? 'Save Changes' : 'Add Patient'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function PatientsPage() {
  return (
    <React.Suspense fallback={
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <PatientsContent />
    </React.Suspense>
  );
}

function PatientsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { searchTerm } = useSearch();
  const firestore = useFirestore();
  const patientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'patients') : null, [firestore]);
  const { data: patients, isLoading } = useCollection<Patient>(patientsQuery);

  // Follow-up notifications
  const followUpsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'followUps'),
      where('status', '==', 'Pending'),
      orderBy('followUpDate', 'asc')
    );
  }, [firestore]);
  const { data: allFollowUps } = useCollection<{
    id: string; patientId: string; patientName: string;
    patientMobile: string; followUpDate: string; reason: string; status: string;
  }>(followUpsQuery);

  const urgentFollowUps = React.useMemo(() => {
    if (!allFollowUps) return [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return allFollowUps.filter(f => new Date(f.followUpDate) <= today);
  }, [allFollowUps]);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | undefined>(undefined);
  const [patientToDelete, setPatientToDelete] = React.useState<Patient | null>(null);

  const handleOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open && searchParams.get('add')) {
      // Clear URL parameter when the dialog is closed to prevent auto-reopening
      router.replace('/patients', { scroll: false });
    }
  };

  React.useEffect(() => {
    const mobileToAdd = searchParams.get('add');
    if (mobileToAdd && !isFormOpen && patients !== undefined) {
      if (mobileToAdd === 'new') {
        setSelectedPatient(undefined);
        setIsFormOpen(true);
      } else {
        const exists = patients?.some(p => p.mobileNumber === mobileToAdd);
        if (!exists) {
          setSelectedPatient({ mobileNumber: mobileToAdd } as Patient);
          setIsFormOpen(true);
        }
      }
    }
  }, [searchParams, patients]); // Removed isFormOpen from dependencies to prevent re-opening loop

  const filteredPatients = React.useMemo(() => {
    if (!patients) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter(p =>
      (p.name?.toLowerCase() || '').includes(term) ||
      (p.mobileNumber || '').includes(term)
    );
  }, [patients, searchTerm]);

  const handleAdd = () => {
    setSelectedPatient(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !patientToDelete) return;
    deleteDocumentNonBlocking(doc(firestore, 'patients', patientToDelete.id));
    toast({
      variant: 'destructive',
      title: 'Patient Deleted',
      description: "The patient's record has been removed."
    });
    setPatientToDelete(null);
  }

  const handleViewDetails = (patientId: string) => {
    router.push(`/patients/details?id=${patientId}`);
  }

  return (
    <>
      {/* Follow-up Notification Banner */}
      {urgentFollowUps.length > 0 && (
        <div className="mb-4 rounded-lg border border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
              <Bell className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-orange-800 dark:text-orange-300">
                {urgentFollowUps.length} Follow-up{urgentFollowUps.length > 1 ? 's' : ''} Require Attention
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-400">The following patients have overdue or today's follow-ups.</p>
            </div>
          </div>
          <div className="space-y-2">
            {urgentFollowUps.map(fu => {
              const isOverdue = new Date(fu.followUpDate) < new Date(new Date().setHours(0, 0, 0, 0));
              return (
                <div
                  key={fu.id}
                  className="flex items-center justify-between bg-white dark:bg-orange-950/40 rounded-md px-3 py-2 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                  onClick={() => router.push(`/patients/details?id=${fu.patientId}`)}
                >
                  <div className="flex items-center gap-3">
                    {isOverdue
                      ? <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      : <Bell className="h-4 w-4 text-orange-500 flex-shrink-0" />}
                    <div>
                      <span className="font-medium text-sm">{fu.patientName}</span>
                      {fu.reason && <span className="text-xs text-muted-foreground ml-2">· {fu.reason}</span>}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                    {isOverdue ? 'Overdue' : 'Today'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
            <div className="flex items-center gap-2">
              <CardTitle>Patients</CardTitle>
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs font-bold bg-primary/10 text-primary border-primary/20">
                {patients?.length || 0} Total
              </Badge>
            </div>
            <CardDescription>
              Manage your clinic's patient records.
            </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setIsImportOpen(true)}>
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button size="sm" className="gap-1" onClick={handleAdd}>
                <PlusCircle className="h-4 w-4" />
                Add Patient
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>First Visit</TableHead>
                  <TableHead>Next Follow-up</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => {
                  const patientFollowUp = allFollowUps?.find(f => f.patientId === patient.id && f.status === 'Pending');
                  return (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">
                        <div
                          className="flex items-center gap-3 cursor-pointer hover:underline"
                          onClick={() => handleViewDetails(patient.id)}
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={patient.avatarUrl} alt={patient.name} />
                            <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="grid">
                            <span className="font-semibold">{patient.name}</span>
                            <span className="text-sm text-muted-foreground">{patient.mobileNumber}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{patient.age}</TableCell>
                      <TableCell>{patient.gender}</TableCell>
                      <TableCell>
                        {patient.registrationDate ? new Date(patient.registrationDate).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {patientFollowUp ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">
                              {new Date(patientFollowUp.followUpDate).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </span>
                            {(() => {
                              const date = new Date(patientFollowUp.followUpDate);
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const isOverdue = date < today;
                              const isTodayDate = date.toDateString() === new Date().toDateString();

                              if (isOverdue) return <Badge variant="destructive" className="w-fit text-[10px] h-4">Overdue</Badge>;
                              if (isTodayDate) return <Badge className="bg-orange-500 text-white w-fit text-[10px] h-4">Today</Badge>;
                              return <Badge variant="secondary" className="w-fit text-[10px] h-4">Upcoming</Badge>;
                            })()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewDetails(patient.id)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(patient)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setPatientToDelete(patient)}
                              className="text-red-600"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <PatientFormDialog open={isFormOpen} onOpenChange={handleOpenChange} patient={selectedPatient} />
      <PatientImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportSuccess={() => {
          // No need for manual refresh if useCollection is real-time, 
          // but we can add a toast or similar if needed.
        }}
      />

      <AlertDialog open={!!patientToDelete} onOpenChange={(open) => !open && setPatientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the patient's record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
