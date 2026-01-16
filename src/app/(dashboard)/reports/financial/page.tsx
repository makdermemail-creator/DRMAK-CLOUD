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

const chartData = [
  { name: '01:00', value: 0 },
  { name: '02:00', value: 0 },
  { name: '03:00', value: 0 },
  { name: '04:00', value: 0 },
  { name: '05:00', value: 0 },
  { name: '06:00', value: 0 },
  { name: '07:00', value: 0 },
  { name: '08:00', value: 8000 },
  { name: '09:00', value: 2000 },
  { name: '10:00', value: 1000 },
  { name: '11:00', value: 0 },
  { name: '12:00', value: 0 },
];

const transactionData = [
    {
        invoice: 'H0840',
        mrn: '108209-1',
        patientName: 'Rabia Faisal',
        referredBy: '-',
        description: 'Dr. Iffatullah Afridi Khan, Consultation fee',
        total: 2500.00,
        paid: 2500.00,
        discount: 0.0,
        dues: 0.0,
        deductionsInsurance: 0.0,
        taxDeductions: 0.0,
        insuranceClaims: 0.0,
        advance: 0.0,
        paymentMode: 'Cash',
        doctorRevenue: 'Dr. Iffatullah Afridi Khan = 2,500.00',
        departmentRevenue: 'OPD = 2,500.00',
        paymentDate: '23/12/2025 - 02:40PM'
    },
    {
        invoice: 'H0841',
        mrn: '107350-1',
        patientName: 'Mr.Payal',
        referredBy: '-',
        description: 'Mesotherapy T',
        total: 8000.0,
        paid: 8000.0,
        discount: 0.0,
        dues: 0.0,
        deductionsInsurance: 0.0,
        taxDeductions: 0.0,
        insuranceClaims: 0.0,
        advance: 0.0,
        paymentMode: 'Cash',
        doctorRevenue: '-',
        departmentRevenue: 'OPD = 8,000.00',
        paymentDate: '23/12/2025 - 03:00PM'
    },
    {
        invoice: 'H0842',
        mrn: '108294-1',
        patientName: 'Zoya Amal',
        referredBy: '-',
        description: 'Dr. Iffatullah Afridi Khan, Consultation fee',
        total: 2500.0,
        paid: 1000.0,
        discount: 0.0,
        dues: 1500.0,
        deductionsInsurance: 0.0,
        taxDeductions: 0.0,
        insuranceClaims: 0.0,
        advance: 0.0,
        paymentMode: 'Cash',
        doctorRevenue: 'Dr. Iffatullah Afridi Khan = 1,000.00',
        departmentRevenue: 'OPD = 1,000.00',
        paymentDate: '23/12/2025 - 05:00PM'
    }
];

const shiftTransactionData = [
  {
    invoice: 'H0840',
    mrn: '108209-1',
    patientName: 'Rabia Faisal',
    description: 'Dr. Mahvish Aftab Khan, Consultation Fee',
    total: 2500.0,
    paid: 2500.0,
    discount: 0.0,
    dues: 0.0,
    doctorRevenue: 'Dr. Mahvish Aftab Khan -> 250.0',
    departmentRevenue: 'OPD -> 2,500.0',
    paymentDate: '23/12/2025 - 03:40PM',
  },
  {
    invoice: 'H0841',
    mrn: '107350-1',
    patientName: 'Mr.Payal',
    description: 'Mesotherapy T',
    total: 8000.0,
    paid: 8000.0,
    discount: 0.0,
    dues: 0.0,
    doctorRevenue: '-',
    departmentRevenue: 'OPD -> 8,000.0',
    paymentDate: '23/12/2025 - 03:58PM',
  },
  {
    invoice: 'H0842',
    mrn: '108294-1',
    patientName: 'Zoya Amal',
    description: 'Dr. Mahvish Aftab Khan, Consultation Fee',
    total: 2500.0,
    paid: 1500.0,
    discount: 0.0,
    dues: 1000.0,
    doctorRevenue: 'Dr. Mahvish Aftab Khan -> 150.0',
    departmentRevenue: 'OPD -> 1,500.0',
    paymentDate: '23/12/2025 - 05:00PM',
  },
  {
    invoice: 'H0843',
    mrn: '107152-1',
    patientName: 'Muneera Kiyani',
    description: 'Laser(Dual Face+Neck), Pico Laser',
    total: 25000.0,
    paid: 25000.0,
    discount: 0.0,
    dues: 0.0,
    doctorRevenue: '-',
    departmentRevenue: 'OPD -> 25,000.0',
    paymentDate: '23/12/2025 - 06:09PM',
  },
];

const staffTransactionData = [
    {
        invoice: 'H0840',
        mrn: '108209-1',
        patientName: 'Rabia Faisal',
        description: 'Dr. Mahvish Aftab Khan, Consultation Fee',
        total: 2500.0,
        paid: 2500.0,
        dues: 0.0,
        discount: 0.0,
        deductionsInsurance: 0.0,
        taxDeductions: 0.0,
        insuranceClaims: 0.0,
        advance: 0.0,
        doctorRevenue: 'Dr. Mahvish Aftab Khan -> 250.0',
        userIncomeTax: 0.0,
        expenses: 0.0,
        paymentDate: '23/12/2025 - 03:40PM',
    },
    {
        invoice: 'H0841',
        mrn: '107350-1',
        patientName: 'Mr.Payal',
        description: 'Mesotherapy T',
        total: 8000.0,
        paid: 8000.0,
        dues: 0.0,
        discount: 0.0,
        deductionsInsurance: 0.0,
        taxDeductions: 0.0,
        insuranceClaims: 0.0,
        advance: 0.0,
        doctorRevenue: '-',
        userIncomeTax: 0.0,
        expenses: 0.0,
        paymentDate: '23/12/2025 - 03:58PM',
    },
    {
        invoice: 'H0842',
        mrn: '108294-1',
        patientName: 'Zoya Amal',
        description: 'Dr. Mahvish Aftab Khan, Consultation Fee',
        total: 2500.0,
        paid: 1500.0,
        dues: 1000.0,
        discount: 0.0,
        deductionsInsurance: 0.0,
        taxDeductions: 0.0,
        insuranceClaims: 0.0,
        advance: 0.0,
        doctorRevenue: 'Dr. Mahvish Aftab Khan -> 150.0',
        userIncomeTax: 0.0,
        expenses: 0.0,
        paymentDate: '23/12/2025 - 05:00PM',
    },
    {
        invoice: 'H0843',
        mrn: '107152-1',
        patientName: 'Muneera Kiyani',
        description: 'Laser(Dual Face+Neck), Pico Laser',
        total: 25000.0,
        paid: 25000.0,
        dues: 0.0,
        discount: 0.0,
        deductionsInsurance: 0.0,
        taxDeductions: 0.0,
        insuranceClaims: 0.0,
        advance: 0.0,
        doctorRevenue: '-',
        userIncomeTax: 0.0,
        expenses: 0.0,
        paymentDate: '23/12/2025 - 06:09PM',
    }
];

const paymentModeData = [
  {
    invoice: 'H0840',
    mrn: '108209-1',
    patientName: 'Rabia Faisal',
    description: 'Dr. Mahvish Aftab Khan, Consultation Fee',
    total: 2500.0,
    paid: 2500.0,
    discount: 0.0,
    dues: 0.0,
    paymentMode: 'Cash',
    departmentRevenue: 'OPD -> 2,500.0',
    paymentDate: '23/12/2025 - 03:40PM',
  },
  {
    invoice: 'H0841',
    mrn: '107350-1',
    patientName: 'Mr.Payal',
    description: 'Mesotherapy T',
    total: 8000.0,
    paid: 8000.0,
    discount: 0.0,
    dues: 0.0,
    paymentMode: 'Cash',
    departmentRevenue: 'OPD -> 8,000.0',
    paymentDate: '23/12/2025 - 03:58PM',
  },
  {
    invoice: 'H0842',
    mrn: '108294-1',
    patientName: 'Zoya Amal',
    description: 'Dr. Mahvish Aftab Khan, Consultation Fee',
    total: 2500.0,
    paid: 1500.0,
    discount: 0.0,
    dues: 1000.0,
    paymentMode: 'Cash',
    departmentRevenue: 'OPD -> 1,500.0',
    paymentDate: '23/12/2025 - 05:00PM',
  },
   {
    invoice: 'H0843',
    mrn: '107152-1',
    patientName: 'Muneera Kiyani',
    description: 'Laser(Dual Face+Neck), Pico Laser',
    total: 25000.0,
    paid: 25000.0,
    discount: 0.0,
    dues: 0.0,
    paymentMode: 'Cash',
    departmentRevenue: 'OPD -> 25,000.0',
    paymentDate: '23/12/2025 - 06:09PM',
  },
];

const proceduresData = [
  {
    invoice: 'H0843',
    mrn: '107152-1',
    patientName: 'Muneera Kiyani',
    description: 'Laser(Dual Face+Neck), Pico Laser',
    qty: 1,
    total: 25000.0,
    paid: 25000.0,
    procedures: 'Laser >= 0',
    paymentDate: '23/12/2025 - 06:09PM',
  },
];

const incomeStatementData = [
    { item: 'Office Supplies', value: 590.0 },
    { item: 'Total Expenses', value: 590.0 },
    { item: 'Total Revenue', value: 37000.0 },
    { item: 'Net Income', value: 36410.0 },
];

const doctorsShareData = [
    {
        invoice: 'H0840',
        mrn: '108209-1',
        patientName: 'Rabia Faisal',
        description: 'Dr. Mahvish Aftab Khan, Consultation fee',
        total: 2500.0,
        paid: 2500.0,
        expenses: 0.0,
        doctorRevenue: 'Dr. Mahvish Aftab Khan -> 250.0',
        paymentDate: '23/12/2025 - 03:40PM',
    },
    {
        invoice: 'H0842',
        mrn: '108294-1',
        patientName: 'Zoya Amal',
        description: 'Dr. Mahvish Aftab Khan, Consultation fee',
        total: 2500.0,
        paid: 1500.0,
        expenses: 0.0,
        doctorRevenue: 'Dr. Mahvish Aftab Khan -> 150.0',
        paymentDate: '23/12/2025 - 05:00PM',
    },
];

const pendingPaymentsData = [
    {
        invoice: 'H0842',
        mrn: '108294-1',
        patientName: 'Zoya Amal',
        total: 2500.0,
        paid: 1500.0,
        dues: 1000.0,
        paymentDate: '23/12/2025 - 05:00PM',
    },
];

const discountsData = [
  {
    invoice: 'H0842',
    mrn: '108294-1',
    patientName: 'Zoya Amal',
    description: 'Dr. Mahvish Aftab Khan, Consultation Fee',
    total: 2500.0,
    paid: 1500.0,
    discount: 1000.0,
    addedBy: 'Muhammad Umar',
    invoiceDate: '23/12/2025',
  },
];

const vouchersData = [
    {
        voucher: '10089',
        employee: 'tea boy',
        description: 'tea',
        date: '23/12/2025',
        category: 'Office Supplies',
        amount: 250.0,
        paymentMode: 'Cash',
        createdAt: '23/12/2025 - 06:04PM',
    },
    {
        voucher: '10090',
        employee: 'water bottle',
        description: 'water',
        date: '23/12/2025',
        category: 'Office Supplies',
        amount: 220.0,
        paymentMode: 'Cash',
        createdAt: '23/12/2025 - 06:05PM',
    },
    {
        voucher: '10091',
        employee: 'tea',
        description: 'tea',
        date: '23/12/2025',
        category: 'Office Supplies',
        amount: 120.0,
        paymentMode: 'Cash',
        createdAt: '23/12/2025 - 06:06PM',
    },
];

const pieData = [{ name: 'Cash', value: 37000 }];
const COLORS = ['hsl(var(--primary))'];

export default function FinancialReportPage() {
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
                                <TableCell>{t.userIncomeTax.toFixed(2)}</TableCell>
                                <TableCell>{t.expenses.toFixed(2)}</TableCell>
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
                        <TableCell>{p.qty}</TableCell>
                        <TableCell>{p.total.toFixed(2)}</TableCell>
                        <TableCell>{p.paid.toFixed(2)}</TableCell>
                        <TableCell>{p.procedures}</TableCell>
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
                                <TableCell>{t.expenses.toFixed(2)}</TableCell>
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
                      <Select><SelectTrigger><SelectValue placeholder="Select Procedure" /></SelectTrigger><SelectContent/></Select>
                      <Select><SelectTrigger><SelectValue placeholder="Select User" /></SelectTrigger><SelectContent/></Select>
                      <Select><SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger><SelectContent/></Select>
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
                    <SelectContent/>
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
                                    <TableCell>{t.userIncomeTax.toFixed(2)}</TableCell>
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
