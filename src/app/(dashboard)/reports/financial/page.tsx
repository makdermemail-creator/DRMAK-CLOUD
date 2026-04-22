'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DateRange } from 'react-day-picker';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval, 
  startOfDay, 
  endOfDay, 
  eachDayOfInterval,
  differenceInDays
} from 'date-fns';
import {
  File,
  Search,
  Download,
  Printer,
  User,
  PieChart as PieChartIcon,
  BarChart,
  FileText,
  Pencil,
  Eye,
  Boxes,
  ClipboardList,
  Stethoscope,
  Briefcase,
  Users2,
  CreditCard,
  Scissors,
  FileBarChart,
  HandCoins,
  Hourglass,
  ArrowRightLeft,
  Trash2,
  FileQuestion,
  BarChart3,
  Percent,
  TrendingUp,
  Receipt,
  MessageSquare,
  Sparkles,
  Lock,
  RotateCcw,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  doc,
  setDoc
} from 'firebase/firestore';
import type { BillingRecord, Patient, Doctor, Supplier } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function FinancialReportPage() {
  const firestore = useFirestore();
  const [selectedRange, setSelectedRange] = React.useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  // Operational Data Fetching
  const billingQuery = useMemoFirebase(() => firestore ? collection(firestore, 'billingRecords') : null, [firestore]);
  const patientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'patients') : null, [firestore]);
  const expensesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'expenses') : null, [firestore]);
  const suppliersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'suppliers') : null, [firestore]);
  const doctorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'doctors') : null, [firestore]);

  const { data: billingRecords } = useCollection<BillingRecord>(billingQuery);
  const { data: patients } = useCollection<Patient>(patientsQuery);
  const { data: allExpenses } = useCollection<any>(expensesQuery);
  const { data: allSuppliers } = useCollection<Supplier>(suppliersQuery);
  const { data: allDoctors } = useCollection<Doctor>(doctorsQuery);

  // Derived Financial State
  const filteredBilling = React.useMemo(() => {
    const fromDate = selectedRange?.from;
    const toDate = selectedRange?.to || selectedRange?.from; // Fallback to 'from' for single date selection

    if (!billingRecords || !fromDate) return billingRecords || [];
    
    return billingRecords.filter(b => {
        const dateStr = b.timestamp || b.billingDate;
        if (!dateStr) return false;
        
        // Robust date parsing
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return false;
        
        return isWithinInterval(date, { 
            start: startOfDay(fromDate), 
            end: endOfDay(toDate!) 
        });
    });
  }, [billingRecords, selectedRange]);

  const filteredExpenses = React.useMemo(() => {
    const fromDate = selectedRange?.from;
    const toDate = selectedRange?.to || selectedRange?.from;

    if (!allExpenses || !fromDate) return allExpenses || [];
    
    return allExpenses.filter((e: any) => {
        const dateStr = e.timestamp || e.date || e.createdAt;
        if (!dateStr) return false;
        
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return false;
        
        return isWithinInterval(date, { 
            start: startOfDay(fromDate), 
            end: endOfDay(toDate!) 
        });
    });
  }, [allExpenses, selectedRange]);

  const financialKPIs = React.useMemo(() => {
    const revenue = filteredBilling.reduce((sum, b) => sum + (b.grandTotal ?? b.totalAmount ?? ((b.consultationCharges || 0) + (b.procedureCharges || 0) + (b.medicineCharges || 0))), 0);
    const burn = filteredExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
    const debt = allSuppliers?.reduce((sum, s) => sum + ((s.currentBalance ?? (s as any).balance ?? (s as any).totalBalance) || 0), 0) || 0;
    
    return {
        grossRevenue: revenue,
        operationalBurn: burn,
        pendingVendorDebt: debt,
        netPosition: revenue - burn
    };
  }, [filteredBilling, filteredExpenses, allSuppliers]);

  const transactionData = React.useMemo(() => {
    if (!filteredBilling || !patients) return [];
    const patientsMap = new Map(patients.map(p => [p.mobileNumber, p]));

    return filteredBilling.map(record => {
      const patient = record.patientMobileNumber ? patientsMap.get(record.patientMobileNumber) : undefined;
      const total = record.grandTotal ?? record.totalAmount ?? ((record.consultationCharges ?? 0) + (record.procedureCharges ?? 0) + (record.medicineCharges ?? 0));
      const dateStr = record.timestamp || record.billingDate;
      
      return {
        invoice: record.id.slice(0, 6).toUpperCase(),
        mrn: patient?.id?.slice(0, 8) || 'N/A',
        patientName: patient?.name || record.patientName || 'Unknown',
        referredBy: '-',
        description: `Charges: Consult(${record.consultationCharges ?? 0}), Proc(${record.procedureCharges ?? 0}), Med(${record.medicineCharges ?? 0})`,
        total: total,
        paid: total, // Assuming fully paid if recorded
        discount: record.discountAmount || 0,
        dues: 0.0,
        deductionsInsurance: 0.0,
        taxDeductions: 0.0,
        insuranceClaims: 0.0,
        advance: 0.0,
        paymentMode: record.paymentMethod || 'Unknown',
        doctorRevenue: '-',
        departmentRevenue: 'OPD',
        paymentDate: dateStr && !isNaN(new Date(dateStr).getTime()) ? format(new Date(dateStr), 'dd/MM/yyyy - hh:mm a') : 'N/A'
      };
    });
  }, [filteredBilling, patients]);

  const stats = React.useMemo(() => {
    const total = transactionData.reduce((acc, t) => acc + t.total, 0);
    return { totalRevenue: total, totalCash: total }; // Simplified
  }, [transactionData]);

  const chartData = React.useMemo(() => {
    if (!selectedRange?.from || !selectedRange?.to) return [];
    
    const daysDiff = differenceInDays(selectedRange.to, selectedRange.from);
    
    if (daysDiff > 1) {
      // Group by Day
      const days = eachDayOfInterval({ start: selectedRange.from, end: selectedRange.to });
      return days.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        
        const rev = filteredBilling.filter(b => {
          const d = b.timestamp || b.billingDate;
          return d && !isNaN(new Date(d).getTime()) && isWithinInterval(new Date(d), { start: dayStart, end: dayEnd });
        }).reduce((sum, b) => sum + (b.grandTotal ?? b.totalAmount ?? ((b.consultationCharges || 0) + (b.procedureCharges || 0) + (b.medicineCharges || 0))), 0);
          
        const burn = filteredExpenses.filter((e: any) => {
          const d = e.timestamp || e.date || e.createdAt;
          return d && !isNaN(new Date(d).getTime()) && isWithinInterval(new Date(d), { start: dayStart, end: dayEnd });
        }).reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
          
        return {
          name: format(day, 'MMM dd'),
          revenue: rev,
          burn: burn
        };
      });
    } else {
      // Group by Hour for a single day
      const hours = Array.from({ length: 24 }, (_, i) => {
        const hour = i;
        const rev = filteredBilling.filter(b => {
          const d = b.timestamp || b.billingDate;
          return d && !isNaN(new Date(d).getTime()) && new Date(d).getHours() === hour;
        }).reduce((sum, b) => sum + (b.grandTotal ?? b.totalAmount ?? ((b.consultationCharges || 0) + (b.procedureCharges || 0) + (b.medicineCharges || 0))), 0);
          
        const burn = filteredExpenses.filter((e: any) => {
          const d = e.timestamp || e.date || e.createdAt;
          return d && !isNaN(new Date(d).getTime()) && new Date(d).getHours() === hour;
        }).reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
          
        return {
          name: `${hour.toString().padStart(2, '0')}:00`,
          revenue: rev,
          burn: burn
        };
      });
      return hours.filter(h => h.revenue > 0 || h.burn > 0);
    }
  }, [filteredBilling, filteredExpenses, selectedRange]);

  const pieData = React.useMemo(() => {
    const modes: Record<string, number> = {};
    transactionData.forEach(t => {
      modes[t.paymentMode] = (modes[t.paymentMode] || 0) + t.total;
    });
    return Object.entries(modes).map(([name, value]) => ({ name, value }));
  }, [transactionData]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];
  const shiftTransactionData = transactionData;
  const staffTransactionData = transactionData;
  const paymentModeData = transactionData;
  const proceduresData = transactionData;
  const doctorsShareData = transactionData;
  const pendingPaymentsData: any[] = [];
  const discountsData: any[] = [];
  const vouchersData: any[] = [];
  const incomeStatementData = [
    { item: 'Total Revenue', value: stats.totalRevenue },
    { item: 'Total Expenses', value: 0 },
    { item: 'Net Income', value: stats.totalRevenue }
  ];
  const tabs = [
    { value: 'revenue', label: 'Revenue HUB', icon: TrendingUp },
    { value: 'expenses', label: 'Operational BURN', icon: Receipt },
    { value: 'vendors', label: 'Vendor Accounts', icon: Boxes },
    { value: 'shares', label: 'Doctor Dividends', icon: HandCoins },
    { value: 'analytics', label: 'Strategic P&L', icon: FileBarChart },
  ];

  return (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Executive Finance Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-2">
                <div className="space-y-1">
                    <h1 className="text-5xl font-black tracking-tighter text-slate-900 flex items-center gap-4">
                        <span className="bg-indigo-600 text-white p-3 rounded-2xl shadow-xl shadow-indigo-100"><TrendingUp className="h-8 w-8" /></span>
                        Financial <span className="text-indigo-600">Hub</span>
                    </h1>
                    <p className="text-slate-500 font-bold ml-1 text-sm uppercase tracking-widest opacity-60">Unified Operational Intelligence</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <DatePickerWithRange date={selectedRange} onDateChange={setSelectedRange} />
                    <Button variant="outline" className="rounded-2xl border-slate-200 h-14 px-8 font-black hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                        <Download className="mr-2 h-5 w-5" /> Export
                    </Button>
                    <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 h-14 px-8 font-black shadow-2xl shadow-indigo-200 transition-all active:scale-95">
                        <Printer className="mr-2 h-5 w-5" /> Print Board
                    </Button>
                </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none bg-emerald-50/50 shadow-xl shadow-emerald-100/20 rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-200"><TrendingUp className="h-6 w-6" /></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 leading-none">Gross Revenue</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-4xl font-black text-emerald-900 tracking-tighter">Rs {financialKPIs.grossRevenue.toLocaleString()}</p>
                            <p className="text-xs font-bold text-emerald-600/80">Total Inflow • {filteredBilling.length} Invoices</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-rose-50/50 shadow-xl shadow-rose-100/20 rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-200"><Receipt className="h-6 w-6" /></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600/60 leading-none">Operational Burn</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-4xl font-black text-rose-900 tracking-tighter">Rs {financialKPIs.operationalBurn.toLocaleString()}</p>
                            <p className="text-xs font-bold text-rose-600/80">Direct Expenses • {filteredExpenses.length} Records</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-indigo-600 shadow-[0_20px_50px_rgba(79,70,229,0.3)] rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all">
                    <CardContent className="p-8 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl"><Sparkles className="h-6 w-6" /></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100/60 leading-none">Net Position</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-4xl font-black tracking-tighter">Rs {financialKPIs.netPosition.toLocaleString()}</p>
                            <p className="text-xs font-bold text-indigo-100/80">Actual Profitability</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-slate-900 shadow-xl shadow-slate-200 rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all">
                    <CardContent className="p-8 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-slate-800 rounded-2xl"><Boxes className="h-6 w-6" /></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Vendor Debt</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-4xl font-black tracking-tighter">Rs {financialKPIs.pendingVendorDebt.toLocaleString()}</p>
                            <p className="text-xs font-bold text-slate-400">Locked Liabilities</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none bg-white/40 backdrop-blur-3xl shadow-2xl shadow-slate-200/50 rounded-[3rem] overflow-hidden ring-1 ring-white/20">
                <CardContent className="p-10">
                    <Tabs defaultValue="revenue" className="w-full">
                        <div className="flex items-center justify-between mb-8">
                            <TabsList className="bg-slate-100/80 p-1.5 rounded-3xl h-auto border border-slate-200/80 shadow-inner">
                                {tabs.map((tab) => (
                                    <TabsTrigger 
                                        key={tab.value} 
                                        value={tab.value}
                                        className="rounded-2xl px-8 py-3.5 font-black text-sm data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-indigo-600 transition-all tracking-tight uppercase"
                                    >
                                        <tab.icon className="mr-2.5 h-4 w-4" />
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <TabsContent value="revenue" className="pt-2 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                                <div className="lg:col-span-3">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <Input placeholder="Search Invoices, Patients, or Doctors..." className="pl-12 h-14 rounded-2xl bg-white border-slate-200 font-bold focus:ring-indigo-500" />
                                    </div>
                                </div>
                                <Select>
                                    <SelectTrigger className="h-14 rounded-2xl font-bold bg-white border-slate-200">
                                        <SelectValue placeholder="All Departments" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="opd">OPD</SelectItem>
                                        <SelectItem value="pharmacy">Pharmacy</SelectItem>
                                        <SelectItem value="lab">Laboratory</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="rounded-3xl border border-slate-100 overflow-hidden bg-white/50 shadow-sm">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="border-slate-100 font-bold">
                                            <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest h-14">Invoice#</TableHead>
                                            <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest h-14">Patient Identity</TableHead>
                                            <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest h-14">Clinical Context</TableHead>
                                            <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest h-14 text-right">Revenue</TableHead>
                                            <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest h-14">Status</TableHead>
                                            <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest h-14 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactionData.map((t, i) => (
                                            <TableRow key={i} className="group border-slate-50 hover:bg-slate-50/80 transition-colors">
                                                <TableCell className="font-black text-indigo-600 h-16">{t.invoice}</TableCell>
                                                <TableCell>
                                                    <div className="space-y-0.5">
                                                        <p className="font-bold text-slate-900">{t.patientName}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ID: {t.mrn}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-0.5">
                                                        <p className="font-semibold text-slate-700 text-sm line-clamp-1">{t.description}</p>
                                                        <p className="text-[10px] font-black text-indigo-600/60 uppercase tracking-tighter">{t.paymentMode} • {t.departmentRevenue}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-black text-slate-900">
                                                    Rs {t.total.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">Collected</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-indigo-50 hover:text-indigo-600"><Eye className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-indigo-50 hover:text-indigo-600"><Printer className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-rose-50 hover:text-rose-600 text-slate-400"><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        <TabsContent value="expenses" className="pt-2 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                                <div className="lg:col-span-3">
                                    <h3 className="text-xl font-black text-slate-900">Daily Burn Log</h3>
                                    <p className="text-sm text-slate-500 font-medium">Tracking operational outflows and clinic maintenance.</p>
                                </div>
                                <Button className="h-14 rounded-2xl font-black bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-100">
                                    <Receipt className="mr-2 h-5 w-5" /> Log New Expense
                                </Button>
                            </div>
                            <div className="rounded-3xl border border-slate-100 overflow-hidden bg-white/50">
                                <Table>
                                    <TableHeader className="bg-slate-50/50 text-right">
                                        <TableRow className="border-slate-100 font-bold">
                                            <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest h-14">Category</TableHead>
                                            <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest h-14">Description</TableHead>
                                            <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest h-14 text-right">Amount</TableHead>
                                            <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest h-14 text-right">Log Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredExpenses.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-48 text-center">
                                                    <div className="flex flex-col items-center gap-2 opacity-20">
                                                        <Receipt className="h-12 w-12" />
                                                        <p className="font-black uppercase tracking-widest text-xs">No expenses logged in this range</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredExpenses.map((exp: any, i: number) => (
                                            <TableRow key={i} className="border-slate-50 h-16">
                                                <TableCell>
                                                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase">{exp.category || 'General'}</span>
                                                </TableCell>
                                                <TableCell className="font-bold text-slate-700">{exp.description}</TableCell>
                                                <TableCell className="text-right font-black text-rose-600">Rs {exp.amount.toLocaleString()}</TableCell>
                                                <TableCell className="text-right font-bold text-slate-400 text-xs">{format(new Date(exp.timestamp), 'dd MMM yyyy')}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        <TabsContent value="vendors" className="pt-2 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {allSuppliers?.map((supplier, i) => (
                                        <Card key={i} className="border-none bg-slate-50 shadow-sm rounded-3xl group hover:shadow-md transition-all">
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <h4 className="text-lg font-black text-slate-900">{supplier.name}</h4>
                                                        <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">{supplier.type || 'Distributor'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Balance Due</p>
                                                        <p className="text-2xl font-black text-indigo-600">Rs {(supplier.currentBalance ?? (supplier as any).balance ?? (supplier as any).totalBalance ?? 0).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-6 flex items-center gap-3">
                                                    <Button variant="outline" className="flex-1 h-12 rounded-xl font-black text-sm hover:bg-white border-slate-200">View Ledger</Button>
                                                    <Button className="flex-1 h-12 rounded-xl font-black text-sm bg-slate-900 hover:bg-black">Process Payment</Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="shares" className="pt-2 animate-in slide-in-from-bottom-4 duration-500">
                             <div className="rounded-3xl border border-slate-100 overflow-hidden bg-white/50">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="border-slate-100 h-14">
                                            <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Clinical Authority</TableHead>
                                            <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest text-right">Total Revenue Generated</TableHead>
                                            <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest text-right">Computed Share</TableHead>
                                            <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allDoctors?.map((doctor, i) => {
                                            const docName = doctor.fullName || (doctor as any).name || '';
                                            const doctorRevenue = transactionData.filter(t => t.description.toLowerCase().includes(docName.toLowerCase())).reduce((sum, t) => sum + t.total, 0);
                                            return (
                                                <TableRow key={i} className="border-slate-50 h-16">
                                                    <TableCell className="font-black text-slate-900">{docName}</TableCell>
                                                    <TableCell className="text-right font-bold text-slate-600">Rs {doctorRevenue.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right font-black text-indigo-600">Rs {(doctorRevenue * 0.4).toLocaleString()}</TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase">Unsettled</span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                             </div>
                        </TabsContent>

                        <TabsContent value="analytics" className="pt-2 animate-in slide-in-from-bottom-4 duration-500">
                             <Card className="border-none shadow-none bg-slate-50/50 rounded-3xl p-8">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Financial Momentum</h3>
                                        <p className="text-sm font-bold text-slate-500">Cross-period revenue vs expense performance.</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-indigo-600" />
                                            <span className="text-xs font-black uppercase text-slate-600">Revenue</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-rose-500" />
                                            <span className="text-xs font-black uppercase text-slate-600">Burn</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#e2e8f0" />
                                            <XAxis 
                                                dataKey="name" 
                                                stroke="#94a3b8" 
                                                fontSize={10} 
                                                tickLine={false} 
                                                axisLine={false} 
                                                fontWeight="bold"
                                            />
                                            <YAxis 
                                                stroke="#94a3b8" 
                                                fontSize={10} 
                                                tickLine={false} 
                                                axisLine={false} 
                                                fontWeight="bold"
                                                tickFormatter={(v) => `Rs ${v/1000}k`}
                                            />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="revenue" 
                                                stroke="#4f46e5" 
                                                strokeWidth={4} 
                                                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                                                activeDot={{ r: 8, strokeWidth: 0 }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="burn" 
                                                stroke="#f43f5e" 
                                                strokeWidth={4} 
                                                strokeDasharray="8 8"
                                                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                                                activeDot={{ r: 8, strokeWidth: 0 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                             </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
