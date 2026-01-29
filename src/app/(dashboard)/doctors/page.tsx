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
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Loader2, Upload } from 'lucide-react';
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
import type { Doctor } from '@/lib/types';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useSearch } from '@/context/SearchProvider';

const DoctorFormDialog = ({ open, onOpenChange, doctor }: { open: boolean, onOpenChange: (open: boolean) => void, doctor?: Doctor }) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [formData, setFormData] = React.useState<Partial<Doctor>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) { // Reset form only when dialog opens
      if (doctor) {
        setFormData(doctor);
      } else {
        setFormData({});
      }
    }
  }, [doctor, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value.split(',').map(s => s.trim()) }));
  }



  const handleSubmit = () => {
    if (!firestore) return;

    const collectionRef = collection(firestore, 'doctors');

    if (doctor?.id) {
      const docRef = doc(collectionRef, doctor.id);
      updateDocumentNonBlocking(docRef, formData);
      toast({ title: "Doctor Updated", description: "The doctor's details have been updated." });
    } else {
      addDocumentNonBlocking(collectionRef, {
        ...formData,
        consultationFees: Number(formData.consultationFees) || 0,
      });
      toast({ title: "Doctor Added", description: "The new doctor has been added." });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{doctor ? 'Edit Doctor' : 'Add New Doctor'}</DialogTitle>
          <DialogDescription>
            {doctor ? "Update the doctor's details below." : "Fill in the details to add a new doctor."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fullName" className="text-right">Full Name</Label>
            <Input id="fullName" value={formData.fullName || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="specialization" className="text-right">Specialization</Label>
            <Input id="specialization" value={formData.specialization || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="qualification" className="text-right">Qualification</Label>
            <Input id="qualification" value={formData.qualification || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="consultationFees" className="text-right">Fees (Rs)</Label>
            <Input id="consultationFees" type="number" value={formData.consultationFees || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="availableDays" className="text-right">Available Days</Label>
            <Input id="availableDays" placeholder="Mon, Tue, Wed" value={formData.availableDays?.join(', ') || ''} onChange={handleArrayChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="availableTimings" className="text-right">Timings</Label>
            <Input id="availableTimings" placeholder="10 AM - 5 PM" value={formData.availableTimings || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Photo</Label>
            <div className="col-span-3">
              <AvatarUpload
                uid={doctor?.id || 'new-doctor'}
                currentPhotoURL={formData.avatarUrl}
                onUploadSuccess={(url) => setFormData(prev => ({ ...prev, avatarUrl: url }))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>{doctor ? 'Save Changes' : 'Add Doctor'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function DoctorsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { searchTerm } = useSearch();
  const doctorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'doctors') : null, [firestore]);
  const { data: doctors, isLoading } = useCollection<Doctor>(doctorsQuery);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedDoctor, setSelectedDoctor] = React.useState<Doctor | undefined>(undefined);

  const filteredDoctors = React.useMemo(() => {
    if (!doctors) return [];
    const term = searchTerm.toLowerCase();
    if (!term) return doctors;
    return doctors.filter(d =>
      d.fullName.toLowerCase().includes(term) ||
      d.specialization.toLowerCase().includes(term) ||
      d.qualification.toLowerCase().includes(term)
    );
  }, [doctors, searchTerm]);

  const handleAdd = () => {
    setSelectedDoctor(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsFormOpen(true);
  };

  const handleDelete = (doctorId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'doctors', doctorId);
    deleteDocumentNonBlocking(docRef);
    toast({
      variant: 'destructive',
      title: 'Doctor Deleted',
      description: "The doctor's record has been removed."
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Doctors</CardTitle>
              <CardDescription>
                Manage the doctors in your clinic.
              </CardDescription>
            </div>
            <Button size="sm" className="gap-1" onClick={handleAdd}>
              <PlusCircle className="h-4 w-4" />
              Add Doctor
            </Button>
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
                  <TableHead>Doctor</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Consultation Fee</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors?.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={doctor.avatarUrl} alt={doctor.fullName} />
                          <AvatarFallback>{doctor.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="grid">
                          <span className="font-semibold">{doctor.fullName}</span>
                          <span className="text-sm text-muted-foreground">{doctor.qualification}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doctor.specialization}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{doctor.availableDays?.join(', ')}</span>
                        <span className="text-sm text-muted-foreground">{doctor.availableTimings}</span>
                      </div>
                    </TableCell>
                    <TableCell>Rs{doctor.consultationFees?.toLocaleString()}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleEdit(doctor)}>Edit</DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">Delete</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the doctor's record.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(doctor.id)}>Delete</AlertDialogAction>
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
      <DoctorFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} doctor={selectedDoctor} />
    </>
  );
}
