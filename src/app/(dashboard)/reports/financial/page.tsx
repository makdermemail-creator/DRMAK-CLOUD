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
import type { BillingRecord, Patient, Doctor } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { format } from 'date-fns';
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
  const billingQuery = useMemoFirebase(() => firestore ? collection(firestore, 'billingRecords') : null, [firestore]);
  const patientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'patients') : null, [firestore]);
  const { data: billingRecords, isLoading: billingLoading } = useCollection<BillingRecord>(billingQuery);
  const { data: patients, isLoading: patientsLoading } = useCollection<Patient>(patientsQuery);

  const transactionData = React.useMemo(() => {
    if (!billingRecords || !patients) return [];
    const patientsMap = new Map(patients.map(p => [p.mobileNumber, p]));

    return billingRecords.map(record => ({
      invoice: record.id.slice(0, 6).toUpperCase(),
      mrn: patientsMap.get(record.patientMobileNumber)?.id.slice(0, 8) || 'N/A',
      patientName: patientsMap.get(record.patientMobileNumber)?.name || 'Unknown',
      referredBy: '-',
      description: `Charges: Consult(${record.consultationCharges}), Proc(${record.procedureCharges}), Med(${record.medicineCharges})`,
      total: record.consultationCharges + record.procedureCharges + record.medicineCharges,
      paid: record.consultationCharges + record.procedureCharges + record.medicineCharges, // Assuming fully paid if recorded
      discount: 0.0,
      dues: 0.0,
      deductionsInsurance: 0.0,
      taxDeductions: 0.0,
      insuranceClaims: 0.0,
      advance: 0.0,
      paymentMode: record.paymentMethod,
      doctorRevenue: '-',
      departmentRevenue: 'OPD',
      paymentDate: format(new Date(record.billingDate), 'dd/MM/yyyy - hh:mm a')
    }));
  }, [billingRecords, patients]);

  const stats = React.useMemo(() => {
    const total = transactionData.reduce((acc, t) => acc + t.total, 0);
    return { totalRevenue: total, totalCash: total }; // Simplified
  }, [transactionData]);

  const chartData = React.useMemo(() => {
    if (!transactionData.length) return [];
    // Group by hour for today/selected range
    const hours = Array.from({ length: 24 }, (_, i) => ({
      name: `${i.toString().padStart(2, '0')}:00`,
      value: 0
    }));

    transactionData.forEach(t => {
      // Very basic grouping logic
      const hour = parseInt(t.paymentDate.split(' - ')[1].split(':')[0]);
      if (!isNaN(hour)) hours[hour].value += t.total;
    });
    return hours.filter(h => h.value > 0);
  }, [transactionData]);

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
    { value: 'transaction', label: 'Transaction', icon: ArrowRightLeft },
    { value: 'summary', label: 'Summary', icon: FileBarChart },
    { value: 'shift', label: 'Shift', icon: Hourglass },
    { value: 'staff', label: 'Staff', icon: Users2 },
    { value: 'payment-mode', label: 'Payment Mode', icon: CreditCard },
    { value: 'procedures', label: 'Procedures', icon: Scissors },
    { value: 'income-statement', label: 'Income Statement', icon: FileText },
    { value: 'doctors-share', label: 'Doctors Share', icon: HandCoins },
    { value: 'pending-payments', label: 'Pending Payments', icon: Hourglass },
    { value: 'advance-payments', label: 'Advance Payments', icon: HandCoins },
    { value: 'deleted-invoices', label: 'Deleted Invoices', icon: Trash2 },
    { value: 'refund-report', label: 'Refund Report', icon: FileQuestion },
    { value: 'statistics', label: 'Statistics', icon: BarChart3 },
    { value: 'discounts', label: 'Discounts', icon: Percent },
    { value: 'profit-loss', label: 'Profit/Loss Details', icon: TrendingUp },
    { value: 'cost-per-patient', label: 'Cost Per Patient', icon: User },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Financial Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transaction" className="w-full">
            <div className="overflow-x-auto">
              <TabsList className="h-auto whitespace-nowrap">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    <tab.icon className="mr-2 h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value="transaction" className="pt-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="cost-per-patient" />
                  <Label htmlFor="cost-per-patient">Cost Per Patient</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Payment Mode" />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                  <DatePickerWithRange />
                  <Input placeholder="Search by Invoice#" />

                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Doctor" />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Tags" />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Procedure" />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Refer By" />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>

                  <Input placeholder="Search By Patient MR#" />
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Doctor Share Filter" />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input placeholder="Lower Invoice# Range" />
                    <Input placeholder="Upper Invoice# Range" />
                  </div>
                  <Button>Search</Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Total Revenue</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">12,000.0</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Total Cash</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">12,000.0</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Total Advance</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Total Refund</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="pt-6 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                  <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                  <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>INVOICE#</TableHead>
                      <TableHead>MR#</TableHead>
                      <TableHead>PATIENT NAME</TableHead>
                      <TableHead>REFERRED BY</TableHead>
                      <TableHead>DESCRIPTION</TableHead>
                      <TableHead>TOTAL</TableHead>
                      <TableHead>PAID</TableHead>
                      <TableHead>DISCOUNT</TableHead>
                      <TableHead>DUES</TableHead>
                      <TableHead>DEDUCTIONS AGAINST INSURANCE CLAIMS</TableHead>
                      <TableHead>TAX DEDUCTIONS AGAINST INSURANCE CLAIMS</TableHead>
                      <TableHead>INSURANCE CLAIMS</TableHead>
                      <TableHead>ADVANCE</TableHead>
                      <TableHead>MODE OF PAYMENT</TableHead>
                      <TableHead>DOCTOR REVENUE</TableHead>
                      <TableHead>DEPARTMENT REVENUE</TableHead>
                      <TableHead>PAYMENT DATE</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionData.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell>{t.invoice}</TableCell>
                        <TableCell>{t.mrn}</TableCell>
                        <TableCell>{t.patientName}</TableCell>
                        <TableCell>{t.referredBy}</TableCell>
                        <TableCell>{t.description}</TableCell>
                        <TableCell>{t.total.toFixed(2)}</TableCell>
                        <TableCell>{t.paid.toFixed(2)}</TableCell>
                        <TableCell>{t.discount.toFixed(2)}</TableCell>
                        <TableCell>{t.dues.toFixed(2)}</TableCell>
                        <TableCell>{t.deductionsInsurance.toFixed(2)}</TableCell>
                        <TableCell>{t.taxDeductions.toFixed(2)}</TableCell>
                        <TableCell>{t.insuranceClaims.toFixed(2)}</TableCell>
                        <TableCell>{t.advance.toFixed(2)}</TableCell>
                        <TableCell>{t.paymentMode}</TableCell>
                        <TableCell>{t.doctorRevenue}</TableCell>
                        <TableCell>{t.departmentRevenue}</TableCell>
                        <TableCell>{t.paymentDate}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6"><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6"><Printer className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6"><Receipt className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6"><MessageSquare className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="summary" className="pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <Select><SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger></Select>
                  <Select><SelectTrigger><SelectValue placeholder="Select Group" /></SelectTrigger></Select>
                  <Select><SelectTrigger><SelectValue placeholder="Select Payment Mode" /></SelectTrigger></Select>
                  <DatePickerWithRange />
                  <Button>Search</Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Total Revenue</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">11,500.0</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Total Expense</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Net Profit/Loss</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">11,500.0</p></CardContent>
                  </Card>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                  <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>DEPARTMENT</TableHead>
                      <TableHead>REVENUE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>OPD</TableCell>
                      <TableCell>11,500.00</TableCell>
                    </TableRow>
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell>Grand Total</TableCell>
                      <TableCell>11,500.00</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="shift" className="pt-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="shift-cost-per-patient" />
                  <Label htmlFor="shift-cost-per-patient">Cost Per Patient</Label>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <p className="text-sm text-red-600">* Please Enable Shifts from Admin Settings To Show the Shift Collections</p>
                  <Select>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Morning (12am - 12am)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (12am - 12am)</SelectItem>
                    </SelectContent>
                  </Select>
                  <DatePickerWithRange />
                  <div className="flex gap-2 ml-auto">
                    <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                    <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                  </div>
                </div>
                <Card className="w-full max-w-xs">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">37,000.0</p>
                  </CardContent>
                </Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>INVOICE#</TableHead>
                      <TableHead>MR#</TableHead>
                      <TableHead>PATIENT NAME</TableHead>
                      <TableHead>DESCRIPTION</TableHead>
                      <TableHead>TOTAL</TableHead>
                      <TableHead>PAID</TableHead>
                      <TableHead>DISCOUNT</TableHead>
                      <TableHead>DUES</TableHead>
                      <TableHead>DOCTOR REVENUE</TableHead>
                      <TableHead>DEPARTMENT REVENUE</TableHead>
                      <TableHead>PAYMENT DATE</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shiftTransactionData.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell>{t.invoice}</TableCell>
                        <TableCell>{t.mrn}</TableCell>
                        <TableCell>{t.patientName}</TableCell>
                        <TableCell>{t.description}</TableCell>
                        <TableCell>{t.total.toFixed(2)}</TableCell>
                        <TableCell>{t.paid.toFixed(2)}</TableCell>
                        <TableCell>{t.discount.toFixed(2)}</TableCell>
                        <TableCell>{t.dues.toFixed(2)}</TableCell>
                        <TableCell>{t.doctorRevenue}</TableCell>
                        <TableCell>{t.departmentRevenue}</TableCell>
                        <TableCell>{t.paymentDate}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-6 w-6"><Printer className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="staff" className="pt-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="staff-cost-per-patient" />
                  <Label htmlFor="staff-cost-per-patient">Cost Per Patient</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Muhammad Umar" />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                  <DatePickerWithRange />
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Shift" />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Doctor" />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Collection By Cash</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">37,000.0</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Collection By Other Methods</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
                  </Card>
                </div>

                <div className="flex justify-end gap-2">
                  <Button>Collect All</Button>
                  <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                  <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>INVOICE#</TableHead>
                      <TableHead>MR#</TableHead>
                      <TableHead>PATIENT NAME</TableHead>
                      <TableHead>DESCRIPTION</TableHead>
                      <TableHead>TOTAL</TableHead>
                      <TableHead>PAID</TableHead>
                      <TableHead>DUES</TableHead>
                      <TableHead>DISCOUNT</TableHead>
                      <TableHead>DEDUCTIONS AGAINST INSURANCE CLAIMS</TableHead>
                      <TableHead>TAX DEDUCTIONS AGAINST INSURANCE CLAIMS</TableHead>
                      <TableHead>INSURANCE CLAIMS</TableHead>
                      <TableHead>ADVANCE</TableHead>
                      <TableHead>DOCTOR REVENUE</TableHead>
                      <TableHead>USER INCOME TAX</TableHead>
                      <TableHead>EXPENSES</TableHead>
                      <TableHead>PAYMENT DATE</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffTransactionData.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell>{t.invoice}</TableCell>
                        <TableCell>{t.mrn}</TableCell>
                        <TableCell>{t.patientName}</TableCell>
                        <TableCell>{t.description}</TableCell>
                        <TableCell>{t.total.toFixed(2)}</TableCell>
                        <TableCell>{t.paid.toFixed(2)}</TableCell>
                        <TableCell>{t.dues.toFixed(2)}</TableCell>
                        <TableCell>{t.discount.toFixed(2)}</TableCell>
                        <TableCell>{t.deductionsInsurance.toFixed(2)}</TableCell>
                        <TableCell>{t.taxDeductions.toFixed(2)}</TableCell>
                        <TableCell>{t.insuranceClaims.toFixed(2)}</TableCell>
                        <TableCell>{t.advance.toFixed(2)}</TableCell>
                        <TableCell>{t.doctorRevenue}</TableCell>
                        <TableCell>0.00</TableCell>
                        <TableCell>0.00</TableCell>
                        <TableCell>{t.paymentDate}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-6 w-6"><Printer className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell colSpan={4}>Grand Total</TableCell>
                      <TableCell>37000.00</TableCell>
                      <TableCell>37000.00</TableCell>
                      <TableCell>1000.00</TableCell>
                      <TableCell>0.00</TableCell>
                      <TableCell>0.00</TableCell>
                      <TableCell>0.00</TableCell>
                      <TableCell>0.00</TableCell>
                      <TableCell>0.00</TableCell>
                      <TableCell colSpan={5}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="payment-mode" className="pt-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="payment-cost-per-patient" />
                    <Label htmlFor="payment-cost-per-patient">Cost Per Patient</Label>
                  </div>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Payment Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                  <DatePickerWithRange />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  <Card className="md:col-span-1">
                    <CardHeader>
                      <CardTitle className="text-base">Totals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">37,000.0</p>
                    </CardContent>
                  </Card>
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-base">Payment Mode</CardTitle>
                    </CardHeader>
                    <CardContent className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                  <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>INVOICE#</TableHead>
                      <TableHead>MR#</TableHead>
                      <TableHead>PATIENT NAME</TableHead>
                      <TableHead>DESCRIPTION</TableHead>
                      <TableHead>TOTAL</TableHead>
                      <TableHead>PAID</TableHead>
                      <TableHead>DUES</TableHead>
                      <TableHead>MODE OF PAYMENT</TableHead>
                      <TableHead>DEPARTMENT REVENUE</TableHead>
                      <TableHead>PAYMENT DATE</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentModeData.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell>{t.invoice}</TableCell>
                        <TableCell>{t.mrn}</TableCell>
                        <TableCell>{t.patientName}</TableCell>
                        <TableCell>{t.description}</TableCell>
                        <TableCell>{t.total.toFixed(2)}</TableCell>
                        <TableCell>{t.paid.toFixed(2)}</TableCell>
                        <TableCell>{t.dues.toFixed(2)}</TableCell>
                        <TableCell>{t.paymentMode}</TableCell>
                        <TableCell>{t.departmentRevenue}</TableCell>
                        <TableCell>{t.paymentDate}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-6 w-6"><Printer className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="procedures" className="pt-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="procedures-cost-per-patient" />
                    <Label htmlFor="procedures-cost-per-patient">Cost Per Patient</Label>
                  </div>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Laser" />
                    </SelectTrigger>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                  </Select>
                  <DatePickerWithRange />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Total Revenue</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">10,000.0</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Refund Amount</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
                  </Card>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                  <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                  <Button variant="outline"><Sparkles className="mr-2 h-4 w-4" /> Customize</Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>INVOICE#</TableHead>
                      <TableHead>MR#</TableHead>
                      <TableHead>PATIENT NAME</TableHead>
                      <TableHead>DESCRIPTION</TableHead>
                      <TableHead>QTY</TableHead>
                      <TableHead>TOTAL</TableHead>
                      <TableHead>PAID</TableHead>
                      <TableHead>PROCEDURES</TableHead>
                      <TableHead>PAYMENT DATE</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proceduresData.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell>{p.invoice}</TableCell>
                        <TableCell>{p.mrn}</TableCell>
                        <TableCell>{p.patientName}</TableCell>
                        <TableCell>{p.description}</TableCell>
                        <TableCell>1</TableCell>
                        <TableCell>{p.total.toFixed(2)}</TableCell>
                        <TableCell>{p.paid.toFixed(2)}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>{p.paymentDate}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-6 w-6"><Printer className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

              </div>
            </TabsContent>
            <TabsContent value="income-statement" className="pt-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="income-cost-per-patient" />
                    <Label htmlFor="income-cost-per-patient">Cost Per Patient</Label>
                  </div>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Shift" />
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                  <DatePickerWithRange />
                  <div className="flex gap-2 ml-auto">
                    <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                    <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>INCOME STATEMENT</TableHead>
                      <TableHead className="text-right">VALUE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeStatementData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.item}</TableCell>
                        <TableCell className="text-right">{item.value.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="doctors-share" className="pt-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="doctors-share-cost-per-patient" />
                  <Label htmlFor="doctors-share-cost-per-patient">Cost Per Patient</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Dr. Mahvish aftab Khan" />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Procedure" />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                  <DatePickerWithRange />
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                </div>

                <Card className="w-full max-w-xs">
                  <CardHeader><CardTitle className="text-sm font-medium">Doctor's Revenue</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold">400.0</p></CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                  <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                  <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>INVOICE#</TableHead>
                      <TableHead>MR#</TableHead>
                      <TableHead>PATIENT NAME</TableHead>
                      <TableHead>DESCRIPTION</TableHead>
                      <TableHead>TOTAL</TableHead>
                      <TableHead>PAID</TableHead>
                      <TableHead>EXPENSES</TableHead>
                      <TableHead>DOCTOR REVENUE</TableHead>
                      <TableHead>PAYMENT DATE</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctorsShareData.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell>{t.invoice}</TableCell>
                        <TableCell>{t.mrn}</TableCell>
                        <TableCell>{t.patientName}</TableCell>
                        <TableCell>{t.description}</TableCell>
                        <TableCell>{t.total.toFixed(2)}</TableCell>
                        <TableCell>{t.paid.toFixed(2)}</TableCell>
                        <TableCell>0.00</TableCell>
                        <TableCell>{t.doctorRevenue}</TableCell>
                        <TableCell>{t.paymentDate}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-6 w-6"><Lock className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="pending-payments" className="pt-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Doctor" />
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                  <DatePickerWithRange />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Total Dues</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">1,000.00</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Pending Invoices</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">1</p></CardContent>
                  </Card>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                  <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>INVOICE#</TableHead>
                      <TableHead>MR#</TableHead>
                      <TableHead>PATIENT NAME</TableHead>
                      <TableHead>TOTAL</TableHead>
                      <TableHead>PAID</TableHead>
                      <TableHead>DUES</TableHead>
                      <TableHead>PAYMENT DATE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPaymentsData.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell>{t.invoice}</TableCell>
                        <TableCell>{t.mrn}</TableCell>
                        <TableCell>{t.patientName}</TableCell>
                        <TableCell>{t.total.toFixed(2)}</TableCell>
                        <TableCell>{t.paid.toFixed(2)}</TableCell>
                        <TableCell className="text-destructive font-semibold">{t.dues.toFixed(2)}</TableCell>
                        <TableCell>{t.paymentDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="advance-payments" className="pt-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="advance-cost-per-patient" />
                    <Label htmlFor="advance-cost-per-patient">Cost Per Patient</Label>
                  </div>
                  <DatePickerWithRange />
                  <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Cash" /></SelectTrigger></Select>
                  <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Department" /></SelectTrigger></Select>
                  <Input placeholder="Search By Invoice" />
                  <Input placeholder="Search By Name, MR# or Phone" />
                </div>
                <Card className="w-full max-w-xs">
                  <CardHeader><CardTitle className="text-sm font-medium">Total Advance</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold">-0.0</p></CardContent>
                </Card>
                <div className="flex justify-end gap-2">
                  <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                  <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>INVOICE#</TableHead>
                      <TableHead>MR#</TableHead>
                      <TableHead>PATIENT NAME</TableHead>
                      <TableHead>TOTAL</TableHead>
                      <TableHead>PAID</TableHead>
                      <TableHead>ADVANCE</TableHead>
                      <TableHead>ADDED BY</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={8} className="h-48 text-center">
                        <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">There are no records to show.</p>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="deleted-invoices" className="pt-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="deleted-cost-per-patient" />
                    <Label htmlFor="deleted-cost-per-patient">Cost Per Patient</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <DatePickerWithRange />
                    <div className="flex gap-2 ml-auto">
                      <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                      <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                    </div>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PATIENT NAME</TableHead>
                      <TableHead>INVOICE #</TableHead>
                      <TableHead>DESCRIPTION</TableHead>
                      <TableHead>AMOUNT</TableHead>
                      <TableHead>PAID</TableHead>
                      <TableHead>CREATED AT</TableHead>
                      <TableHead>DELETED BY</TableHead>
                      <TableHead>DELETED AT</TableHead>
                      <TableHead>PATIENT TYPE</TableHead>
                      <TableHead>RESTORE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={10} className="h-96 text-center">
                        <ClipboardList className="mx-auto h-16 w-16 text-muted-foreground" />
                        <p className="mt-4 text-lg font-medium text-muted-foreground">There are no records to show.</p>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="refund-report" className="pt-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="refund-cost-per-patient" />
                    <Label htmlFor="refund-cost-per-patient">Cost Per Patient</Label>
                  </div>
                  <DatePickerWithRange />
                  <Input placeholder="Search by Patient MRN" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                  <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>INVOICE#</TableHead>
                      <TableHead>MR#</TableHead>
                      <TableHead>PATIENT NAME</TableHead>
                      <TableHead>DESCRIPTION</TableHead>
                      <TableHead>TOTAL</TableHead>
                      <TableHead>REFUND</TableHead>
                      <TableHead>REASON FOR REFUND</TableHead>
                      <TableHead>REFUNDED BY</TableHead>
                      <TableHead>PAYMENT DATE</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={10} className="h-96 text-center">
                        <ClipboardList className="mx-auto h-16 w-16 text-muted-foreground" />
                        <p className="mt-4 text-lg font-medium text-muted-foreground">There are no records to show.</p>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="statistics" className="pt-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="statistics-cost-per-patient" />
                    <Label htmlFor="statistics-cost-per-patient">Cost Per Patient</Label>
                  </div>
                  <DatePickerWithRange />
                </div>
                <Card>
                  <CardContent className="pt-6 h-96 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[{ name: 'Paid invoices', value: 100 }]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          innerRadius={60}
                          dataKey="value"
                        >
                          <Cell fill="hsl(var(--primary))" />
                        </Pie>
                        <Tooltip />
                        <Legend iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="discounts" className="pt-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="discounts-cost-per-patient" />
                  <Label htmlFor="discounts-cost-per-patient">Cost Per Patient</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <Select><SelectTrigger><SelectValue placeholder="Select Procedure" /></SelectTrigger><SelectContent /></Select>
                  <Select><SelectTrigger><SelectValue placeholder="Select User" /></SelectTrigger><SelectContent /></Select>
                  <Select><SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger><SelectContent /></Select>
                  <DatePickerWithRange />
                  <Input placeholder="Search By Patient MR#" />
                </div>

                <Card className="w-full max-w-xs">
                  <CardHeader><CardTitle className="text-sm font-medium">Total Discount</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold">1,000.0</p></CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                  <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                  <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>INVOICE#</TableHead>
                      <TableHead>MR#</TableHead>
                      <TableHead>PATIENT NAME</TableHead>
                      <TableHead>DESCRIPTION</TableHead>
                      <TableHead>TOTAL</TableHead>
                      <TableHead>PAID</TableHead>
                      <TableHead>DISCOUNT</TableHead>
                      <TableHead>ADDED BY</TableHead>
                      <TableHead>INVOICE DATE</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discountsData.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell>{d.invoice}</TableCell>
                        <TableCell>{d.mrn}</TableCell>
                        <TableCell>{d.patientName}</TableCell>
                        <TableCell>{d.description}</TableCell>
                        <TableCell>{d.total.toFixed(2)}</TableCell>
                        <TableCell>{d.paid.toFixed(2)}</TableCell>
                        <TableCell>{d.discount.toFixed(2)}</TableCell>
                        <TableCell>{d.addedBy}</TableCell>
                        <TableCell>{d.invoiceDate}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" className="h-6 w-6"><Lock className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="profit-loss" className="pt-4">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <DatePickerWithRange />
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Created By" />
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="profit-loss-summary" />
                    <Label htmlFor="profit-loss-summary">Profit & Loss Summary</Label>
                  </div>
                  <div className="flex gap-2 ml-auto">
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" /> Excel
                    </Button>
                    <Button variant="outline">
                      <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">37,000.0</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">590.0</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Net Profit/Loss</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">36,410.0</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Revenue</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>INVOICE#</TableHead>
                        <TableHead>MR#</TableHead>
                        <TableHead>PATIENT NAME</TableHead>
                        <TableHead>REFERRED BY</TableHead>
                        <TableHead>DESCRIPTION</TableHead>
                        <TableHead>TOTAL</TableHead>
                        <TableHead>PAID</TableHead>
                        <TableHead>DISCOUNT</TableHead>
                        <TableHead>DUES</TableHead>
                        <TableHead>DEDUCTIONS</TableHead>
                        <TableHead>TAX DEDUCTIONS</TableHead>
                        <TableHead>INSURANCE CLAIMS</TableHead>
                        <TableHead>ADVANCE</TableHead>
                        <TableHead>MODE OF PAYMENT</TableHead>
                        <TableHead>DOCTOR REVENUE</TableHead>
                        <TableHead>USER INCOME TAX</TableHead>
                        <TableHead>PAYMENT DATE</TableHead>
                        <TableHead>ACTION</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffTransactionData.map((t, i) => (
                        <TableRow key={i}>
                          <TableCell>{t.invoice}</TableCell>
                          <TableCell>{t.mrn}</TableCell>
                          <TableCell>{t.patientName}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>{t.description}</TableCell>
                          <TableCell>{t.total.toFixed(2)}</TableCell>
                          <TableCell>{t.paid.toFixed(2)}</TableCell>
                          <TableCell>{t.discount.toFixed(2)}</TableCell>
                          <TableCell>{t.dues.toFixed(2)}</TableCell>
                          <TableCell>{t.deductionsInsurance.toFixed(2)}</TableCell>
                          <TableCell>{t.taxDeductions.toFixed(2)}</TableCell>
                          <TableCell>{t.insuranceClaims.toFixed(2)}</TableCell>
                          <TableCell>{t.advance.toFixed(2)}</TableCell>
                          <TableCell>Cash</TableCell>
                          <TableCell>{t.doctorRevenue}</TableCell>
                          <TableCell>0.00</TableCell>
                          <TableCell>{t.paymentDate}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6"><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6"><Lock className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mt-6 mb-2">Expenses</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>VOUCHER#</TableHead>
                        <TableHead>EMPLOYEE</TableHead>
                        <TableHead>DESCRIPTION</TableHead>
                        <TableHead>DATE</TableHead>
                        <TableHead>CATEGORY</TableHead>
                        <TableHead>AMOUNT</TableHead>
                        <TableHead>PAYMENT MODE</TableHead>
                        <TableHead>CREATED AT</TableHead>
                        <TableHead>ACTION</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vouchersData.map((v, i) => (
                        <TableRow key={i}>
                          <TableCell>{v.voucher}</TableCell>
                          <TableCell>{v.employee}</TableCell>
                          <TableCell>{v.description}</TableCell>
                          <TableCell>{v.date}</TableCell>
                          <TableCell>{v.category}</TableCell>
                          <TableCell>{v.amount.toFixed(2)}</TableCell>
                          <TableCell>{v.paymentMode}</TableCell>
                          <TableCell>{v.createdAt}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6"><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6"><Lock className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="cost-per-patient" className="pt-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <DatePickerWithRange />
                  <Input placeholder="Search By Patient Wise" className="w-full sm:w-64" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Total Paid Amount</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Total Expenses</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Total Dues</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Total Advance</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Profit/Loss</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
                  </Card>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                  <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SR#</TableHead>
                      <TableHead>INVOICE#</TableHead>
                      <TableHead>MR#</TableHead>
                      <TableHead>PATIENT NAME</TableHead>
                      <TableHead>TOTAL</TableHead>
                      <TableHead>PAID AMOUNT</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center">
                        <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">There are no records to show.</p>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <div className="fixed bottom-8 right-8 flex flex-col gap-2">
        <Button size="icon" className="rounded-full h-12 w-12">
          <FileText className="h-6 w-6" />
        </Button>
        <Button size="icon" className="rounded-full h-12 w-12">
          <Pencil className="h-6 w-6" />
        </Button>
        <Button size="icon" className="rounded-full h-12 w-12">
          <Eye className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
