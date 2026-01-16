'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Loader2, ChevronLeft, ChevronRight, Printer, Edit, MessageSquare, CheckCircle, Video } from 'lucide-react';
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
 import { useToast } from '@/hooks/use-toast';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Label } from '@/components/ui/label';
 import { Input } from '@/components/ui/input';
 import { useRouter } from 'next/navigation';
 import { useSearch } from '@/context/SearchProvider';
 import { format, startOfWeek, addDays, eachDayOfInterval, startOfHour, addHours, isSameDay, isSameHour } from 'date-fns';
 import { DatePicker } from '@/components/DatePicker';

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


const BookAppointmentDialog = ({ open, onOpenChange, selectedDate, onAppointmentBooked }: { open: boolean, onOpenChange: (open: boolean) => void, selectedDate: Date | undefined, onAppointmentBooked: () => void }) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [patient, setPatient] = React.useState<string>('');
    const [doctor, setDoctor] = React.useState<string>('');
    const [time, setTime] = React.useState<string>('10:00');

    const patientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'patients') : null, [firestore]);
    const doctorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'doctors') : null, [firestore]);
    
    const { data: patients } = useCollection<Patient>(patientsQuery);
    const { data: doctors } = useCollection<Doctor>(doctorsQuery);

    const handleSubmit = () => {
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Book New Appointment</DialogTitle>
                    <DialogDescription>
                        Schedule a new appointment for {selectedDate?.toLocaleDateString()}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="patient" className="text-right">Patient</Label>
                        <Select onValueChange={setPatient} value={patient}>
                             <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a patient" />
                            </SelectTrigger>
                            <SelectContent>
                                {patients?.map(p => <SelectItem key={p.id} value={p.mobileNumber}>{p.name} - {p.mobileNumber}</SelectItem>)}
                            </SelectContent>
                        </Select>
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


const AppointmentsCalendarView = ({ appointments, week, onSlotClick }: { appointments: (Appointment & {patient?: Patient, doctor?: Doctor})[], week: Date[], onSlotClick: (date: Date) => void }) => {
    const timeSlots = Array.from({ length: 10 }, (_, i) => addHours(startOfHour(new Date()), i + 9)); // 9 AM to 6 PM

    return (
        <div className="relative grid grid-cols-[auto_1fr]">
            {/* Time labels */}
            <div className="grid grid-rows-10">
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
                {appointments.map(apt => {
                    const aptDate = new Date(apt.appointmentDateTime);
                    const dayIndex = week.findIndex(day => isSameDay(day, aptDate));
                    const hour = aptDate.getHours();
                    if (dayIndex === -1 || hour < 9 || hour > 18) return null;

                    const top = (hour - 9) * 80 + (aptDate.getMinutes() / 60) * 80;
                    const left = dayIndex * (100 / 7);

                    return (
                        <div
                            key={apt.id}
                            className="absolute p-2 rounded-lg bg-primary text-primary-foreground shadow-md"
                            style={{ top: `${top}px`, left: `calc(${left}% + 4px)`, width: 'calc(100% / 7 - 8px)', height: '50px' }}
                        >
                            <p className="text-xs font-bold truncate">{apt.patient?.name}</p>
                            <p className="text-xs truncate">{format(aptDate, 'h:mm a')}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const DailyAppointmentList = ({ appointments, stats }: { appointments: (Appointment & { patient?: Patient, doctor?: Doctor })[], stats: any }) => {

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
                                              <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                              <DropdownMenuItem><CheckCircle className="mr-2 h-4 w-4" /> Check In</DropdownMenuItem>
                                              <DropdownMenuItem><MessageSquare className="mr-2 h-4 w-4" /> Message</DropdownMenuItem>
                                               <DropdownMenuItem><Video className="mr-2 h-4 w-4" /> Consultation</DropdownMenuItem>
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
        </Tabs>
    )
}


export default function AppointmentsPage() {
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [isBooking, setIsBooking] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<Date | undefined>();
  const [selectedDoctor, setSelectedDoctor] = React.useState<string | 'all'>('all');
  
  const { searchTerm } = useSearch();
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
    if(term) {
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
        if(apt.status === 'Checked In') acc.checkedIn++;
        if(apt.status === 'In Consultation') acc.engaged++;
        if(apt.status === 'Completed') acc.checkedOut++;
        if(apt.status === 'No Show') acc.noShow++;
        if(apt.status === 'Confirmed') acc.confirmed++;
        return acc;
    }, defaultStats)
  }, [appointmentsForSelectedDay]);

  const handleSlotClick = (date: Date) => {
    setSelectedSlot(date);
    setIsBooking(true);
  }

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
                <Tabs defaultValue="week" className="w-fit">
                  <TabsList>
                    <TabsTrigger value="day">Day</TabsTrigger>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="month">Month</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button variant="outline"><Printer className="mr-2" /> Print</Button>
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
                    <AppointmentsCalendarView appointments={appointmentsForWeek} week={week} onSlotClick={handleSlotClick} />
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-0">
                    <DailyAppointmentList appointments={appointmentsForSelectedDay} stats={stats} />
                </CardContent>
            </Card>
       </div>

        <BookAppointmentDialog 
            open={isBooking}
            onOpenChange={setIsBooking}
            selectedDate={selectedSlot}
            onAppointmentBooked={forceRerender}
        />
    </div>
  );
}
