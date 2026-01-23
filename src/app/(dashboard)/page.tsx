'use client';
import * as React from 'react';
import {
    Activity,
    ArrowUpRight,
    CalendarCheck,
    Calendar as CalendarIcon,
    CircleDollarSign,
    Users,
    Loader2,
    Clock,
    Target,
    TrendingUp,
    BarChart,
    FileText,
    UserCheck,
    Instagram,
    Facebook,
    Twitter,
    ThumbsUp,
    Share2,
    Video,
    ListTodo,
    Link as LinkIcon,
    Sparkles,
} from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { BarChart as RechartsBarChart, XAxis, YAxis, Bar as RechartsBar, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"

import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import {
    collection,
    query,
    where,
    orderBy,
    limit,
    doc,
    setDoc
} from 'firebase/firestore';
import type { Appointment, Patient, Doctor, BillingRecord, Lead, User, DailyPosting, SocialReport, AdminTaskTemplate, SocialReach, SocialSettings, DesignerWork } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, useUser, useDoc } from '@/firebase';
import { useSearch } from '@/context/SearchProvider';
import { add, format, startOfDay } from 'date-fns';
import { DatePicker } from '@/components/DatePicker';
import { DailyTasksWidget } from '@/components/DailyTasksWidget';

type AppointmentStatus = 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled';

const statusStyles: Record<AppointmentStatus, string> = {
    Waiting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'In Consultation': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    Completed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};


const BookAppointmentDialog = ({ open, onOpenChange, selectedTime, onAppointmentBooked }: { open: boolean, onOpenChange: (open: boolean) => void, selectedTime: Date | null, onAppointmentBooked: () => void }) => {
    const { toast } = useToast();
    const [patient, setPatient] = React.useState<string>('');
    const [doctor, setDoctor] = React.useState<string>('');

    const firestore = useFirestore();

    const patientsRef = useMemoFirebase(() => firestore ? collection(firestore, 'patients') : null, [firestore]);
    const doctorsRef = useMemoFirebase(() => firestore ? collection(firestore, 'doctors') : null, [firestore]);
    const appointmentsRef = useMemoFirebase(() => firestore ? collection(firestore, 'appointments') : null, [firestore]);

    const { data: patients } = useCollection<Patient>(patientsRef);
    const { data: doctors } = useCollection<Doctor>(doctorsRef);

    React.useEffect(() => {
        if (open) {
            setPatient('');
            setDoctor('');
        }
    }, [open]);

    const handleSubmit = () => {
        if (!selectedTime || !patient || !doctor) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please select a patient and a doctor.',
            });
            return;
        }

        const newAppointment: Omit<Appointment, 'id'> = {
            patientMobileNumber: patient,
            doctorId: doctor,
            appointmentDateTime: selectedTime.toISOString(),
            status: 'Waiting',
        };
        if (appointmentsRef) {
            addDocumentNonBlocking(appointmentsRef, newAppointment);
        }
        toast({
            title: 'Appointment Booked (Mock)',
            description: `Appointment has been successfully scheduled for ${format(selectedTime, 'PPp')}.`,
        });
        onAppointmentBooked();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Book New Appointment</DialogTitle>
                    <DialogDescription>
                        Schedule a new appointment for {selectedTime ? format(selectedTime, 'PPp') : ''}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="patient" className="text-right">
                            Patient
                        </Label>
                        <Select onValueChange={setPatient} value={patient}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a patient" />
                            </SelectTrigger>
                            <SelectContent>
                                {patients?.map(p => (
                                    <SelectItem key={p.id} value={p.mobileNumber}>{p.name} - {p.mobileNumber}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="doctor" className="text-right">
                            Doctor
                        </Label>
                        <Select onValueChange={setDoctor} value={doctor}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a doctor" />
                            </SelectTrigger>
                            <SelectContent>
                                {doctors?.map(d => (
                                    <SelectItem key={d.id} value={d.id}>{d.fullName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>Book Appointment</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const DailySchedule = ({ appointments, date, onDateChange }: { appointments: (Appointment & { patient?: Patient, doctor?: Doctor })[], date: Date, onDateChange: (date: Date | undefined) => void }) => {
    const [isBooking, setIsBooking] = React.useState(false);
    const [selectedTime, setSelectedTime] = React.useState<Date | null>(null);

    const timeSlots = React.useMemo(() => {
        const slots = [];
        const start = new Date(date);
        start.setHours(9, 0, 0, 0);
        const end = new Date(date);
        end.setHours(17, 0, 0, 0);

        let currentTime = start;
        while (currentTime < end) {
            slots.push(new Date(currentTime));
            currentTime = add(currentTime, { minutes: 30 });
        }
        return slots;
    }, [date]);

    const appointmentsByTime = React.useMemo(() => {
        const map = new Map<string, (Appointment & { patient?: Patient, doctor?: Doctor })[]>();
        appointments.forEach(apt => {
            const timeKey = format(new Date(apt.appointmentDateTime), 'HH:mm');
            if (!map.has(timeKey)) {
                map.set(timeKey, []);
            }
            map.get(timeKey)?.push(apt);
        })
        return map;
    }, [appointments]);

    const handleSlotClick = (slot: Date) => {
        setSelectedTime(slot);
        setIsBooking(true);
    }

    const forceRerender = () => {
        // Dummy state change to force re-render and re-fetch from useCollection
    }

    return (
        <>
            <Card className="xl:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                    <div className="grid gap-2">
                        <CardTitle>Daily Schedule</CardTitle>
                        <CardDescription>
                            An overview of appointments. Click a slot to book.
                        </CardDescription>
                    </div>
                    <DatePicker date={date} onDateChange={onDateChange} />
                </CardHeader>
                <CardContent className="h-[400px] overflow-y-auto">
                    <div className="grid grid-cols-1 gap-1">
                        {timeSlots.map(slot => {
                            const timeKey = format(slot, 'HH:mm');
                            const slotAppointments = appointmentsByTime.get(timeKey);

                            return (
                                <div key={timeKey} onClick={() => !slotAppointments && handleSlotClick(slot)} className={`flex items-start p-3 rounded-lg transition-colors ${!slotAppointments ? 'cursor-pointer hover:bg-muted' : ''}`}>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground w-20">
                                        <Clock className="h-4 w-4" />
                                        {format(slot, 'h:mm a')}
                                    </div>
                                    <div className="flex-1 pl-4 border-l border-border">
                                        {slotAppointments ? (
                                            slotAppointments.map(apt => (
                                                <div key={apt.id} className="text-sm p-2 mb-1 rounded-md bg-secondary text-secondary-foreground">
                                                    <p className="font-semibold">{apt.patient?.name}</p>
                                                    <p className="text-xs">with Dr. {apt.doctor?.fullName}</p>
                                                    <div className="mt-1">
                                                        <Badge className={`font-semibold text-xs ${statusStyles[apt.status as AppointmentStatus]}`}>
                                                            {apt.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-muted-foreground">Available</div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
            <BookAppointmentDialog open={isBooking} onOpenChange={setIsBooking} selectedTime={selectedTime} onAppointmentBooked={forceRerender} />
        </>
    );
};


const AdminDashboard = () => {
    const { searchTerm } = useSearch();
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

    const { data: appointments, isLoading: appointmentsLoading } = useCollection<Appointment>(null);
    const { data: doctors, isLoading: doctorsLoading } = useCollection<Doctor>(null);
    const { data: patients, isLoading: patientsLoading } = useCollection<Patient>(null);
    const { data: billingRecords, isLoading: billingLoading } = useCollection<BillingRecord>(null);

    const isLoading = appointmentsLoading || doctorsLoading || patientsLoading || billingLoading;

    const enrichedAppointments = React.useMemo(() => {
        if (!appointments || !doctors || !patients) return [];

        const doctorsMap = new Map(doctors.map(d => [d.id, d]));
        const patientsMap = new Map(patients.map(p => [p.mobileNumber, p]));

        let apts = appointments.map(apt => ({
            ...apt,
            doctor: doctorsMap.get(apt.doctorId),
            patient: patientsMap.get(apt.patientMobileNumber),
        }));

        const term = searchTerm.toLowerCase();
        if (term) {
            apts = apts.filter(apt =>
                apt.patient?.name.toLowerCase().includes(term) ||
                apt.doctor?.fullName.toLowerCase().includes(term)
            );
        }
        return apts;

    }, [appointments, doctors, patients, searchTerm]);

    const appointmentsForSelectedDate = React.useMemo(() => {
        if (!selectedDate) return [];
        const selectedDayStart = startOfDay(selectedDate);
        return enrichedAppointments.filter(apt => {
            const aptDate = startOfDay(new Date(apt.appointmentDateTime));
            return aptDate.getTime() === selectedDayStart.getTime();
        });
    }, [enrichedAppointments, selectedDate]);

    const dailyRevenue = 0;
    const todaysPatients = 0;
    const appointmentStats = { completed: 0, total: 0 };
    const activeConsultations = 0;

    if (isLoading) {
        return (
            <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    const handleDateChange = (date: Date | undefined) => {
        setSelectedDate(date);
    }

    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 auto-rows-max">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue for {selectedDate ? format(selectedDate, 'MMM d') : 'Today'}</CardTitle>
                        <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rs{dailyRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Backend disconnected</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Patients for {selectedDate ? format(selectedDate, 'MMM d') : 'Today'}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{todaysPatients}</div>
                        <p className="text-xs text-muted-foreground">Backend disconnected</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{appointmentStats.completed} / {appointmentStats.total}</div>
                        <p className="text-xs text-muted-foreground">Completed / Total for {selectedDate ? format(selectedDate, 'MMM d') : 'Today'}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{activeConsultations}</div>
                        <p className="text-xs text-muted-foreground">Backend disconnected</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                <DailySchedule appointments={appointmentsForSelectedDate} date={selectedDate || new Date()} onDateChange={handleDateChange} />
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Patient Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-8">
                        <p className="text-sm text-muted-foreground">Backend disconnected</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

const SalesDashboard = () => {
    const { data: leads, isLoading } = useCollection<Lead>(null);

    const stats = { total: 0, new: 0, converted: 0, rate: '0.0' };
    const leadsBySource: { name: string, count: number }[] = [];

    const chartConfig = {
        count: {
            label: "Leads",
            color: "hsl(var(--chart-1))",
        },
    } satisfies React.ComponentProps<typeof ChartContainer>["config"]

    if (isLoading) {
        return (
            <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 auto-rows-max">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Backend disconnected</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Leads</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{stats.new}</div>
                        <p className="text-xs text-muted-foreground">Backend disconnected</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Converted Leads</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.converted}</div>
                        <p className="text-xs text-muted-foreground">Backend disconnected</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.rate}%</div>
                        <p className="text-xs text-muted-foreground">Backend disconnected</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Leads</CardTitle>
                        <CardDescription>A list of your most recent sales leads.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Lead</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">Backend disconnected. No leads to show.</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Leads by Source</CardTitle>
                        <CardDescription>A breakdown of where your leads are coming from.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                            <RechartsBarChart accessibilityLayer data={leadsBySource} layout="vertical" margin={{ left: 10, right: 30 }}>
                                <XAxis type="number" dataKey="count" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => value.slice(0, 15)}
                                />
                                <RechartsTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                                <RechartsBar dataKey="count" layout="vertical" fill="var(--color-count)" radius={4} />
                            </RechartsBarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

const DoctorDashboard = () => {
    // MOCKED DATA FOR PROTOTYPE
    const stats = {
        totalAppointments: 12,
        completed: 5,
        waiting: 3,
    };

    const appointments = [
        { id: '1', patient: { name: 'Alex Johnson' }, time: '09:30 AM', status: 'Completed' },
        { id: '2', patient: { name: 'Maria Garcia' }, time: '10:00 AM', status: 'Completed' },
        { id: '3', patient: { name: 'Chen Wei' }, time: '11:00 AM', status: 'In Consultation' },
        { id: '4', patient: { name: 'Fatima Al-Fassi' }, time: '11:30 AM', status: 'Waiting' },
        { id: '5', patient: { name: 'James Smith' }, time: '12:00 PM', status: 'Waiting' },
    ];

    const patientQueue = appointments.filter(a => a.status === 'Waiting');

    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 auto-rows-max">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalAppointments}</div>
                        <p className="text-xs text-muted-foreground">Scheduled for today</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Consultations Completed</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completed}</div>
                        <p className="text-xs text-muted-foreground">of {stats.totalAppointments} appointments</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Patients Waiting</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.waiting}</div>
                        <p className="text-xs text-muted-foreground">In the queue right now</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle>Today's Appointments</CardTitle>
                        <CardDescription>A list of your appointments for {format(new Date(), 'MMMM dd, yyyy')}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {appointments.map((apt) => (
                                    <TableRow key={apt.id}>
                                        <TableCell className="font-medium">{apt.time}</TableCell>
                                        <TableCell>{apt.patient.name}</TableCell>
                                        <TableCell><Badge variant={apt.status === 'Completed' ? 'secondary' : 'default'}>{apt.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm">View Record</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Patient Queue</CardTitle>
                        <CardDescription>Patients checked in and waiting.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {patientQueue.length > 0 ? patientQueue.map(apt => (
                            <div key={apt.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <div>
                                    <p className="font-semibold">{apt.patient.name}</p>
                                    <p className="text-sm text-muted-foreground">Waiting since {apt.time}</p>
                                </div>
                                <Button size="sm">Start Consultation</Button>
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-8">No patients are currently in the queue.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};



const ReceptionistDashboard = () => {
    // For now, the receptionist dashboard can be the same as the admin dashboard
    // as it focuses on appointments and high-level stats.
    return <AdminDashboard />;
}


export default function Dashboard() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    React.useEffect(() => {
        if (!isUserLoading && user?.role === 'Sales') {
            router.push('/sales-dashboard');
        }
        if (!isUserLoading && user?.role === 'Social Media Manager') {
            router.push('/social-dashboard');
        }
        if (!isUserLoading && user?.role === 'Designer') {
            router.push('/designer-dashboard');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    if (user?.role === 'Sales') {
        return <SalesDashboard />;
    }

    if (user?.role === 'Doctor') {
        return <DoctorDashboard />;
    }

    if (user?.role === 'Social Media Manager') {
        return <div className="p-8 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;
    }


    if (user?.role === 'Receptionist') {
        return <ReceptionistDashboard />;
    }

    // Default to AdminDashboard for 'Admin' or any other roles
    return <AdminDashboard />;
}

