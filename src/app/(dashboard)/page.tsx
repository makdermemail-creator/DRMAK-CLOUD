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
    Hospital,
    ArrowRight,
    ShieldAlert,
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
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

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
                    revenue += (record.consultationCharges || 0) + (record.procedureCharges || 0) + (record.medicineCharges || 0);
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

    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const appointmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'appointments'),
            where('doctorId', '==', user.id)
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



const ReceptionistDashboard = () => {
    // For now, the receptionist dashboard can be the same as the admin dashboard
    // as it focuses on appointments and high-level stats.
    return <AdminDashboard />;
}


const ViewModeSelection = ({ onSelect }: { onSelect: (mode: 'clinic' | 'organization') => void }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Welcome, Administrator</h2>
                <p className="text-muted-foreground text-lg">Please select a workstation to continue</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
                {/* Organization Selection */}
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

                {/* Clinic Selection */}
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

    const isMainAdmin = React.useMemo(() =>
        user?.email === 'admin1@skinsmith.com' || user?.isMainAdmin || user?.role === 'Admin' || user?.isAdmin || user?.role === 'Operations Manager',
        [user]);

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

    if (user?.role === 'Operations Manager') {
        // Fall through to Main Admin Logic for workspace selection
    }

    // Main Admin Logic
    if (isMainAdmin) {
        if (viewMode === 'none') {
            return <ViewModeSelection onSelect={setViewMode} />;
        }

        if (viewMode === 'organization') {
            return <OrganizationDashboard />;
        }

        if (viewMode === 'clinic') {
            return <AdminDashboard />;
        }
    }

    // Default Fallback for Admins who haven't selected a mode or failed profile
    if (isMainAdmin) return <ViewModeSelection onSelect={setViewMode} />;

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

