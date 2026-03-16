'use client';
import * as React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Loader2, ChevronLeft, ChevronRight, Printer, Edit, MessageSquare, CheckCircle, Video, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import type { Appointment, Patient, Doctor } from '@/lib/types';
import { collection, doc } from 'firebase/firestore';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/context/SearchProvider';
import { format, startOfWeek, addDays, eachDayOfInterval, startOfHour, addHours, isSameDay, isSameHour } from 'date-fns';
import { DatePicker } from '@/components/DatePicker';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/firebase';

type AppointmentStatus = 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled' | 'No Show' | 'Checked In' | 'Confirmed';

const statusStyles: Record<AppointmentStatus, string> = {
    Waiting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'In Consultation': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    Completed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    'No Show': 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
    'Checked In': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    'Confirmed': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
};


const BookAppointmentDialog = ({ open, onOpenChange, selectedDate, onAppointmentBooked, time, setTime }: { open: boolean, onOpenChange: (open: boolean) => void, selectedDate: Date | undefined, onAppointmentBooked: () => void, time: string, setTime: (t: string) => void }) => {
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [patientId, setPatientId] = React.useState<string>('');
    const [patientSearch, setPatientSearch] = React.useState<string>('');
    const [isPatientOpen, setIsPatientOpen] = React.useState(false);
    const [doctor, setDoctor] = React.useState<string>('');

    const patientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'patients') : null, [firestore]);
    const doctorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'doctors') : null, [firestore]);

    const { data: patients } = useCollection<Patient>(patientsQuery);
    const { data: doctors } = useCollection<Doctor>(doctorsQuery);

    const filteredPatients = React.useMemo(() => {
        if (!patients) return [];
        const term = (patientSearch || '').toLowerCase().trim();
        if (!term) return patients;

        return patients.filter(p => {
            const name = (p.name || '').toLowerCase();
            const phone = (p.mobileNumber || '').toLowerCase();
            return name.includes(term) || phone.includes(term);
        }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [patients, patientSearch]);

    const selectedPatientData = React.useMemo(() => {
        return patients?.find(p => p.id === patientId);
    }, [patients, patientId]);

    const handleSubmit = () => {
        const patient = selectedPatientData?.mobileNumber;
        if (!firestore || !selectedDate || !patient || !doctor || !time) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please fill out all fields to book the appointment.',
            });
            return;
        }

        const [hours, minutes] = time.split(':').map(Number);
        const appointmentDateTime = new Date(selectedDate);
        appointmentDateTime.setHours(hours, minutes);

        const newAppointment: Omit<Appointment, 'id'> = {
            patientMobileNumber: patient,
            doctorId: doctor,
            appointmentDateTime: appointmentDateTime.toISOString(),
            status: 'Waiting',
        };

        addDocumentNonBlocking(collection(firestore, 'appointments'), newAppointment)
            .then(() => {
                toast({
                    title: 'Appointment Booked',
                    description: `Appointment has been successfully scheduled for ${new Date(appointmentDateTime).toLocaleString()}.`,
                });
                onAppointmentBooked();
                onOpenChange(false);
            })
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Book New Appointment</DialogTitle>
                    <DialogDescription>
                        Schedule a new appointment for {selectedDate?.toLocaleDateString()}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="patient" className="text-right">Patient</Label>
                        <div className="col-span-3 flex gap-2">
                            <Popover open={isPatientOpen} onOpenChange={setIsPatientOpen} modal={false}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={isPatientOpen}
                                        className="flex-1 justify-between font-normal h-10 px-3 overflow-hidden text-left"
                                    >
                                        <span className="truncate">
                                            {selectedPatientData ? (
                                                `${selectedPatientData.name} - ${selectedPatientData.mobileNumber}`
                                            ) : (
                                                <span className="text-muted-foreground">Select a patient...</span>
                                            )}
                                        </span>
                                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverPrimitive.Content
                                    align="start"
                                    side="bottom"
                                    sideOffset={4}
                                    className="z-[100] w-[350px] rounded-md border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
                                    onOpenAutoFocus={(e) => e.preventDefault()}
                                    onPointerDownOutside={(e) => e.preventDefault()}
                                    onInteractOutside={(e) => e.preventDefault()}
                                >
                                    <div className="flex flex-col h-[400px]">
                                        <div className="p-3 border-b bg-muted/30" onPointerDown={(e) => e.stopPropagation()}>
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search name or mobile..."
                                                    className="pl-9 h-9 border-muted focus-visible:ring-1"
                                                    value={patientSearch}
                                                    onChange={(e) => setPatientSearch(e.target.value)}
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onKeyDown={(e) => e.stopPropagation()}
                                                    onKeyUp={(e) => e.stopPropagation()}
                                                    onFocusCapture={(e) => e.stopPropagation()}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-1 scrollbar-thin">
                                            {filteredPatients.length === 0 ? (
                                                <div className="p-8 text-center text-sm text-muted-foreground">
                                                    {patientSearch ? "No matching patients found" : "Loading patients..."}
                                                </div>
                                            ) : (
                                                filteredPatients.map(p => (
                                                    <Button
                                                        key={p.id}
                                                        variant="ghost"
                                                        className={`w-full justify-start h-auto py-3 px-4 mb-0.5 flex flex-col items-start gap-0.5 ${patientId === p.id ? 'bg-accent' : ''}`}
                                                        onClick={() => {
                                                            setPatientId(p.id);
                                                            setPatientSearch('');
                                                            setIsPatientOpen(false);
                                                        }}
                                                    >
                                                        <span className="text-sm font-semibold">{p.name || 'Unknown'}</span>
                                                        <span className="text-xs text-muted-foreground">{p.mobileNumber}</span>
                                                    </Button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </PopoverPrimitive.Content>
                            </Popover>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 shrink-0"
                                onClick={() => router.push('/patients?add=new')}
                                title="Add New Patient"
                            >
                                <PlusCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="doctor" className="text-right">Doctor</Label>
                        <Select onValueChange={setDoctor} value={doctor}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a doctor" />
                            </SelectTrigger>
                            <SelectContent>
                                {doctors?.map(d => <SelectItem key={d.id} value={d.id}>{d.fullName}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="time" className="text-right">Time</Label>
                        <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>Book Appointment</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const AppointmentsCalendarView = ({ appointments, week, onSlotClick, draftTime, selectedDate }: { appointments: (Appointment & { patient?: Patient, doctor?: Doctor })[], week: Date[], onSlotClick: (date: Date) => void, draftTime?: string, selectedDate?: Date }) => {
    const timeSlots = Array.from({ length: 11 }, (_, i) => addHours(startOfHour(new Date().setHours(8, 0, 0, 0)), i)); // 8 AM to 6 PM

    const renderAppointmentBox = (apt: any, isDraft: boolean = false) => {
        const aptDate = new Date(apt.appointmentDateTime);
        const dayIndex = week.findIndex(day => isSameDay(day, aptDate));
        const hour = aptDate.getHours();
        if (dayIndex === -1 || hour < 8 || hour > 18) return null;

        const top = (hour - 8) * 80 + (aptDate.getMinutes() / 60) * 80;
        const left = dayIndex * (100 / 7);

        const customStyles = {
            top: `${top}px`,
            left: `calc(${left}% + 4px)`,
            width: 'calc(100% / 7 - 8px)',
            height: '50px'
        };

        return (
            <div
                key={isDraft ? 'draft' : apt.id}
                className={`absolute p-2 rounded-lg shadow-md transition-all duration-300 ${isDraft
                    ? 'bg-primary/20 border-2 border-primary border-dashed text-primary animate-pulse z-20'
                    : 'bg-primary text-primary-foreground z-10'
                    }`}
                style={customStyles}
            >
                <p className="text-xs font-bold truncate">{isDraft ? 'Draft Appointment' : apt.patient?.name}</p>
                <p className="text-xs truncate">{format(aptDate, 'h:mm a')}</p>
            </div>
        );
    };

    return (
        <div className="relative grid grid-cols-[auto_1fr]">
            {/* Time labels */}
            <div className="grid grid-rows-11">
                {timeSlots.map(time => (
                    <div key={time.toISOString()} className="h-20 pr-2 text-right text-sm text-muted-foreground">{format(time, 'ha')}</div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 border-l">
                {week.map(day => (
                    <div key={day.toISOString()} className="border-r">
                        {timeSlots.map(time => {
                            const slotDateTime = new Date(day);
                            slotDateTime.setHours(time.getHours(), time.getMinutes());

                            return (
                                <div key={time.toISOString()} onClick={() => onSlotClick(slotDateTime)} className="h-20 border-t cursor-pointer hover:bg-muted/50 transition-colors">
                                </div>
                            );
                        })}
                    </div>
                ))}
                {/* Render appointments */}
                {appointments.map(apt => renderAppointmentBox(apt))}

                {/* Render Draft Preview */}
                {draftTime && selectedDate && renderAppointmentBox({
                    id: 'draft',
                    appointmentDateTime: (() => {
                        const [hours, minutes] = draftTime.split(':').map(Number);
                        const d = new Date(selectedDate);
                        d.setHours(hours, minutes, 0, 0);
                        return d.toISOString();
                    })()
                }, true)}
            </div>
        </div>
    );
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

        const newCommunication = {
            patientId: patient.mobileNumber, // Using mobileNumber as ID consistency
            message,
            service,
            sentBy: user.id,
            sentAt: new Date().toISOString(),
        };

        const communicationsCollection = collection(firestore, `patients/${patient.mobileNumber}/communications`);
        await addDocumentNonBlocking(communicationsCollection, newCommunication);
        toast({ title: "Message Sent", description: "Your message has been logged." });
        setMessage('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send Message to {patient.name}</DialogTitle>
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

const DailyAppointmentList = ({ appointments, stats, onUpdateStatus, onMessage }: { appointments: (Appointment & { patient?: Patient, doctor?: Doctor })[], stats: any, onUpdateStatus: (aptId: string, status: AppointmentStatus) => void, onMessage: (patient: Patient) => void }) => {

    return (
        <Tabs defaultValue="calendar-view">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="doctor-view">Doctor View</TabsTrigger>
                <TabsTrigger value="calendar-view">Calendar View</TabsTrigger>
            </TabsList>
            <TabsContent value="doctor-view">
                <p className="p-4 text-center text-muted-foreground">Doctor view coming soon.</p>
            </TabsContent>
            <TabsContent value="calendar-view">
                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-lg font-bold">{stats.scheduled}</p>
                            <p className="text-xs text-muted-foreground">Scheduled</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold">{stats.checkedIn}</p>
                            <p className="text-xs text-muted-foreground">CheckedIn</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold">{stats.engaged}</p>
                            <p className="text-xs text-muted-foreground">Engaged</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold">{stats.checkedOut}</p>
                            <p className="text-xs text-muted-foreground">CheckedOut</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-destructive">{stats.noShow}</p>
                            <p className="text-xs text-muted-foreground">No Show</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold">{stats.confirmed}</p>
                            <p className="text-xs text-muted-foreground">Confirmed</p>
                        </div>
                    </div>
                    <h3 className="font-semibold">Total Appointments: {appointments.length}</h3>
                    <div className="space-y-4">
                        {appointments.map(apt => (
                            <div key={apt.id} className="p-3 rounded-lg border bg-card">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{apt.patient?.name}</p>
                                        <p className="text-sm text-muted-foreground">{format(new Date(apt.appointmentDateTime), 'h:mm a')}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={apt.status === 'No Show' ? 'text-destructive' : ''}>
                                            {apt.status}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => onUpdateStatus(apt.id, 'In Consultation')}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onUpdateStatus(apt.id, 'Checked In')}><CheckCircle className="mr-2 h-4 w-4" /> Check In</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => apt.patient && onMessage(apt.patient)}><MessageSquare className="mr-2 h-4 w-4" /> Message</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onUpdateStatus(apt.id, 'Completed')}><CheckCircle className="mr-2 h-4 w-4" /> Complete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">
                                    Dr. {apt.doctor?.fullName}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </TabsContent>
        </Tabs >
    )
}


export default function AppointmentsPage() {
    const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
    const [isBooking, setIsBooking] = React.useState(false);
    const [selectedSlot, setSelectedSlot] = React.useState<Date | undefined>();
    const [draftTime, setDraftTime] = React.useState<string>('10:00');
    const [selectedDoctor, setSelectedDoctor] = React.useState<string | 'all'>('all');
    const [viewMode, setViewMode] = React.useState<'day' | 'week' | 'month'>('week');
    const [selectedPatientForMessage, setSelectedPatientForMessage] = React.useState<Patient | null>(null);
    const [isMessageOpen, setIsMessageOpen] = React.useState(false);

    const { searchTerm } = useSearch();
    const { toast } = useToast();
    const firestore = useFirestore();

    const appointmentsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'appointments') : null, [firestore]);
    const doctorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'doctors') : null, [firestore]);
    const patientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'patients') : null, [firestore]);

    const { data: appointments, isLoading: appointmentsLoading, forceRerender } = useCollection<Appointment>(appointmentsQuery);
    const { data: doctors, isLoading: doctorsLoading } = useCollection<Doctor>(doctorsQuery);
    const { data: patients, isLoading: patientsLoading } = useCollection<Patient>(patientsQuery);

    const isLoading = appointmentsLoading || doctorsLoading || patientsLoading;

    const week = React.useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
        return eachDayOfInterval({ start, end: addDays(start, 6) });
    }, [currentDate]);

    const filteredAppointments = React.useMemo(() => {
        if (!appointments || !doctors || !patients) return [];

        const doctorsMap = new Map(doctors.map(d => [d.id, d]));
        const patientsMap = new Map(patients.map(p => [p.mobileNumber, p]));

        let apts = appointments.map(apt => ({
            ...apt,
            doctor: doctorsMap.get(apt.doctorId),
            patient: patientsMap.get(apt.patientMobileNumber),
        }));

        if (selectedDoctor !== 'all') {
            apts = apts.filter(apt => apt.doctorId === selectedDoctor);
        }

        const term = searchTerm.toLowerCase();
        if (term) {
            apts = apts.filter(apt =>
                apt.patient?.name.toLowerCase().includes(term) ||
                apt.doctor?.fullName.toLowerCase().includes(term)
            );
        }
        return apts;

    }, [appointments, doctors, patients, searchTerm, selectedDoctor]);

    const appointmentsForWeek = React.useMemo(() => {
        const weekStart = week[0];
        const weekEnd = week[6];
        return filteredAppointments.filter(apt => {
            const aptDate = new Date(apt.appointmentDateTime);
            return aptDate >= weekStart && aptDate <= weekEnd;
        })
    }, [filteredAppointments, week]);

    const appointmentsForSelectedDay = React.useMemo(() => {
        return filteredAppointments.filter(apt => isSameDay(new Date(apt.appointmentDateTime), currentDate));
    }, [filteredAppointments, currentDate])

    const stats = React.useMemo(() => {
        const defaultStats = { scheduled: 0, checkedIn: 0, engaged: 0, checkedOut: 0, noShow: 0, confirmed: 0 };
        return appointmentsForSelectedDay.reduce((acc, apt) => {
            acc.scheduled++;
            if (apt.status === 'Checked In') acc.checkedIn++;
            if (apt.status === 'In Consultation') acc.engaged++;
            if (apt.status === 'Completed') acc.checkedOut++;
            if (apt.status === 'No Show') acc.noShow++;
            if (apt.status === 'Confirmed') acc.confirmed++;
            return acc;
        }, defaultStats)
    }, [appointmentsForSelectedDay]);

    const handleSlotClick = (date: Date) => {
        setSelectedSlot(date);
        setDraftTime(format(date, 'HH:mm'));
        setIsBooking(true);
    }

    const handleUpdateStatus = (aptId: string, status: AppointmentStatus) => {
        if (!firestore) return;
        updateDocumentNonBlocking(doc(firestore, 'appointments', aptId), { status });
        toast({ title: 'Status Updated', description: `Appointment status is now ${status}.` });
        forceRerender();
    };

    const handleMessage = (patient: Patient) => {
        setSelectedPatientForMessage(patient);
        setIsMessageOpen(true);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="flex flex-col h-full gap-6">
            <Card className="flex-shrink-0">
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="grid gap-1">
                                <h1 className="text-2xl font-bold">Appointment</h1>
                                <Badge variant="outline" className="w-fit">General Consultations</Badge>
                            </div>
                            <Select value={selectedDoctor} onValueChange={(val) => setSelectedDoctor(val)}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="All Doctors" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Doctors</SelectItem>
                                    {doctors?.map(d => <SelectItem key={d.id} value={d.id}>{d.fullName}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <DatePicker date={currentDate} onDateChange={(d) => setCurrentDate(d || new Date())} />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center rounded-md border p-1">
                                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(prev => addDays(prev, -7))}><ChevronLeft /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(prev => addDays(prev, 7))}><ChevronRight /></Button>
                                <Button variant="ghost" onClick={() => setCurrentDate(new Date())}>Today</Button>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">{format(week[0], 'MMM dd')} - {format(week[6], 'MMM dd, yyyy')}</p>
                            <Tabs value={viewMode} onValueChange={(val: any) => setViewMode(val)} className="w-fit">
                                <TabsList>
                                    <TabsTrigger value="day">Day</TabsTrigger>
                                    <TabsTrigger value="week">Week</TabsTrigger>
                                    <TabsTrigger value="month">Month</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2" /> Print</Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6 flex-grow">
                <Card className="lg:col-span-2">
                    <CardHeader className="grid grid-cols-[auto_1fr]">
                        <div></div>
                        <div className="grid grid-cols-7 text-center">
                            {week.map(day => (
                                <div key={day.toISOString()} className={`p-2 ${isSameDay(day, currentDate) ? 'bg-primary/10 rounded-md' : ''}`}>
                                    <p className="font-semibold">{format(day, 'EEE')}</p>
                                    <p className="text-muted-foreground">{format(day, 'dd/MM')}</p>
                                </div>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="h-[600px] overflow-auto">
                        <AppointmentsCalendarView
                            appointments={appointmentsForWeek}
                            week={week}
                            onSlotClick={handleSlotClick}
                            draftTime={isBooking ? draftTime : undefined}
                            selectedDate={selectedSlot}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-0">
                        <DailyAppointmentList
                            appointments={appointmentsForSelectedDay}
                            stats={stats}
                            onUpdateStatus={handleUpdateStatus}
                            onMessage={handleMessage}
                        />
                    </CardContent>
                </Card>
            </div>

            <BookAppointmentDialog
                open={isBooking}
                onOpenChange={setIsBooking}
                selectedDate={selectedSlot}
                onAppointmentBooked={forceRerender}
                time={draftTime}
                setTime={setDraftTime}
            />
            {selectedPatientForMessage && (
                <SendMessageDialog
                    open={isMessageOpen}
                    onOpenChange={setIsMessageOpen}
                    patient={selectedPatientForMessage}
                />
            )}
        </div>
    );
}
