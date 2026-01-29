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
import { MoreHorizontal, PlusCircle, Search, Loader2, Upload } from 'lucide-react';
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
import { collection, doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearch } from '@/context/SearchProvider';

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
    if (!formData.name || !formData.mobileNumber || !formData.age) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill in all required patient details.' });
      return;
    }

    const collectionRef = collection(firestore, 'patients');

    if (patient?.id) {
      updateDocumentNonBlocking(doc(collectionRef, patient.id), formData);
      toast({ title: "Patient Updated", description: "The patient's details have been updated." });
    } else {
      // Firestore will auto-generate an ID, but mobileNumber must be unique for our model
      const newPatientDoc = { ...formData, age: Number(formData.age) };
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
            <Label htmlFor="age" className="text-right">Age</Label>
            <Input id="age" type="number" value={formData.age || ''} onChange={handleChange} className="col-span-3" />
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
            <Label htmlFor="address" className="text-right">Address</Label>
            <Input id="address" value={formData.address || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Photo</Label>
            <div className="col-span-3">
              <AvatarUpload
                uid={patient?.id || formData.mobileNumber || 'new-patient'}
                currentPhotoURL={formData.avatarUrl}
                onUploadSuccess={(url) => setFormData(prev => ({ ...prev, avatarUrl: url }))}
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
  const router = useRouter();
  const { toast } = useToast();
  const { searchTerm } = useSearch();
  const firestore = useFirestore();
  const patientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'patients') : null, [firestore]);
  const { data: patients, isLoading } = useCollection<Patient>(patientsQuery);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | undefined>(undefined);

  const filteredPatients = React.useMemo(() => {
    if (!patients) return [];
    const term = searchTerm.toLowerCase();
    if (!term) return patients;
    return patients.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.mobileNumber.includes(term)
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

  const handleDelete = (patientId: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'patients', patientId));
    toast({
      variant: 'destructive',
      title: 'Patient Deleted',
      description: "The patient's record has been removed."
    })
  }

  const handleViewDetails = (patientId: string) => {
    router.push(`/patients/details?id=${patientId}`);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Patients</CardTitle>
              <CardDescription>
                Manage your clinic's patient records.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
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
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
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
                      {new Date().toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">Delete</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the patient's record.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(patient.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <PatientFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} patient={selectedPatient} />
    </>
  );
}
