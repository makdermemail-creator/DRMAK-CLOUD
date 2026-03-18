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
    Building2,
    PlusCircle,
    Hospital,
    ArrowRight,
    ShieldAlert,
    Boxes,
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import type { Appointment, Patient, Doctor, BillingRecord, Lead, User, DailyPosting, SocialReport, AdminTaskTemplate, SocialReach, SocialSettings, DesignerWork, PharmacyItem } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, useUser, useDoc } from '@/firebase';
import { useSearch } from '@/context/SearchProvider';
import { add, format, startOfDay } from 'date-fns';
import { DatePicker } from '@/components/DatePicker';
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import { DailyTasksWidget } from '@/components/DailyTasksWidget';
import { useAnalyticsData } from '@/hooks/use-analytics-data';
import { useViewMode } from '@/context/ViewModeContext';

type AppointmentStatus = 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled';

const statusStyles: Record<AppointmentStatus, string> = {
    Waiting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'In Consultation': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    Completed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};


const BookAppointmentDialog = ({ open, onOpenChange, selectedTime, onAppointmentBooked }: { open: boolean, onOpenChange: (open: boolean) => void, selectedTime: Date | null, onAppointmentBooked: () => void }) => {
    const { toast } = useToast();
    const router = useRouter();
    const [step, setStep] = React.useState<'search' | 'add-patient' | 'book'>('search');
    const [mobileNumber, setMobileNumber] = React.useState('');
    const [newName, setNewName] = React.useState('');
    const [existingPatient, setExistingPatient] = React.useState<Patient | null>(null);
    const [doctor, setDoctor] = React.useState<string>('');

    const firestore = useFirestore();

    const patientsRef = useMemoFirebase(() => firestore ? collection(firestore, 'patients') : null, [firestore]);
    const doctorsRef = useMemoFirebase(() => firestore ? collection(firestore, 'doctors') : null, [firestore]);
    const appointmentsRef = useMemoFirebase(() => firestore ? collection(firestore, 'appointments') : null, [firestore]);

    const { data: patients } = useCollection<Patient>(patientsRef);
    const { data: doctors } = useCollection<Doctor>(doctorsRef);

    React.useEffect(() => {
        if (open) {
            setStep('search');
            setMobileNumber('');
            setNewName('');
            setExistingPatient(null);
            setDoctor('');
        }
    }, [open]);

    const handleSearch = () => {
        if (!mobileNumber) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a mobile number.' });
            return;
        }

        // Sanitize search input (keep digits only)
        const sanitizedSearch = mobileNumber.replace(/\D/g, '');

        // Find patient by matching sanitized mobile numbers
        const patient = patients?.find(p => {
            const sanitizedPatientMobile = (p.mobileNumber || '').replace(/\D/g, '');
            return sanitizedPatientMobile === sanitizedSearch;
        });

        if (patient) {
            setExistingPatient(patient);
            setStep('book');
        } else {
            setStep('add-patient');
        }
    };

    const handleSubmit = async () => {
        if (!selectedTime || !doctor) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please select a doctor.',
            });
            return;
        }

        let patientMobile = mobileNumber;

        if (step === 'add-patient') {
            if (!newName) {
                toast({ variant: 'destructive', title: 'Error', description: 'Please enter the patient name.' });
                return;
            }
            // Create new patient
            const newPatient: Omit<Patient, 'id'> = {
                name: newName,
                mobileNumber: mobileNumber,
                age: 0,
                gender: 'Other',
                avatarUrl: '',
                registrationDate: new Date().toISOString(),
                status: 'Active'
            };
            if (patientsRef) {
                await addDocumentNonBlocking(patientsRef, newPatient);
            }
        } else if (existingPatient) {
            patientMobile = existingPatient.mobileNumber;
        }

        const newAppointment: Omit<Appointment, 'id'> = {
            patientMobileNumber: patientMobile,
            doctorId: doctor,
            appointmentDateTime: selectedTime.toISOString(),
            status: 'Waiting',
        };

        if (appointmentsRef) {
            addDocumentNonBlocking(appointmentsRef, newAppointment);
        }

        toast({
            title: 'Appointment Booked',
            description: `Appointment successfully scheduled for ${format(selectedTime, 'PPp')}.`,
        });
        onAppointmentBooked();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {step === 'search' && "Search Patient"}
                        {step === 'add-patient' && "New Patient Details"}
                        {step === 'book' && "Confirm Appointment"}
                    </DialogTitle>
                    <DialogDescription>
                        {selectedTime ? format(selectedTime, 'MMMM d, h:mm a') : ''}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {step === 'search' && (
                        <div className="grid gap-2">
                            <Label htmlFor="mobile">Mobile Number</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="mobile"
                                    placeholder="Enter mobile number"
                                    value={mobileNumber}
                                    onChange={(e) => setMobileNumber(e.target.value)}
                                    type="tel"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <Button onClick={handleSearch}>Search</Button>
                            </div>
                        </div>
                    )}

                    {step === 'add-patient' && (
                        <div className="grid gap-2">
                            <div className="text-sm border-l-4 border-amber-500 bg-amber-50 p-3 text-amber-800 mb-2">
                                No patient found with number <strong>{mobileNumber}</strong>. Please enter details.
                            </div>
                            <p className="text-sm text-muted-foreground pb-2">
                                You need to register this patient with their full details before booking an appointment.
                            </p>
                            <div className="flex justify-end gap-2 mt-2">
                                <Button variant="ghost" onClick={() => setStep('search')}>Back</Button>
                                <Button onClick={() => router.push(`/patients?add=${mobileNumber}`)}>Go to Add Patient</Button>
                            </div>
                        </div>
                    )}

                    {step === 'book' && (
                        <div className="grid gap-4">
                            <div className="bg-muted p-3 rounded-md space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Patient Information</p>
                                <p className="font-semibold">{existingPatient?.name || newName}</p>
                                <p className="text-sm text-muted-foreground">{mobileNumber}</p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="doctor">Select Doctor</Label>
                                <Select onValueChange={setDoctor} value={doctor}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chose a doctor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {doctors?.map(d => (
                                            <SelectItem key={d.id} value={d.id}>{d.fullName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </div>

                {step === 'book' && (
                    <DialogFooter className="flex gap-2 sm:justify-between">
                        <Button variant="ghost" onClick={() => existingPatient ? setStep('search') : setStep('add-patient')}>Back</Button>
                        <Button onClick={handleSubmit}>Book Appointment</Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};


const DailySchedule = ({ appointments, date, onDateChange }: { appointments: (Appointment & { patient?: Patient, doctor?: Doctor })[], date: Date, onDateChange: (date: Date | undefined) => void }) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isBooking, setIsBooking] = React.useState(false);
    const [selectedTime, setSelectedTime] = React.useState<Date | null>(null);
    const [startHour, setStartHour] = React.useState(9);
    const [endHour, setEndHour] = React.useState(17);

    React.useEffect(() => {
        const savedStart = localStorage.getItem('scheduleStartHour');
        const savedEnd = localStorage.getItem('scheduleEndHour');
        if (savedStart) setStartHour(parseInt(savedStart));
        if (savedEnd) setEndHour(parseInt(savedEnd));
    }, []);

    const handleStartHourChange = (val: string) => {
        const hour = parseInt(val);
        setStartHour(hour);
        localStorage.setItem('scheduleStartHour', val);
    };

    const handleEndHourChange = (val: string) => {
        const hour = parseInt(val);
        setEndHour(hour);
        localStorage.setItem('scheduleEndHour', val);
    };

    const timeSlots = React.useMemo(() => {
        const slots = [];
        const start = new Date(date);
        start.setHours(startHour, 0, 0, 0);
        const end = new Date(date);
        end.setHours(endHour, 0, 0, 0);

        let currentTime = start;
        while (currentTime < end) {
            slots.push(new Date(currentTime));
            currentTime = add(currentTime, { minutes: 30 });
        }
        return slots;
    }, [date, startHour, endHour]);

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

    const handleStatusChange = (appointmentId: string, newStatus: AppointmentStatus) => {
        if (!firestore) return;
        updateDocumentNonBlocking(doc(firestore, 'appointments', appointmentId), { status: newStatus });
        toast({
            title: 'Status Updated',
            description: `Appointment status changed to ${newStatus}.`,
        });
    }

    const forceRerender = () => {
        // Dummy state change to force re-render and re-fetch from useCollection
    }

    return (
        <>
            <Card className="xl:col-span-2">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="grid gap-1">
                        <CardTitle>Daily Schedule</CardTitle>
                        <CardDescription>
                            An overview of appointments. Click a slot to book.
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">Start:</span>
                            <Select value={startHour.toString()} onValueChange={handleStartHourChange}>
                                <SelectTrigger className="h-8 w-[80px] text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <SelectItem key={i} value={i.toString()}>
                                            {format(new Date().setHours(i, 0), 'h aa')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">End:</span>
                            <Select value={endHour.toString()} onValueChange={handleEndHourChange}>
                                <SelectTrigger className="h-8 w-[80px] text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <SelectItem key={i} value={i.toString()}>
                                            {format(new Date().setHours(i, 0), 'h aa')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DatePicker date={date} onDateChange={onDateChange} />
                    </div>
                </CardHeader>
                <CardContent className="h-[400px] overflow-y-auto px-2 sm:px-4">
                    <div className="relative border-l-2 border-muted ml-6 sm:ml-12 pl-4 pb-4 mt-4">
                        {timeSlots.map(slot => {
                            const timeKey = format(slot, 'HH:mm');
                            const slotAppointments = appointmentsByTime.get(timeKey);

                            return (
                                <div key={timeKey} className="relative group min-h-[48px] py-1">
                                    {/* Time Label - Positioned absolutely to the left of the border */}
                                    <div className="absolute -left-[4.5rem] sm:-left-[5.5rem] top-2 font-medium text-xs text-muted-foreground w-12 sm:w-16 text-right">
                                        {format(slot, 'h:mm')}
                                    </div>
                                    <div className="absolute -left-[5.5rem] sm:-left-[6.5rem] top-5 font-bold text-[0.6rem] text-muted-foreground/60 w-12 sm:w-16 text-right uppercase">
                                        {format(slot, 'a')}
                                    </div>

                                    {/* The Timeline Node Dot */}
                                    <div className={`absolute -left-[21px] top-3 h-2 w-2 rounded-full border-2 border-background ring-2 ${slotAppointments ? 'bg-primary ring-primary/30' : 'bg-muted ring-transparent'}`} />

                                    {/* Content Area */}
                                    <div className="pl-4 sm:pl-6 w-full max-w-2xl">
                                        {slotAppointments ? (
                                            <div className="flex flex-col gap-2">
                                                {slotAppointments.map(apt => (
                                                    <div
                                                        key={apt.id}
                                                        className="relative bg-card text-card-foreground border rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow cursor-default overflow-hidden group/card"
                                                    >
                                                        {/* Status Color Strip */}
                                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${(statusStyles[apt.status as AppointmentStatus] || 'bg-gray-400').split(' ')[0]}`} />

                                                        <div className="pl-2 flex items-start justify-between">
                                                            <div>
                                                                <p className="font-semibold text-sm">{apt.patient?.name}</p>
                                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                    <UserCheck className="h-3 w-3" /> Dr. {apt.doctor?.fullName}
                                                                </p>
                                                            </div>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Badge className={`font-semibold text-[0.65rem] uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity ${statusStyles[apt.status as AppointmentStatus] || 'bg-gray-100 text-gray-800'}`}>
                                                                        {apt.status}
                                                                    </Badge>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(apt.id, 'Waiting'); }}>Waiting</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(apt.id, 'In Consultation'); }}>In Consultation</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(apt.id, 'Completed'); }}>Completed</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(apt.id, 'Cancelled'); }} className="text-red-500">Cancelled</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            /* Empty State / Hover to Book */
                                            <div
                                                onClick={() => handleSlotClick(slot)}
                                                className="h-10 mt-1 border border-dashed border-transparent rounded-lg flex items-center px-4 transition-all opacity-0 group-hover:opacity-100 group-hover:bg-muted/50 group-hover:border-border cursor-pointer"
                                            >
                                                <span className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                                    <PlusCircle className="h-3 w-3" /> Click slot to book appointment
                                                </span>
                                            </div>
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


const OrganizationDashboard = () => {
    const { searchTerm } = useSearch();
    const firestore = useFirestore();
    const { summaryMetrics, isLoading: analyticsLoading } = useAnalyticsData();

    // Fetch aggregated data for Organization
    const usersRef = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const leadsRef = useMemoFirebase(() => firestore ? collection(firestore, 'leads') : null, [firestore]);
    const tasksRef = useMemoFirebase(() => firestore ? collection(firestore, 'adminTaskTemplates') : null, [firestore]);

    const { data: users, isLoading: usersLoading } = useCollection<User>(usersRef);
    const { data: leads, isLoading: leadsLoading } = useCollection<Lead>(leadsRef);
    const { data: tasks, isLoading: tasksLoading } = useCollection<AdminTaskTemplate>(tasksRef);

    const isLoading = analyticsLoading || usersLoading || leadsLoading || tasksLoading;

    const leadStats = React.useMemo(() => {
        if (!leads) return { total: 0, new: 0, converted: 0, inProgress: 0 };
        return {
            total: leads.length,
            new: leads.filter(l => l.status === 'New Lead').length,
            converted: leads.filter(l => l.status === 'Converted').length,
            inProgress: leads.filter(l => l.status === 'In Progress').length,
        };
    }, [leads]);

    const usersByRole = React.useMemo(() => {
        if (!users) return [];
        const counts: Record<string, number> = {};
        users.forEach(u => {
            counts[u.role] = (counts[u.role] || 0) + 1;
        });
        return Object.entries(counts).map(([name, count]) => ({ name, count }));
    }, [users]);

    if (isLoading) {
        return (
            <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 auto-rows-max">
            {/* Top Metrics */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-white to-slate-50 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Team</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Active Employees</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sales Pipeline</CardTitle>
                        <Target className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{leadStats.total}</div>
                        <p className="text-xs text-blue-600/80">{leadStats.converted} Converted</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-white to-indigo-50 border-indigo-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
                        <Share2 className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryMetrics.totalReach.toLocaleString()}</div>
                        <p className="text-xs text-green-600">+{summaryMetrics.reachChange}% Month-over-Month</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-white to-orange-50 border-orange-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Admin Tasks</CardTitle>
                        <ListTodo className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tasks?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Active Templates</p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Analytics */}
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                {/* Sales Funnel Chart */}
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle>Organization Sales Funnel</CardTitle>
                        <CardDescription>Visualizing lead conversion status across the team.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ChartContainer config={{
                            count: { label: "Leads", color: "hsl(var(--primary))" }
                        }} className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart data={[
                                    { name: 'New Leads', count: leadStats.new },
                                    { name: 'In Progress', count: leadStats.inProgress },
                                    { name: 'Converted', count: leadStats.converted },
                                ]}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <RechartsTooltip content={<ChartTooltipContent />} />
                                    <RechartsBar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Team Composition */}
                <Card>
                    <CardHeader>
                        <CardTitle>Team Composition</CardTitle>
                        <CardDescription>Breakdown by Department</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {usersByRole.map((role) => (
                                <div key={role.name} className="flex items-center gap-4">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between text-sm font-medium leading-none">
                                            <span>{role.name}</span>
                                            <span>{role.count}</span>
                                        </div>
                                        <Progress value={(role.count / (users?.length || 1)) * 100} className="h-2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Leads Activity */}
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle>Top Leads Activity</CardTitle>
                        <CardDescription>Critical leads needing attention.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Channel</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads?.slice(0, 5).map((lead) => (
                                    <TableRow key={lead.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{lead.name}</span>
                                                <span className="text-xs text-muted-foreground">{lead.source}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={lead.status === 'Converted' ? 'default' : 'secondary'}>
                                                {lead.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href="/leads">View Details</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!leads || leads.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                            No recent leads activity.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Social Highlights */}
                <Card>
                    <CardHeader>
                        <CardTitle>Social Reach Trends</CardTitle>
                        <CardDescription>Monthly Growth</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px] flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto">
                                <TrendingUp className="h-8 w-8 text-primary" />
                            </div>
                            <div className="text-3xl font-bold text-primary">
                                +{summaryMetrics.reachChange}%
                            </div>
                            <p className="text-sm text-muted-foreground px-4">
                                Our social reach has grown significantly this month compared to the previous period.
                            </p>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/analytics">Full Social Report</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const { searchTerm } = useSearch();
    const firestore = useFirestore();
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);

    React.useEffect(() => {
        setSelectedDate(new Date());
    }, []);

    const appointmentsRef = useMemoFirebase(() => firestore ? collection(firestore, 'appointments') : null, [firestore]);
    const doctorsRef = useMemoFirebase(() => firestore ? collection(firestore, 'doctors') : null, [firestore]);
    const patientsRef = useMemoFirebase(() => firestore ? collection(firestore, 'patients') : null, [firestore]);
    const billingRecordsRef = useMemoFirebase(() => firestore ? collection(firestore, 'billingRecords') : null, [firestore]);

    const { data: appointments, isLoading: appointmentsLoading } = useCollection<Appointment>(appointmentsRef);
    const { data: doctors, isLoading: doctorsLoading } = useCollection<Doctor>(doctorsRef);
    const { data: patients, isLoading: patientsLoading } = useCollection<Patient>(patientsRef);
    const { data: billingRecords, isLoading: billingLoading } = useCollection<BillingRecord>(billingRecordsRef);

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
                apt.doctor?.fullName.toLowerCase().includes(term) ||
                (apt.patient?.mobileNumber && apt.patient.mobileNumber.toLowerCase().includes(term))
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

    const { dailyRevenue, todaysPatients, appointmentStats } = React.useMemo(() => {
        if (!selectedDate || !appointments) {
            return { dailyRevenue: 0, todaysPatients: 0, appointmentStats: { completed: 0, total: 0 } };
        }

        const selectedDayStart = startOfDay(selectedDate);
        const dayAppointments = appointments.filter(apt => {
            const aptDate = startOfDay(new Date(apt.appointmentDateTime));
            return aptDate.getTime() === selectedDayStart.getTime();
        });

        const total = dayAppointments.length;
        const completed = dayAppointments.filter(apt => apt.status === 'Completed').length;

        // Revenue calculation using BillingRecord fields
        let revenue = 0;
        if (billingRecords) {
            billingRecords.forEach(record => {
                const recordDate = startOfDay(new Date(record.billingDate));
                if (recordDate.getTime() === selectedDayStart.getTime()) {
                    revenue += record.grandTotal || record.totalAmount || ((record.consultationCharges || 0) + (record.procedureCharges || 0) + (record.medicineCharges || 0));
                }
            });
        }

        const uniquePatients = new Set(dayAppointments.map(a => a.patientMobileNumber)).size;

        return {
            dailyRevenue: revenue,
            todaysPatients: uniquePatients,
            appointmentStats: { completed, total }
        };
    }, [appointments, billingRecords, selectedDate]);

    const activeConsultations = React.useMemo(() => {
        if (!appointments || !selectedDate) return 0;
        const selectedDayStart = startOfDay(selectedDate);
        return appointments.filter(apt => {
            const aptDate = startOfDay(new Date(apt.appointmentDateTime));
            return aptDate.getTime() === selectedDayStart.getTime() && apt.status === 'In Consultation';
        }).length;
    }, [appointments, selectedDate]);

    const { summaryMetrics, isLoading: analyticsLoading } = useAnalyticsData();

    if (isLoading || analyticsLoading) {
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
                        <p className="text-xs text-muted-foreground">Total collected today</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Patients for {selectedDate ? format(selectedDate, 'MMM d') : 'Today'}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{todaysPatients}</div>
                        <p className="text-xs text-muted-foreground">Unique patient visits</p>
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
                        <CardTitle className="text-sm font-medium">Social Reach</CardTitle>
                        <Share2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryMetrics.totalReach.toLocaleString()}</div>
                        <p className={`text-xs ${summaryMetrics.reachChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {summaryMetrics.reachChange >= 0 ? '+' : ''}{summaryMetrics.reachChange}% from last month
                        </p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                <DailySchedule appointments={appointmentsForSelectedDate} date={selectedDate || new Date()} onDateChange={handleDateChange} />
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Patient Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {enrichedAppointments.slice(0, 5).map((apt, i) => (
                            <div key={apt.id || i} className="flex items-center gap-4">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={apt.patient?.avatarUrl || ""} alt="Avatar" />
                                    <AvatarFallback>{apt.patient?.name?.charAt(0) || "P"}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-1">
                                    <p className="text-sm font-medium leading-none">
                                        {apt.patient?.name || "Anonymous Patient"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {apt.status} - {apt.doctor?.fullName || "No Doctor"}
                                    </p>
                                </div>
                                <div className="ml-auto font-medium text-xs">
                                    {format(new Date(apt.appointmentDateTime), 'h:mm a')}
                                </div>
                            </div>
                        ))}
                        {enrichedAppointments.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

const SalesDashboard = () => {
    const firestore = useFirestore();
    const { user } = useUser();
    const leadsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'leads'), where('assignedTo', '==', user.id));
    }, [firestore, user]);

    const { data: leads, isLoading } = useCollection<Lead>(leadsQuery);
    const { summaryMetrics, isLoading: analyticsLoading } = useAnalyticsData();

    const stats = React.useMemo(() => {
        if (!leads) return { total: 0, new: 0, converted: 0, rate: '0.0' };
        const total = leads.length;
        const newLeads = leads.filter(l => l.status === 'New Lead').length;
        const converted = leads.filter(l => l.status === 'Converted').length;
        const rate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0';
        return { total, new: newLeads, converted, rate };
    }, [leads]);

    const leadsBySource = React.useMemo(() => {
        if (!leads) return [];
        const sources: Record<string, number> = {};
        leads.forEach(l => {
            sources[l.source] = (sources[l.source] || 0) + 1;
        });
        return Object.entries(sources)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [leads]);

    const chartConfig = {
        count: {
            label: "Leads",
            color: "hsl(var(--chart-1))",
        },
    } satisfies React.ComponentProps<typeof ChartContainer>["config"]

    if (isLoading || analyticsLoading) {
        return (
            <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 auto-rows-max">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Total records</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Leads</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{stats.new}</div>
                        <p className="text-xs text-muted-foreground">New leads this period</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Converted Leads</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.converted}</div>
                        <p className="text-xs text-muted-foreground">Successfully closed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Social Reach</CardTitle>
                        <Share2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryMetrics.totalReach.toLocaleString()}</div>
                        <p className={`text-xs ${summaryMetrics.reachChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {summaryMetrics.reachChange >= 0 ? '+' : ''}{summaryMetrics.reachChange}% from last month
                        </p>
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
                                {leads?.slice(0, 5).map((lead) => (
                                    <TableRow key={lead.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{lead.name}</span>
                                                <span className="text-xs text-muted-foreground">{lead.email || lead.phone}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={lead.status === 'Converted' ? 'default' : 'secondary'}>
                                                {lead.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{lead.source}</TableCell>
                                        <TableCell className="text-right text-xs">
                                            {lead.createdAt ? format(new Date(lead.createdAt), 'MMM dd') : 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!leads || leads.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">No leads to show.</TableCell>
                                    </TableRow>
                                )}
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
    const firestore = useFirestore();
    const { user } = useUser();
    const router = useRouter();

    const [todayStr, setTodayStr] = React.useState('');

    React.useEffect(() => {
        setTodayStr(format(new Date(), 'yyyy-MM-dd'));
    }, []);

    const appointmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'appointments'),
            where('doctorId', '==', user.doctorId || user.id)
        );
    }, [firestore, user]);

    const { data: rawAppointments, isLoading: appointmentsLoading } = useCollection<Appointment>(appointmentsQuery);

    const patientsRef = useMemoFirebase(() => firestore ? collection(firestore, 'patients') : null, [firestore]);
    const { data: patients, isLoading: patientsLoading } = useCollection<Patient>(patientsRef);

    const enrichedAppointments = React.useMemo(() => {
        if (!rawAppointments || !patients) return [];
        const today = startOfDay(new Date());

        return rawAppointments
            .filter(apt => {
                const aptDate = startOfDay(new Date(apt.appointmentDateTime));
                return aptDate.getTime() === today.getTime();
            })
            .map(apt => ({
                ...apt,
                patient: patients.find(p => p.mobileNumber === apt.patientMobileNumber)
            }))
            .sort((a, b) => new Date(a.appointmentDateTime).getTime() - new Date(b.appointmentDateTime).getTime());
    }, [rawAppointments, patients]);

    const stats = React.useMemo(() => {
        const total = enrichedAppointments.length;
        const completed = enrichedAppointments.filter(apt => apt.status === 'Completed').length;
        const waiting = enrichedAppointments.filter(apt => apt.status === 'Waiting').length;
        return { totalAppointments: total, completed, waiting };
    }, [enrichedAppointments]);

    const patientQueue = React.useMemo(() =>
        enrichedAppointments.filter(a => a.status === 'Waiting' || a.status === 'Checked In'),
        [enrichedAppointments]);

    if (appointmentsLoading || patientsLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

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
                                {enrichedAppointments.map((apt) => (
                                    <TableRow key={apt.id}>
                                        <TableCell className="font-medium">
                                            {format(new Date(apt.appointmentDateTime), 'hh:mm a')}
                                        </TableCell>
                                        <TableCell>{apt.patient?.name || 'Unknown Patient'}</TableCell>
                                        <TableCell><Badge variant={apt.status === 'Completed' ? 'secondary' : 'default'}>{apt.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => router.push(`/patients`)}>View Record</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {enrichedAppointments.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">No appointments for today.</TableCell>
                                    </TableRow>
                                )}
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
                                    <p className="font-semibold">{apt.patient?.name || 'Unknown'}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Waiting since {format(new Date(apt.appointmentDateTime), 'hh:mm a')}
                                    </p>
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



const ReportsDashboard = () => {
    const firestore = useFirestore();
    const { summaryMetrics } = useAnalyticsData();
    const [selectedRange, setSelectedRange] = React.useState<{ from: Date; to: Date } | undefined>();

    const billingRef = useMemoFirebase(() => firestore ? collection(firestore, 'billingRecords') : null, [firestore]);
    const usersRef = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const appointmentsRef = useMemoFirebase(() => firestore ? collection(firestore, 'appointments') : null, [firestore]);

    const { data: billingRecords } = useCollection<BillingRecord>(billingRef);
    const { data: users } = useCollection<User>(usersRef);
    const { data: appointments } = useCollection<Appointment>(appointmentsRef);

    const financialStats = React.useMemo(() => {
        if (!billingRecords) return { totalRevenue: 0, consultation: 0, procedures: 0, medicines: 0 };
        return billingRecords.reduce((acc, curr) => {
            const billTotal = curr.grandTotal || curr.totalAmount || ((curr.consultationCharges || 0) + (curr.procedureCharges || 0) + (curr.medicineCharges || 0));
            return {
                totalRevenue: acc.totalRevenue + billTotal,
                consultation: acc.consultation + (curr.consultationCharges || 0),
                procedures: acc.procedures + (curr.procedureCharges || 0),
                medicines: acc.medicines + (curr.medicineCharges || 0),
            };
        }, { totalRevenue: 0, consultation: 0, procedures: 0, medicines: 0 });
    }, [billingRecords]);

    const employeePerformance = React.useMemo(() => {
        if (!users || !appointments) return [];
        return users.map(u => {
            const userAppointments = appointments.filter(a => a.doctorId === u.id);
            const completed = userAppointments.filter(a => a.status === 'Completed').length;
            return {
                name: u.name || u.email?.split('@')[0] || 'Unknown',
                role: u.role,
                appointments: userAppointments.length,
                completed,
                efficiency: userAppointments.length > 0 ? Math.round((completed / userAppointments.length) * 100) : 0
            };
        }).sort((a, b) => b.completed - a.completed);
    }, [users, appointments]);

    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 auto-rows-max">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Financial & Performance Reports</h2>
                    <p className="text-muted-foreground">Comprehensive overview of clinic health and team productivity.</p>
                </div>
                <DatePickerWithRange />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-white to-emerald-50 border-emerald-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <CircleDollarSign className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rs {financialStats.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-emerald-600/80">All-time billing accumulated</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Consultations</CardTitle>
                        <Activity className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rs {financialStats.consultation.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Fees from doctor visits</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Procedures</CardTitle>
                        <Sparkles className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rs {financialStats.procedures.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Surgical & skin treatments</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Medicines</CardTitle>
                        <Boxes className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rs {financialStats.medicines.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Pharmacy sales revenue</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Employee Performance</CardTitle>
                        <CardDescription>Appointment completion rates and efficiency by staff member.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-center">Total Appts</TableHead>
                                    <TableHead className="text-center">Completed</TableHead>
                                    <TableHead className="text-right">Efficiency</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employeePerformance.map((emp) => (
                                    <TableRow key={emp.name}>
                                        <TableCell className="font-medium">{emp.name}</TableCell>
                                        <TableCell><Badge variant="outline">{emp.role}</Badge></TableCell>
                                        <TableCell className="text-center">{emp.appointments}</TableCell>
                                        <TableCell className="text-center text-emerald-600 font-semibold">{emp.completed}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-xs font-medium">{emp.efficiency}%</span>
                                                <Progress value={emp.efficiency} className="h-1.5 w-12" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Revenue Attribution</CardTitle>
                        <CardDescription>Breakdown by service category.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ChartContainer config={{
                            value: { label: "Revenue", color: "hsl(var(--primary))" }
                        }} className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart data={[
                                    { name: 'Consultations', value: financialStats.consultation },
                                    { name: 'Procedures', value: financialStats.procedures },
                                    { name: 'Medicines', value: financialStats.medicines },
                                ]}>
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `Rs${v / 1000}k`} />
                                    <RechartsTooltip content={<ChartTooltipContent />} />
                                    <RechartsBar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
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


const ViewModeSelection = ({ user, onSelect }: { user: any, onSelect: (mode: 'clinic' | 'organization' | 'reports') => void }) => {
    // Only true super users get automatic access to all boxes.
    const isSuperUser = user?.email === 'admin1@skinsmith.com' || user?.role === 'Admin';

    // Strict checks: Either superuser OR explicit feature flag.
    const hasOrgAccess = isSuperUser || !!user?.featureAccess?.['mgmt_organization'];
    const hasClinicAccess = isSuperUser || !!user?.featureAccess?.['mgmt_clinic'];
    const hasReportsAccess = isSuperUser || !!user?.featureAccess?.['mgmt_reports'];

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Welcome, {user?.name || 'Administrator'}</h2>
                <p className="text-muted-foreground text-lg">Please select a workstation to continue</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl px-4">
                {/* Organization Selection */}
                {hasOrgAccess && (
                    <Card
                        className="group relative overflow-hidden border-2 transition-all hover:border-primary cursor-pointer hover:shadow-xl bg-card/50 backdrop-blur-md"
                        onClick={() => onSelect('organization')}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Building2 className="h-32 w-32" />
                        </div>
                        <CardHeader className="space-y-4">
                            <div className="p-3 bg-primary/10 rounded-2xl w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Building2 className="h-8 w-8" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Organization</CardTitle>
                                <CardDescription className="text-base mt-2">
                                    Manage employees, reports, revenues, and overall organizational growth.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Employee Progress Reports</li>
                                <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Sales & Lead Dashboards</li>
                                <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Task & Training Management</li>
                            </ul>
                        </CardContent>
                        <div className="absolute bottom-4 right-6 flex items-center gap-2 font-semibold text-primary group-hover:translate-x-1 transition-transform">
                            Enter Workspace <ArrowRight className="h-4 w-4" />
                        </div>
                    </Card>
                )}

                {/* Reports Selection - SWAPPED TO SECOND SLOT */}
                {hasReportsAccess && (
                    <Card
                        className="group relative overflow-hidden border-2 transition-all hover:border-amber-500 cursor-pointer hover:shadow-xl bg-card/50 backdrop-blur-md"
                        onClick={() => onSelect('reports')}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BarChart className="h-32 w-32" />
                        </div>
                        <CardHeader className="space-y-4">
                            <div className="p-3 bg-amber-500/10 rounded-2xl w-fit group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                <BarChart className="h-8 w-8" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Reports & Analytics</CardTitle>
                                <CardDescription className="text-base mt-2">
                                    Access detailed financial statements and evaluate employee performance metrics.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Financial Reports & Revenue</li>
                                <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Employee Efficiency Metrics</li>
                                <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Performance Analytics</li>
                            </ul>
                        </CardContent>
                        <div className="absolute bottom-4 right-6 flex items-center gap-2 font-semibold text-amber-600 group-hover:translate-x-1 transition-transform">
                            View Reports <ArrowRight className="h-4 w-4" />
                        </div>
                    </Card>
                )}

                {/* Clinic Selection - SWAPPED TO THIRD SLOT */}
                {hasClinicAccess && (
                    <Card
                        className="group relative overflow-hidden border-2 transition-all hover:border-indigo-500 cursor-pointer hover:shadow-xl bg-card/50 backdrop-blur-md"
                        onClick={() => onSelect('clinic')}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Hospital className="h-32 w-32" />
                        </div>
                        <CardHeader className="space-y-4">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl w-fit group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                <Hospital className="h-8 w-8" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Manage Skin Smith</CardTitle>
                                <CardDescription className="text-base mt-2">
                                    Oversee daily clinic operations, appointments, patients, and medical records.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Core Clinic Operations</li>
                                <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Patient & Doctor Schedules</li>
                                <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Pharmacy & Records</li>
                            </ul>
                        </CardContent>
                        <div className="absolute bottom-4 right-6 flex items-center gap-2 font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
                            Enter Clinic <ArrowRight className="h-4 w-4" />
                        </div>
                    </Card>
                )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>You are currently in Administrative Entry Mode</span>
            </div>
        </div>
    );
};


export default function Dashboard() {
    const { user, isUserLoading } = useUser();
    const { viewMode, setViewMode } = useViewMode();
    const router = useRouter();

    // For the main Dashboard rendering logic, isMainAdmin means they have access to the ViewModeSelection screen
    // (either because they are a super user, OR because they have at least one mgmt_* flag)
    const isMainAdmin = React.useMemo(() =>
        user?.email === 'admin1@skinsmith.com' ||
        user?.role === 'Admin' ||
        user?.role === 'Operations Manager' ||
        user?.featureAccess?.['mgmt_clinic'] ||
        user?.featureAccess?.['mgmt_organization'] ||
        user?.featureAccess?.['mgmt_reports'],
        [user]);

    // Auto-routing logic for users with exactly ONE workstation feature granted
    const isSuperUser = React.useMemo(() =>
        user?.email === 'admin1@skinsmith.com' || user?.role === 'Admin',
        [user]);

    React.useEffect(() => {
        if (!isUserLoading && user && viewMode === 'none') {
            // Operations Manager always goes straight to the organization dashboard
            if (user.role === 'Operations Manager') {
                setViewMode('clinic');
                return;
            }

            if (!isSuperUser) {
                const hasOrg = !!user.featureAccess?.['mgmt_organization'];
                const hasClinic = !!user.featureAccess?.['mgmt_clinic'];
                const hasReports = !!user.featureAccess?.['mgmt_reports'];

                if (hasClinic && !hasOrg && !hasReports) {
                    setViewMode('clinic');
                } else if (hasOrg && !hasClinic && !hasReports) {
                    setViewMode('organization');
                } else if (hasReports && !hasOrg && !hasClinic) {
                    setViewMode('reports');
                }
            }
        }
    }, [isUserLoading, user, isSuperUser, viewMode, setViewMode]);

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

    // Role-based redirection for non-admins remains the same
    if (user?.role === 'Sales') return <SalesDashboard />;
    if (user?.role === 'Doctor') return <DoctorDashboard />;
    if (user?.role === 'Receptionist') return <ReceptionistDashboard />;

    if (user?.role === 'Social Media Manager') {
        return <div className="p-8 text-center flex flex-col items-center gap-4">
            <Loader2 className="animate-spin h-8 w-8" />
            <p className="text-muted-foreground">Redirecting to Social Dashboard...</p>
        </div>;
    }

    if (user?.role === 'Designer') {
        return <div className="p-8 text-center flex flex-col items-center gap-4">
            <Loader2 className="animate-spin h-8 w-8" />
            <p className="text-muted-foreground">Redirecting to Designer Dashboard...</p>
        </div>;
    }

    if (user?.role === 'Operations Manager') return <AdminDashboard />;

    // Main Admin Logic
    if (isMainAdmin) {
        if (viewMode === 'none') {
            return <ViewModeSelection user={user} onSelect={setViewMode} />;
        }

        if (viewMode === 'organization') {
            return <OrganizationDashboard />;
        }

        if (viewMode === 'clinic') {
            return <AdminDashboard />;
        }

        if (viewMode === 'reports') {
            return <ReportsDashboard />;
        }
    }

    // Default Fallback for Admins who haven't selected a mode or failed profile
    if (isMainAdmin) return <ViewModeSelection user={user} onSelect={setViewMode} />;

    // Default Fallback for regular accounts with no role or unhandled role
    return (
        <div className="p-12 text-center flex flex-col items-center gap-4">
            <ShieldAlert className="h-12 w-12 text-amber-500" />
            <h2 className="text-2xl font-bold">Access Denied or Role Not Configured</h2>
            <p className="text-muted-foreground max-w-md">
                Your account ({user?.email || 'Unauthorized User'}) does not have a dashboard assigned to the role "{user?.role || 'Guest'}".
                Please contact the administrator to set up your profile.
            </p>
            <Button onClick={() => router.push('/settings')} variant="outline">Go to Settings</Button>
        </div>
    );
}

