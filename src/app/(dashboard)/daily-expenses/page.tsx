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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
    useCollection,
    useFirestore,
    useMemoFirebase,
    useUser
} from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
    Receipt,
    Plus,
    Calendar,
    DollarSign,
    TrendingUp,
    PieChart,
    Loader2,
    Trash2,
    Edit2
} from 'lucide-react';
import { 
    format, 
    isToday, 
    isThisMonth, 
    isSameDay, 
    startOfWeek, 
    endOfWeek, 
    startOfMonth, 
    endOfMonth, 
    isWithinInterval,
    eachDayOfInterval
} from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DatePicker } from '@/components/DatePicker';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    Legend
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface Expense {
    id?: string;
    amount: number;
    category: string;
    description: string;
    paymentMethod: string;
    timestamp: string; 
    addedBy: string; 
}

const CATEGORIES = [
    "Supplies",
    "Utilities",
    "Maintenance",
    "Salary",
    "Marketing",
    "Refund",
    "Other"
];

const PAYMENT_METHODS = [
    "Cash",
    "Card",
    "Bank Transfer",
    "UPI"
];

export default function DailyExpensesPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    
    // Dialog state
    const [isAddOpen, setIsAddOpen] = React.useState(false);
    const [isEditOpen, setIsEditOpen] = React.useState(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);

    // Form state
    const [amount, setAmount] = React.useState<string>('');
    const [category, setCategory] = React.useState<string>('Supplies');
    const [description, setDescription] = React.useState<string>('');
    const [paymentMethod, setPaymentMethod] = React.useState<string>('Cash');
    const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
    const [viewMode, setViewMode] = React.useState<'day' | 'week' | 'month' | 'history'>('day');

    const expensesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'expenses'), orderBy('timestamp', 'desc'));
    }, [firestore]);

    const { data: allExpenses, isLoading } = useCollection<Expense>(expensesQuery);

    const dateRange = React.useMemo(() => {
        if (viewMode === 'day') return { start: selectedDate, end: selectedDate };
        if (viewMode === 'week') return { start: startOfWeek(selectedDate), end: endOfWeek(selectedDate) };
        if (viewMode === 'month') return { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };
        if (viewMode === 'history') return { start: new Date(0), end: new Date() }; // Beginning of time to now
        return { start: selectedDate, end: selectedDate };
    }, [selectedDate, viewMode]);

    const selectedExpensesList = React.useMemo(() => {
        if (!allExpenses) return [];
        return allExpenses.filter(e => {
            const d = new Date(e.timestamp);
            if (viewMode === 'day') return isSameDay(d, selectedDate);
            return isWithinInterval(d, { start: dateRange.start, end: dateRange.end });
        });
    }, [allExpenses, selectedDate, viewMode, dateRange]);

    const groupedExpenses = React.useMemo(() => {
        if (!selectedExpensesList) return [];
        const groups: Record<string, { date: Date; total: number; categories: Record<string, number>; count: number; items: Expense[] }> = {};
        
        selectedExpensesList.forEach(exp => {
            const dateStr = format(new Date(exp.timestamp), 'yyyy-MM-dd');
            if (!groups[dateStr]) {
                groups[dateStr] = { 
                    date: new Date(exp.timestamp), 
                    total: 0, 
                    categories: {}, 
                    count: 0,
                    items: []
                };
            }
            groups[dateStr].total += exp.amount;
            groups[dateStr].count += 1;
            groups[dateStr].items.push(exp);
            groups[dateStr].categories[exp.category] = (groups[dateStr].categories[exp.category] || 0) + exp.amount;
        });

        return Object.values(groups).sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [selectedExpensesList]);

    const olderExpensesList = React.useMemo(() => 
        allExpenses?.filter(e => {
            const d = new Date(e.timestamp);
            return !isWithinInterval(d, { start: dateRange.start, end: dateRange.end });
        }) || []
    , [allExpenses, dateRange]);

    const paymentMethodData = React.useMemo(() => {
        const methodMap: Record<string, number> = {};
        selectedExpensesList.forEach(exp => {
            methodMap[exp.paymentMethod] = (methodMap[exp.paymentMethod] || 0) + exp.amount;
        });
        return Object.entries(methodMap).map(([name, value]) => ({ name, value }));
    }, [selectedExpensesList]);

    const stats = React.useMemo(() => {
        if (!allExpenses) return { currentTotal: 0, monthTotal: 0, currentCount: 0, topCategory: 'N/A' };

        let currentTotal = 0;
        let monthTotal = 0;
        let currentCount = 0;
        const categoryMap: Record<string, number> = {};

        allExpenses.forEach(expense => {
            const expDate = new Date(expense.timestamp);
            const isInRange = viewMode === 'day' 
                ? isSameDay(expDate, selectedDate)
                : isWithinInterval(expDate, { start: dateRange.start, end: dateRange.end });

            if (isInRange) {
                currentTotal += expense.amount;
                currentCount++;
                categoryMap[expense.category] = (categoryMap[expense.category] || 0) + expense.amount;
            }
            if (isThisMonth(expDate)) {
                monthTotal += expense.amount;
            }
        });

        let topCategory = 'N/A';
        let maxAmt = 0;
        Object.entries(categoryMap).forEach(([cat, amt]) => {
            if (amt > maxAmt) {
                maxAmt = amt;
                topCategory = cat;
            }
        });

        return { currentTotal, monthTotal, currentCount, topCategory };
    }, [allExpenses, viewMode, dateRange, selectedDate]);

    const resetForm = () => {
        setAmount('');
        setCategory('Supplies');
        setDescription('');
        setPaymentMethod('Cash');
        setEditingId(null);
    };

    const handleAddExpense = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast({ title: 'Invalid Amount', description: 'Please enter a valid amount.', variant: 'destructive' });
            return;
        }
        if (!description.trim()) {
            toast({ title: 'Missing Details', description: 'Please enter a description.', variant: 'destructive' });
            return;
        }
        if (!firestore) return;

        try {
            await addDoc(collection(firestore, 'expenses'), {
                amount: Number(amount),
                category,
                description,
                paymentMethod,
                timestamp: new Date().toISOString(),
                addedBy: user?.email || 'Unknown'
            });
            toast({ title: 'Success', description: 'Expense recorded successfully.' });
            setIsAddOpen(false);
            resetForm();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    const openEditForm = (expense: Expense) => {
        setAmount(expense.amount.toString());
        setCategory(expense.category);
        setDescription(expense.description);
        setPaymentMethod(expense.paymentMethod);
        setEditingId(expense.id!);
        setIsEditOpen(true);
    };

    const handleEditExpense = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast({ title: 'Invalid Amount', description: 'Please enter a valid amount.', variant: 'destructive' });
            return;
        }
        if (!description.trim()) {
            toast({ title: 'Missing Details', description: 'Please enter a description.', variant: 'destructive' });
            return;
        }
        if (!firestore || !editingId) return;

        try {
            const expenseRef = doc(firestore, 'expenses', editingId);
            await updateDoc(expenseRef, {
                amount: Number(amount),
                category,
                description,
                paymentMethod,
            });
            toast({ title: 'Success', description: 'Expense updated successfully.' });
            setIsEditOpen(false);
            resetForm();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'expenses', id));
            toast({ title: 'Deleted', description: 'Expense deleted successfully.' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading expenses...</p>
            </div>
        );
    }

    const COLORS = ['#0d9488', '#0284c7', '#7c3aed', '#db2777', '#ea580c'];

    const chartConfig = {
        amount: {
            label: "Amount",
        },
        Cash: { label: "Cash", color: "hsl(var(--chart-1))" },
        Card: { label: "Card", color: "hsl(var(--chart-2))" },
        "Bank Transfer": { label: "Bank", color: "hsl(var(--chart-3))" },
        UPI: { label: "UPI", color: "hsl(var(--chart-4))" },
    };

    return (
        <div className="flex flex-col gap-6 p-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Receipt className="h-8 w-8 text-primary" />
                        Daily Expense Management
                    </h2>
                    <p className="text-muted-foreground">Track and manage outgoing clinic expenses.</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex flex-col gap-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Range Mode</Label>
                        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-[400px]">
                            <TabsList className="grid w-full grid-cols-4 h-9">
                                <TabsTrigger value="day" className="text-xs">Day</TabsTrigger>
                                <TabsTrigger value="week" className="text-xs">Week</TabsTrigger>
                                <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
                                <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Select {viewMode === 'day' ? 'Date' : 'Anchor Date'}</Label>
                        <DatePicker date={selectedDate} onDateChange={(d) => d && setSelectedDate(d)} />
                    </div>
                    <Separator orientation="vertical" className="h-10 hidden md:block" />
                    <Dialog open={isAddOpen} onOpenChange={(open) => {
                    setIsAddOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Add Expense
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Record New Expense</DialogTitle>
                            <DialogDescription>Enter the details of the new expense below.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Amount (Rs)</Label>
                                <Input id="amount" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="paymentMethod">Payment Method</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger><SelectValue placeholder="Select Method" /></SelectTrigger>
                                    <SelectContent>
                                        {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description (Reason/Note)</Label>
                                <Textarea id="description" placeholder="E.g., Bought printer ink..." value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddExpense}>Save Expense</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-primary font-semibold uppercase tracking-wider text-[10px]">
                            {viewMode === 'day' 
                                ? (isToday(selectedDate) ? "Today's" : format(selectedDate, 'PP')) 
                                : viewMode === 'history' ? "All Time" : `${format(dateRange.start, 'MMM dd')} - ${format(dateRange.end, 'MMM dd')}`} Expenses
                        </CardDescription>
                        <CardTitle className="text-3xl font-bold">{stats.currentTotal.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">Rs</span></CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <TrendingUp className="h-3 w-3" /> From {stats.currentCount} transactions
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="font-semibold uppercase tracking-wider text-[10px]">Highest Category In Range</CardDescription>
                        <CardTitle className="text-3xl font-bold line-clamp-1">{stats.topCategory}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <PieChart className="h-3 w-3" /> Largest spending area
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="font-semibold uppercase tracking-wider text-[10px]">This Month's Total</CardDescription>
                        <CardTitle className="text-3xl font-bold">{stats.monthTotal.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">Rs</span></CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" /> Total outgoing this month
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Analysis Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-primary" />
                            Payment Method Distribution
                        </CardTitle>
                        <CardDescription>
                            {viewMode === 'day' 
                                ? `Breakdown of expenses for ${format(selectedDate, 'PP')}`
                                : viewMode === 'history' ? "Historical breakdown by payment method" : `Breakdown from ${format(dateRange.start, 'MMM dd')} to ${format(dateRange.end, 'MMM dd')}`
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        {paymentMethodData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <p className="italic">No data for selected date</p>
                            </div>
                        ) : (
                            <ChartContainer config={chartConfig} className="h-full w-full">
                                <RechartsPieChart>
                                    <Pie
                                        data={paymentMethodData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {paymentMethodData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </RechartsPieChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="flex flex-col justify-center items-center p-6 text-center bg-teal-50/50 border-dashed border-teal-200">
                    <div className="rounded-full bg-teal-100 p-3 mb-4">
                        <DollarSign className="h-8 w-8 text-teal-600" />
                    </div>
                    <h3 className="text-xl font-bold text-teal-900 mb-2">Detailed Financial Insight</h3>
                    <p className="text-sm text-teal-700 max-w-xs">
                        View exactly how your clinic's funds are being utilized across different payment channels for 
                        {viewMode === 'day' 
                            ? ` ${format(selectedDate, 'PP')}`
                            : viewMode === 'history' ? " your entire clinic history" : ` the period of ${format(dateRange.start, 'MMM dd')} - ${format(dateRange.end, 'MMM dd')}`
                        }.
                    </p>
                </Card>
            </div>

            {/* Edit Dialog (Hidden) */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Expense</DialogTitle>
                        <DialogDescription>Modify the details of this expense.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-amount">Amount (Rs)</Label>
                            <Input id="edit-amount" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-category">Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-paymentMethod">Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger><SelectValue placeholder="Select Method" /></SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea id="edit-description" value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditExpense}>Update Expense</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Expenses List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-red-500" />
                        {viewMode === 'day' 
                            ? `Expenses Log: ${format(selectedDate, 'PP')}`
                            : viewMode === 'history' ? `Master Expense History (${stats.currentCount} items)` : `Detailed Summary Report: ${format(dateRange.start, 'MMM dd')} - ${format(dateRange.end, 'MMM dd')}`
                        }
                    </CardTitle>
                    <CardDescription>
                        {viewMode === 'day' 
                            ? "All expenses recorded for the selected date."
                            : "Detailed day-wise history with individual transaction breakdown."
                        }
                    </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                    {viewMode === 'day' ? (
                        selectedExpensesList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-muted-foreground py-8">
                                <Receipt className="h-12 w-12 opacity-10 mb-2" />
                                <p className="italic">No expenses recorded for this date.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead className="text-right">Amount (Rs)</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedExpensesList.map((expense) => (
                                        <TableRow key={expense.id}>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {format(new Date(expense.timestamp), 'p')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{expense.category}</Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={expense.description}>
                                                {expense.description}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-bold">{expense.paymentMethod}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-red-600">
                                                - {expense.amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary" onClick={() => openEditForm(expense)}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-500">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. This will permanently delete the expense record for Rs {expense.amount}.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeleteExpense(expense.id!)}>Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )
                    ) : (
                        groupedExpenses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-muted-foreground py-8">
                                <Calendar className="h-12 w-12 opacity-10 mb-2" />
                                <p className="italic">No expenses recorded for this period.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Accordion type="multiple" className="space-y-3">
                                    {groupedExpenses.map((group) => {
                                        const topCat = Object.entries(group.categories).sort((a, b) => b[1] - a[1])[0][0];
                                        return (
                                            <AccordionItem 
                                                key={format(group.date, 'yyyy-MM-dd')} 
                                                value={format(group.date, 'yyyy-MM-dd')}
                                                className="border rounded-lg bg-card overflow-hidden"
                                            >
                                                <AccordionTrigger className="px-4 py-4 hover:no-underline bg-muted/20">
                                                    <div className="flex justify-between items-center w-full pr-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex flex-col items-start gap-1">
                                                                <span className="font-bold text-sm">{format(group.date, 'eeee, MMM dd, yyyy')}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="secondary" className="text-[10px]">{group.count} Transactions</Badge>
                                                                    <Badge variant="outline" className="text-[10px]">{topCat}</Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Total Day Expense</span>
                                                            <span className="font-black text-red-600">Rs {group.total.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="p-0">
                                                    <div className="bg-background">
                                                        <Table>
                                                            <TableHeader className="bg-muted/30">
                                                                <TableRow>
                                                                    <TableHead className="text-[10px] font-bold">Time</TableHead>
                                                                    <TableHead className="text-[10px] font-bold">Category</TableHead>
                                                                    <TableHead className="text-[10px] font-bold">Detailed Reason/Description</TableHead>
                                                                    <TableHead className="text-[10px] font-bold">Payment</TableHead>
                                                                    <TableHead className="text-right text-[10px] font-bold">Amount (Rs)</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {group.items.map((item) => (
                                                                    <TableRow key={item.id} className="hover:bg-muted/10">
                                                                        <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                                                                            {format(new Date(item.timestamp), 'p')}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Badge variant="secondary" className="text-[10px] px-1 py-0">{item.category}</Badge>
                                                                        </TableCell>
                                                                        <TableCell className="text-[12px] font-medium italic">
                                                                            {item.description}
                                                                        </TableCell>
                                                                        <TableCell className="text-[11px] font-semibold text-teal-600">
                                                                            {item.paymentMethod}
                                                                        </TableCell>
                                                                        <TableCell className="text-right font-bold text-slate-700">
                                                                            {item.amount.toLocaleString()}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                        <div className="flex justify-end p-2 bg-muted/5 border-t">
                                                            <Button 
                                                                variant="link" 
                                                                size="sm" 
                                                                className="text-[10px] h-6"
                                                                onClick={() => {
                                                                    setSelectedDate(group.date);
                                                                    setViewMode('day');
                                                                }}
                                                            >
                                                                Go to Single Day View for Actions →
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    })}
                                </Accordion>

                                <Card className="bg-red-50 border-red-100 overflow-hidden">
                                    <div className="flex justify-between items-center px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-black text-red-500 tracking-widest">Selected Period Grand Total</span>
                                            <span className="text-muted-foreground text-xs">
                                                Based on {stats.currentCount} total recorded transactions
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-3xl font-black text-red-600">
                                                Rs {stats.currentTotal.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )
                    )}
                </CardContent>
            </Card>

            {/* Previous Expenses Log (Optional visually separated section) */}
            {olderExpensesList.length > 0 && (
                <Card className="opacity-75">
                    <CardHeader>
                        <CardTitle className="text-lg">Previous Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Payment</TableHead>
                                    <TableHead className="text-right">Amount (Rs)</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {olderExpensesList.slice(0, 50).map((expense) => ( // show only last 50
                                    <TableRow key={expense.id}>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {format(new Date(expense.timestamp), 'PP')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{expense.category}</Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={expense.description}>
                                            {expense.description}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-bold">{expense.paymentMethod}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-red-600">
                                            - {expense.amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Older Expense?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the record for Rs {expense.amount} from {format(new Date(expense.timestamp), 'PP')}.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeleteExpense(expense.id!)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

        </div>
    );
}
