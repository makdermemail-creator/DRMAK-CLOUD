'use client';
import * as React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Printer,
    Edit,
    CheckCircle,
    Loader2,
    Bell,
    PlusCircle,
    Calendar as CalendarIcon,
    Search,
    XCircle,
    CheckCircle2,
    CalendarRange,
    Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    useCollection,
    useFirestore,
    useMemoFirebase,
    addDocumentNonBlocking,
    updateDocumentNonBlocking,
    deleteDocumentNonBlocking
} from '@/firebase';
import type { FollowUp, Patient } from '@/lib/types';
import { collection, doc, query, orderBy, where } from 'firebase/firestore';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/context/SearchProvider';
import { format, startOfWeek, addDays, eachDayOfInterval, startOfHour, addHours, isSameDay, isSameHour, isPast, isToday, isTomorrow } from 'date-fns';
import { DatePicker } from '@/components/DatePicker';

// ─── Add Follow-up Dialog ───────────────────────────────────────────────────

const AddFollowUpDialog = ({ open, onOpenChange, onFollowUpAdded }: { open: boolean, onOpenChange: (open: boolean) => void, onFollowUpAdded: () => void }) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [patientId, setPatientId] = React.useState<string>('');
    const [patientSearch, setPatientSearch] = React.useState<string>('');
    const [isPatientOpen, setIsPatientOpen] = React.useState(false);
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [reason, setReason] = React.useState('');
    const [notes, setNotes] = React.useState('');

    const patientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'patients') : null, [firestore]);
    const { data: patients } = useCollection<Patient>(patientsQuery);

    const filteredPatients = React.useMemo(() => {
        if (!patients) return [];
        const term = (patientSearch || '').toLowerCase().trim();
        if (!term) return patients.slice(0, 200);

        return patients.filter(p => {
            const name = (p.name || '').toLowerCase();
            const phone = (p.mobileNumber || '').toLowerCase();
            return name.includes(term) || phone.includes(term);
        }).slice(0, 200);
    }, [patients, patientSearch]);

    const selectedPatientData = React.useMemo(() => {
        return patients?.find(p => p.id === patientId);
    }, [patients, patientId]);

    const handleSubmit = async () => {
        if (!firestore || !date || !patientId) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please select a patient and date to schedule the follow-up.',
            });
            return;
        }

        const newFollowUp: Omit<FollowUp, 'id'> = {
            patientId,
            patientName: selectedPatientData?.name || 'Unknown',
            patientMobile: selectedPatientData?.mobileNumber || '',
            followUpDate: date.toISOString(),
            reason,
            notes,
            status: 'Pending',
            createdAt: new Date().toISOString(),
        };

        await addDocumentNonBlocking(collection(firestore, 'followUps'), newFollowUp);
        toast({
            title: 'Follow-up Scheduled',
            description: `Follow-up for ${selectedPatientData?.name} set for ${format(date, 'PPP')}.`,
        });
        onFollowUpAdded();
        onOpenChange(false);
        // Reset form
        setPatientId('');
        setReason('');
        setNotes('');
        setDate(new Date());
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Schedule New Follow-up</DialogTitle>
                    <DialogDescription>
                        Set a follow-up reminder for a patient.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Patient</Label>
                        <div className="relative">
                            <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between font-normal"
                                onClick={() => setIsPatientOpen(!isPatientOpen)}
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

                            {isPatientOpen && (
                                <div className="absolute top-full left-0 z-[100] w-full mt-2 rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                                    <div className="flex flex-col h-[300px]">
                                        <div className="p-2 border-b flex items-center gap-2">
                                            <Input
                                                placeholder="Search name or mobile..."
                                                value={patientSearch}
                                                onChange={(e) => setPatientSearch(e.target.value)}
                                                autoFocus
                                            />
                                            <Button size="icon" variant="ghost" onClick={() => setIsPatientOpen(false)}>
                                              <XCircle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-1">
                                            {filteredPatients.map(p => (
                                                <Button
                                                    key={p.id}
                                                    variant="ghost"
                                                    className="w-full justify-start h-auto py-2 px-3 flex flex-col items-start gap-0.5"
                                                    onClick={() => {
                                                        setPatientId(p.id);
                                                        setIsPatientOpen(false);
                                                    }}
                                                >
                                                    <span className="text-sm font-semibold">{p.name}</span>
                                                    <span className="text-xs text-muted-foreground">{p.mobileNumber}</span>
                                                </Button>
                                            ))}
                                            {filteredPatients.length === 0 && (
                                                <div className="p-4 text-center text-sm text-muted-foreground">
                                                    No patients found.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Follow-up Date</Label>
                        <DatePicker date={date} onDateChange={setDate} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Reason</Label>
                        <Input
                            placeholder="e.g., Post-laser check, Vaccine dose 2..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Notes (Optional)</Label>
                        <Textarea
                            placeholder="Additional details..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>Schedule Follow-up</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ─── Follow-up Calendar View ────────────────────────────────────────────────

const FollowUpCalendarView = ({ followUps, week, onSlotClick }: { followUps: FollowUp[], week: Date[], onSlotClick: (date: Date) => void }) => {
    const timeSlots = Array.from({ length: 11 }, (_, i) => addHours(startOfHour(new Date().setHours(8, 0, 0, 0)), i));

    const renderFollowUpBox = (fu: FollowUp) => {
        const fuDate = new Date(fu.followUpDate);
        const dayIndex = week.findIndex(day => isSameDay(day, fuDate));
        if (dayIndex === -1) return null;

        // For follow-ups, we don't have a specific time in the model, 
        // default to placing them at the top or distributing them if multiple.
        // Let's place them in a stack at the top.
        const top = 0; // Stack at the very top for now since we don't have time
        const left = dayIndex * (100 / 7);

        return (
            <div
                key={fu.id}
                className={`absolute p-2 rounded-lg shadow-md border-l-4 transition-all duration-300 z-10 ${fu.status === 'Completed'
                    ? 'bg-muted border-green-500 opacity-60'
                    : isPast(new Date(fu.followUpDate)) && !isToday(new Date(fu.followUpDate))
                        ? 'bg-red-50 border-red-500 dark:bg-red-950/20'
                        : 'bg-orange-50 border-orange-500 dark:bg-orange-950/20'
                    }`}
                style={{ top: `${top}px`, left: `calc(${left}% + 4px)`, width: 'calc(100% / 7 - 8px)', minHeight: '60px' }}
            >
                <p className="text-xs font-bold truncate pr-6">{fu.patientName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{fu.reason || 'No reason specified'}</p>
                {fu.status === 'Pending' && (
                    <div className="flex gap-1 mt-1 justify-end">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 cursor-pointer" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="relative grid grid-cols-[auto_1fr]">
            <div className="grid grid-rows-1">
                <div className="h-[600px] pr-2 text-right text-sm text-muted-foreground font-medium py-2">All Day</div>
            </div>

            <div className="grid grid-cols-7 border-l">
                {week.map(day => (
                    <div
                        key={day.toISOString()}
                        className="border-r h-[600px] hover:bg-muted/30 transition-colors relative"
                        onClick={() => onSlotClick(day)}
                    >
                    </div>
                ))}
                {followUps.map(fu => renderFollowUpBox(fu))}
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FollowUpCalendarPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { searchTerm } = useSearch();
    const firestore = useFirestore();

    const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
    const [isAdding, setIsAdding] = React.useState(false);
    const [selectedSlot, setSelectedSlot] = React.useState<Date | undefined>();
    const [viewMode, setViewMode] = React.useState<'week' | 'month'>('week');

    const followUpsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'followUps'), orderBy('followUpDate', 'asc'));
    }, [firestore]);

    const { data: allFollowUps, isLoading, forceRerender } = useCollection<FollowUp>(followUpsQuery);

    const week = React.useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end: addDays(start, 6) });
    }, [currentDate]);

    const filteredFollowUps = React.useMemo(() => {
        if (!allFollowUps) return [];
        let filtered = allFollowUps;

        const term = searchTerm.toLowerCase();
        if (term) {
            filtered = filtered.filter(fu =>
                fu.patientName.toLowerCase().includes(term) ||
                fu.patientMobile.includes(term) ||
                (fu.reason || '').toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [allFollowUps, searchTerm]);

    const weekFollowUps = React.useMemo(() => {
        const start = week[0];
        const end = addDays(week[6], 1); // End of week
        return filteredFollowUps.filter(fu => {
            const date = new Date(fu.followUpDate);
            return date >= start && date < end;
        });
    }, [filteredFollowUps, week]);

    const handleUpdateStatus = async (fuId: string, status: FollowUp['status']) => {
        if (!firestore) return;
        await updateDocumentNonBlocking(doc(firestore, 'followUps', fuId), { status });
        toast({ title: 'Status Updated', description: `Follow-up is now ${status}.` });
        forceRerender();
    };

    const handleDelete = async (fuId: string) => {
        if (!firestore) return;
        await deleteDocumentNonBlocking(doc(firestore, 'followUps', fuId));
        toast({ title: 'Follow-up Removed', variant: 'destructive' });
        forceRerender();
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
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    <CalendarRange className="h-6 w-6 text-primary" /> Follow-up Calendar
                                </h1>
                                <Badge variant="outline" className="w-fit">Patient Reminders & Retention</Badge>
                            </div>
                            <DatePicker date={currentDate} onDateChange={(d) => setCurrentDate(d || new Date())} />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center rounded-md border p-1">
                                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(prev => addDays(prev, -7))}><ChevronLeft /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(prev => addDays(prev, 7))}><ChevronRight /></Button>
                                <Button variant="ghost" onClick={() => setCurrentDate(new Date())}>Today</Button>
                            </div>
                            <Button className="gap-2" onClick={() => setIsAdding(true)}>
                                <PlusCircle className="h-4 w-4" /> Schedule Follow-up
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid lg:grid-cols-4 gap-6 flex-grow">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <div className="grid grid-cols-7 text-center border-b pb-4">
                            {week.map(day => (
                                <div key={day.toISOString()} className={`p-2 ${isSameDay(day, currentDate) ? 'bg-primary/10 rounded-md' : ''}`}>
                                    <p className="text-xs uppercase font-bold text-muted-foreground">{format(day, 'EEE')}</p>
                                    <p className="text-lg font-semibold">{format(day, 'dd')}</p>
                                </div>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="h-[600px] overflow-auto pt-0">
                        <FollowUpCalendarView
                            followUps={weekFollowUps}
                            week={week}
                            onSlotClick={(date) => {
                                setSelectedSlot(date);
                                setIsAdding(true);
                            }}
                        />
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg">Weekly List</CardTitle>
                        <CardDescription>{weekFollowUps.length} follow-ups scheduled</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-auto space-y-4">
                        {weekFollowUps.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No follow-ups this week</p>
                            </div>
                        ) : (
                            weekFollowUps.map(fu => (
                                <div key={fu.id} className="p-3 rounded-lg border bg-card text-sm space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div className="grid gap-0.5">
                                            <p className="font-bold">{fu.patientName}</p>
                                            <p className="text-xs text-muted-foreground">{format(new Date(fu.followUpDate), 'EEE, dd MMM')}</p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(fu.id, 'Completed')}>
                                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Mark Completed
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(fu.id, 'Cancelled')}>
                                                    <XCircle className="mr-2 h-4 w-4 text-red-600" /> Cancel
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => router.push(`/patients/details?id=${fu.patientId}`)}>
                                                    <Search className="mr-2 h-4 w-4" /> View Patient
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(fu.id)} className="text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <p className="text-xs italic bg-muted/50 p-2 rounded">{fu.reason || 'Regular Check-up'}</p>
                                    <div className="flex justify-between items-center">
                                        <Badge
                                            variant={fu.status === 'Completed' ? 'outline' : 'secondary'}
                                            className={fu.status === 'Completed' ? 'text-green-600 border-green-200 bg-green-50' : ''}
                                        >
                                            {fu.status}
                                        </Badge>
                                        <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => router.push(`tel:${fu.patientMobile}`)}>
                                            Call
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            <AddFollowUpDialog
                open={isAdding}
                onOpenChange={setIsAdding}
                onFollowUpAdded={forceRerender}
            />
        </div>
    );
}
