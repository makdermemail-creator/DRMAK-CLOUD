'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  PieChart,
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
} from 'recharts';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { BillingRecord } from '@/lib/types';
import { format } from 'date-fns';

export default function OPDReportPage() {
  const firestore = useFirestore();
  const billingQuery = useMemoFirebase(() => firestore ? collection(firestore, 'billingRecords') : null, [firestore]);
  const { data: billingRecords, isLoading } = useCollection<BillingRecord>(billingQuery);
  
  const chartData = React.useMemo(() => {
    if (!billingRecords) return [];
    const hourlyRevenue: { [key: string]: number } = {};
    for (let i = 0; i < 24; i++) {
        hourlyRevenue[format(new Date(0, 0, 0, i), 'HH:mm')] = 0;
    }

    billingRecords.forEach(record => {
        const hour = format(new Date(record.billingDate), 'HH:00');
        const revenue = record.consultationCharges + record.procedureCharges + record.medicineCharges;
        if(hourlyRevenue[hour] !== undefined) {
             hourlyRevenue[hour] += revenue;
        }
    });

    return Object.entries(hourlyRevenue).map(([name, value]) => ({name, value})).sort((a,b) => a.name.localeCompare(b.name));

  }, [billingRecords]);

  const totalRevenue = React.useMemo(() => {
    if(!billingRecords) return 0;
    return billingRecords.reduce((acc, record) => acc + record.consultationCharges + record.procedureCharges + record.medicineCharges, 0);
  }, [billingRecords]);


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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <Select defaultValue="opd">
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="opd">OPD</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Payment Mode" />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                  <DatePickerWithRange />
                  <div className="space-y-1">
                    <Input placeholder="Search by Invoice#" />
                    <Input placeholder="Refer By" />
                  </div>

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
                  <div className="flex items-center gap-2">
                     <Input placeholder="Lower Invoice# Range" />
                     <span>To</span>
                     <Input placeholder="Upper Invoice# Range" />
                  </div>

                  <Input placeholder="Search By Patient MR#" />
                   <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Doctor Share Filter" />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                  <div className="col-start-4 flex justify-end">
                    <Button>Search</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader><CardTitle className="text-sm font-medium">Total Revenue</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{totalRevenue.toFixed(2)}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-sm font-medium">Total Cash</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{totalRevenue.toFixed(2)}</p></CardContent>
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
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))'
                                }}
                             />
                            <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

              </div>
            </TabsContent>
            {/* Add other TabsContent here */}
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
