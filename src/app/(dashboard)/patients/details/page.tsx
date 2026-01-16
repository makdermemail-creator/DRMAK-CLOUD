'use client';
import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
    ChevronLeft, 
    Edit, 
    FileText, 
    Calendar, 
    FilePlus2, 
    Users, 
    HeartPulse, 
    MessageSquare, 
    Paperclip, 
    ClipboardList,
    Receipt,
    Route,
    Download,
    BellPlus,
    Trash2,
    PlusCircle
} from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase, useCollection, addDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import type { Patient, Doctor, Appointment, MedicalHistory, Communication, TreatmentPlan } from '@/lib/types';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DatePicker } from '@/components/DatePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow, format } from 'date-fns';

const actionItems = [
    { id: 'addInvoice', label: 'Add Invoice', icon: FilePlus2, href: '/invoices/create' },
    { id: 'addAppointment', label: 'Add Appointment', icon: Calendar, href: '#' },
    { id: 'familyHistory', label: 'Patient Family History', icon: Users, href: '/patients/family-history' },
    { id: 'addMedicalHistory', label: 'Add Medical History', icon: HeartPulse, href: '#' },
    { id: 'addHealthRecord', label: 'Add Health Record', icon: FilePlus2, href: '/health-records' },
    { id: 'sendMessage', label: 'Send Message', icon: MessageSquare, href: '#' },
    { id: 'addFile', label: 'Add File', icon: Paperclip, href: '#' },
    { id: 'treatmentPlan', label: 'Treatment Plan', icon: ClipboardList, href: '/treatment-plans' },
    { id: 'invoiceHistory', label: 'Invoice History', icon: Receipt, href: '/invoices/history' },
    { id: 'patientJourney', label: 'Patient Journey', icon: Route, href: '/patients/patient-journey' },
];

const AddAppointmentDialog = ({ open, onOpenChange, patient }: { open: boolean, onOpenChange: (open: boolean) => void, patient: Patient }) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { data: doctors } = useCollection<Doctor>(useMemoFirebase(() => firestore ? collection(firestore, 'doctors') : null, [firestore]));

    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [startTime, setStartTime] = React.useState('10:00');
    const [endTime, setEndTime] = React.useState('10:30');
    const [doctorId, setDoctorId] = React.useState<string>('');
    const [procedure, setProcedure] = React.useState('');
    const [comments, setComments] = React.useState('');

    const handleSubmit = async () => {
        if (!firestore || !date || !doctorId) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a date and doctor.' });
            return;
        }

        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const appointmentDateTime = new Date(date);
        appointmentDateTime.setHours(startHours, startMinutes);

        const newAppointment: Omit<Appointment, 'id'> = {
            patientMobileNumber: patient.mobileNumber,
            doctorId,
            appointmentDateTime: appointmentDateTime.toISOString(),
            status: 'Waiting',
            procedure,
            comments,
        };

        const appointmentsCollection = collection(firestore, `patients/${patient.id}/appointments`);
        await addDocumentNonBlocking(appointmentsCollection, newAppointment);
        toast({ title: "Appointment Scheduled", description: `Appointment for ${patient.name} has been booked.` });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Appointment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Patient</Label>
                        <Input value={patient.name} disabled />
                    </div>
                     <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2 col-span-1">
                            <Label>Date</Label>
                            <DatePicker date={date} onDateChange={setDate} />
                        </div>
                        <div className="space-y-2">
                            <Label>Start Time</Label>
                            <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label>End Time</Label>
                            <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Doctor</Label>
                        <Select onValueChange={setDoctorId} value={doctorId}>
                            <SelectTrigger><SelectValue placeholder="Select a doctor" /></SelectTrigger>
                            <SelectContent>
                                {doctors?.map(d => <SelectItem key={d.id} value={d.id}>{d.fullName}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Procedure</Label>
                        <Input placeholder="e.g., General Consultation" value={procedure} onChange={e => setProcedure(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Comments</Label>
                        <Textarea value={comments} onChange={e => setComments(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>Add Appointment</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const MedicalHistoryDialog = ({ open, onOpenChange, patient }: { open: boolean, onOpenChange: (open: boolean) => void, patient: Patient }) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [newHistory, setNewHistory] = React.useState('');
    
    const historyQuery = useMemoFirebase(() => {
        return firestore ? query(collection(firestore, `patients/${patient.id}/medicalHistory`), orderBy('createdAt', 'desc')) : null;
    }, [firestore, patient.id]);
    
    const { data: history, isLoading, forceRerender } = useCollection<MedicalHistory>(historyQuery);

    const handleSave = async () => {
        if (!firestore || !newHistory.trim()) return;

        const newEntry: Omit<MedicalHistory, 'id'> = {
            patientId: patient.id,
            type: 'History',
            text: newHistory,
            createdAt: new Date().toISOString(),
        };

        const historyCollection = collection(firestore, `patients/${patient.id}/medicalHistory`);
        await addDocumentNonBlocking(historyCollection, newEntry);
        toast({ title: "Medical history added." });
        setNewHistory('');
        forceRerender();
    };

    const handleDelete = async (id: string) => {
        if (!firestore) return;
        const docRef = doc(firestore, `patients/${patient.id}/medicalHistory`, id);
        await deleteDocumentNonBlocking(docRef);
        toast({ title: "History item deleted.", variant: 'destructive'});
        forceRerender();
    }
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Add Medical History</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="history">
                    <TabsList>
                        <TabsTrigger value="history">Medical History</TabsTrigger>
                        <TabsTrigger value="alerts">Alerts</TabsTrigger>
                        <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                    </TabsList>
                    <TabsContent value="history" className="pt-4">
                        <div className="space-y-4">
                            <div className="max-h-60 overflow-y-auto space-y-2 p-2 border rounded-md">
                                {isLoading ? <Loader2 className="animate-spin" /> : history && history.length > 0 ? (
                                    history.map(item => (
                                        <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-md">
                                            <span>{item.text}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(item.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No medical history has been added yet.</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="Click to add and press enter" 
                                    value={newHistory} 
                                    onChange={(e) => setNewHistory(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                />
                                <Button onClick={handleSave}>Save</Button>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="alerts" className="pt-4">
                         <p className="text-sm text-muted-foreground text-center py-4">Alerts feature coming soon.</p>
                    </TabsContent>
                    <TabsContent value="suggestions" className="pt-4">
                        <div className="p-3 border rounded-md">
                           <p className="text-sm font-semibold">Suggestions 2</p>
                           <p className="text-xs text-muted-foreground">Laser patient for maps since she has come for laser again and again</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

const SendMessageDialog = ({ open, onOpenChange, patient }: { open: boolean, onOpenChange: (open: boolean) => void, patient: Patient }) => {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [message, setMessage] = React.useState('');
    const [service, setService] = React.useState('sms');

    const handleSend = async () => {
        if (!firestore || !user || !message.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Message cannot be empty.' });
            return;
        }

        const newCommunication: Omit<Communication, 'id'> = {
            patientId: patient.id,
            message,
            service,
            sentBy: user.uid,
            sentAt: new Date().toISOString(),
        };

        const communicationsCollection = collection(firestore, `patients/${patient.id}/communications`);
        await addDocumentNonBlocking(communicationsCollection, newCommunication);
        toast({ title: "Message Sent", description: "Your message has been logged." });
        setMessage('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send Message</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Service</Label>
                        <Select onValueChange={setService} value={service}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sms">SMS</SelectItem>
                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea id="message" value={message} onChange={e => setMessage(e.target.value)} placeholder="Enter message here..." rows={4} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSend}>Send</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function PatientDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('id');

  const firestore = useFirestore();
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = React.useState(false);
  const [isMedicalHistoryDialogOpen, setIsMedicalHistoryDialogOpen] = React.useState(false);
  const [isSendMessageDialogOpen, setIsSendMessageDialogOpen] = React.useState(false);


  const patientDocRef = useMemoFirebase(() => {
    if (!firestore || !patientId) return null;
    return doc(firestore, 'patients', patientId);
  }, [firestore, patientId]);
  
  const communicationsQuery = useMemoFirebase(() => {
      if (!firestore || !patientId) return null;
      return query(collection(firestore, `patients/${patientId}/communications`), orderBy('sentAt', 'desc'));
  }, [firestore, patientId]);

  const { data: patient, isLoading: patientLoading } = useDoc<Patient>(patientDocRef);
  const { data: communications, isLoading: communicationsLoading } = useCollection<Communication>(communicationsQuery);


  const handleActionClick = (id: string, href: string) => {
    if (id === 'addAppointment') {
        setIsAppointmentDialogOpen(true);
    } else if (id === 'addMedicalHistory') {
        setIsMedicalHistoryDialogOpen(true);
    } else if (id === 'sendMessage') {
        setIsSendMessageDialogOpen(true);
    }
     else {
        router.push(`${href}?id=${patientId}`);
    }
  }

  if (patientLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Patient not found</h2>
        <p className="text-muted-foreground">The requested patient could not be found.</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ChevronLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <>
    <div className="flex gap-6">
        {/* Left Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-6">
            <Card>
                <CardContent className="pt-6 text-center">
                     <Avatar className="h-24 w-24 mb-4 mx-auto">
                        <AvatarImage src={patient.avatarUrl} />
                        <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-lg font-semibold">{patient.name}</h2>
                    <p className="text-sm text-muted-foreground">{patient.gender?.toUpperCase()}</p>
                    <Separator className="my-3"/>
                     <div className="text-xs text-muted-foreground text-left space-y-1">
                        <p><strong>MRN:</strong> {patient.id.slice(0,8)}</p>
                        <p><strong>HIN ID:</strong> 000011030024</p>
                        <p><strong>Phone:</strong> {patient.mobileNumber}</p>
                    </div>
                    <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700">
                        <BellPlus className="mr-2 h-4 w-4" /> Add Reminder
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-2">
                    <div className="space-y-1">
                        <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => router.push(`/patients/edit?id=${patient.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Profile
                        </Button>
                         {actionItems.map(item => (
                            <Button key={item.id} variant="ghost" className="w-full justify-start text-sm" onClick={() => handleActionClick(item.id, item.href)}>
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.label}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardContent className="p-4 space-y-4">
                     <div className="flex items-center justify-between">
                        <Label htmlFor="follow-up" className="text-sm">Set Followup</Label>
                        <Switch id="follow-up" />
                    </div>
                    <Button variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" /> Download Patient
                    </Button>
                </CardContent>
            </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <Card className="lg:col-span-2">
                    <CardHeader><CardTitle className="text-base">OPD</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">No appointment has been added yet.</p>
                    </CardContent>
                    <CardFooter>
                        <p className="text-sm font-semibold ml-auto">0 Total</p>
                    </CardFooter>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">Last Invoice</CardTitle></CardHeader>
                    <CardContent className="space-y-1 text-sm">
                        <div className="flex justify-between"><span>gluta max cream</span> <span>1500.13</span></div>
                        <div className="flex justify-between"><span>irene bright acid serum 10%</span> <span>2307.77</span></div>
                        <div className="flex justify-between"><span>MAXRON</span> <span>2320.01</span></div>
                        <div className="flex justify-between"><span>PURI-SEBOSTATIC</span> <span>4809.45</span></div>
                        <div className="flex justify-between"><span>FLEXONE</span> <span>1325.64</span></div>
                        <Separator className="my-2"/>
                        <div className="flex justify-between font-semibold"><span>Total (Billed Amount)</span><span>12263.0</span></div>
                        <div className="flex justify-between font-semibold"><span>Amount Paid</span><span>12263.0</span></div>
                        <div className="flex justify-between font-semibold"><span>Dues:</span><span>0.00</span></div>
                        <div className="flex justify-between font-semibold"><span>Advance:</span><span>0.00</span></div>
                        <div className="flex justify-between font-semibold"><span>Total Dues:</span><span>0.00</span></div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="link" className="text-xs h-auto p-0 ml-auto">View all</Button>
                    </CardFooter>
                </Card>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-base">Recent Files</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground">No Files Found</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">Patient Family History</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground">No patient family history has been added yet.</p></CardContent>
                </Card>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-base">Recent Communications</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {communicationsLoading ? (
                            <Loader2 className="animate-spin" />
                        ) : communications && communications.length > 0 ? (
                            communications.map(comm => (
                                <div key={comm.id} className="text-xs text-muted-foreground">
                                    <p>
                                        Message sent via {comm.service}
                                        <span className="float-right">{formatDistanceToNow(new Date(comm.sentAt), { addSuffix: true })}</span>
                                    </p>
                                    <p className="text-sm text-foreground bg-muted p-2 rounded-md mt-1">{comm.message}</p>
                                </div>
                            ))
                        ) : (
                             <p className="text-sm text-muted-foreground">No Communications found.</p>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="text-base">Treatment Plan</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground">Not Available.</p></CardContent>
                </Card>
            </div>
        </div>
    </div>
    <AddAppointmentDialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen} patient={patient} />
    <MedicalHistoryDialog open={isMedicalHistoryDialogOpen} onOpenChange={setIsMedicalHistoryDialogOpen} patient={patient} />
    <SendMessageDialog open={isSendMessageDialogOpen} onOpenChange={setIsSendMessageDialogOpen} patient={patient} />
    </>
  );
}
