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
  Search,
  Printer,
  FileText,
  Pencil,
  Eye,
  ClipboardList,
  Users,
  FlaskConical,
  TestTube,
  FileBarChart2,
  ThumbsUp,
  Beaker,
  Hourglass,
  Undo2,
  DollarSign,
  Download,
  BarChart,
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { BillingRecord, Patient, Doctor } from '@/lib/types';


const COLORS = ['hsl(var(--primary))'];

export default function LaboratoryReportPage() {
  const firestore = useFirestore();

  const billingQuery = useMemoFirebase(() => firestore ? collection(firestore, 'billingRecords') : null, [firestore]);
  const patientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'patients') : null, [firestore]);
  const doctorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'doctors') : null, [firestore]);

  const { data: billingRecords, isLoading: billingLoading } = useCollection<BillingRecord>(billingQuery);
  const { data: patients, isLoading: patientsLoading } = useCollection<Patient>(patientsQuery);
  const { data: doctors, isLoading: doctorsLoading } = useCollection<Doctor>(doctorsQuery);

  const isLoading = billingLoading || patientsLoading || doctorsLoading;

  const enrichedTransactions = React.useMemo(() => {
    if (!billingRecords || !patients || !doctors) return [];
    const patientsMap = new Map(patients.map(p => [p.mobileNumber, p]));
    // Assuming billing records might have a doctorId to enrich doctor's name
    // This is a placeholder as BillingRecord type doesn't have doctorId
    return billingRecords.map(record => ({
      ...record,
      patient: patientsMap.get(record.patientMobileNumber)
    }));
  }, [billingRecords, patients, doctors]);


  const transactionData = enrichedTransactions.map(t => ({
    invoice: t.id.slice(0, 6).toUpperCase(),
    mrn: t.patient?.id.slice(0,8) || 'N/A',
    patientName: t.patient?.name || 'N/A',
    referredBy: '-',
    description: 'Lab Tests', // Placeholder
    total: t.consultationCharges + t.procedureCharges + t.medicineCharges,
    paid: t.consultationCharges + t.procedureCharges + t.medicineCharges, // Assuming fully paid
    discount: 0.0,
    dues: 0.0,
    deductionsInsurance: 0.0,
    taxDeductions: 0.0,
    insuranceClaims: 0.0,
    advance: 0.0,
    paymentMode: t.paymentMethod,
    doctorRevenue: '-', // Placeholder
    departmentRevenue: 'Lab = ' + (t.procedureCharges).toFixed(2), // Assuming procedure charges are lab charges
    paymentDate: new Date(t.billingDate).toLocaleString(),
  }));

  const totalRevenue = transactionData.reduce((acc, t) => acc + t.total, 0);

  const tabs = [
    { value: 'transaction', label: 'Transaction', icon: ArrowRightLeft },
    { value: 'staff', label: 'Staff', icon: Users },
    { value: 'referrals', label: 'Referrals', icon: Users },
    { value: 'most-performed', label: 'Most Performed Tests', icon: TestTube },
    { value: 'outsourced', label: 'Outsourced Tests', icon: FlaskConical },
    { value: 'quality-control', label: 'Quality Control', icon: ThumbsUp },
    { value: 'collection-center', label: 'Collection Center', icon: Beaker },
    { value: 'pending-payments', label: 'Pending Payments', icon: Hourglass },
    { value: 'refund-report', label: 'Refund Report', icon: Undo2 },
    { value: 'income-statement', label: 'Income Statement', icon: FileBarChart2 },
  ];


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Laboratory Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transaction" className="w-full">
            <div className="overflow-x-auto">
                <TabsList>
                    {tabs.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value}>
                            <tab.icon className="mr-2 h-4 w-4" />
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>
            <TabsContent value="transaction" className="pt-4">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Test Name, Patient Name, MR#" className="pl-8" />
                  </div>
                  <Input placeholder="Referred By" />
                  <DatePickerWithRange />
                  <Select><SelectTrigger><SelectValue placeholder="Select Report Type" /></SelectTrigger><SelectContent /></Select>
                  <Select><SelectTrigger><SelectValue placeholder="Select Referral" /></SelectTrigger><SelectContent /></Select>
                  <Select><SelectTrigger><SelectValue placeholder="Select Laboratory" /></SelectTrigger><SelectContent /></Select>
                   <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search by Invoice#" className="pl-8" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader><CardTitle className="text-sm font-medium">Total Revenue</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{totalRevenue.toFixed(2)}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-sm font-medium">Outsource Lab Share</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-sm font-medium">Referral Share</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
                    </Card>
                </div>
                
                 <div className="flex justify-end gap-2">
                    <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                    <Button variant="outline">Excel</Button>
                    <Button variant="outline">Customize</Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>NAME</TableHead>
                            <TableHead>PRICE</TableHead>
                            <TableHead>CREATED AT</TableHead>
                            <TableHead>REFERRED BY</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center">Loading...</TableCell>
                            </TableRow>
                        ) : transactionData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <ClipboardList className="h-16 w-16 text-muted-foreground" />
                                        <p className="font-semibold">There is no laboratory reports to show.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactionData.map((t, i) => (
                                <TableRow key={i}>
                                    <TableCell>{t.patientName}</TableCell>
                                    <TableCell>{t.total.toFixed(2)}</TableCell>
                                    <TableCell>{t.paymentDate}</TableCell>
                                    <TableCell>{t.referredBy}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="staff" className="pt-4">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Staff" />
                        </SelectTrigger>
                        <SelectContent>
                            {doctors?.map(d => <SelectItem key={d.id} value={d.id}>{d.fullName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <DatePickerWithRange />
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Shift" />
                        </SelectTrigger>
                        <SelectContent />
                    </Select>
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Doctor" />
                        </SelectTrigger>
                         <SelectContent>
                            {doctors?.map(d => <SelectItem key={d.id} value={d.id}>{d.fullName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <Card className="w-full max-w-xs">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Total Collection</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{totalRevenue.toFixed(2)}</p>
                    </CardContent>
                </Card>

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
                            <TableHead>DEDUCTIONS AGAINST INSURANCE CLAIMS</TableHead>
                            <TableHead>TAX DEDUCTIONS AGAINST INSURANCE CLAIMS</TableHead>
                            <TableHead>INSURANCE CLAIMS</TableHead>
                            <TableHead>ADVANCE</TableHead>
                            <TableHead>DOCTOR REVENUE</TableHead>
                            <TableHead>USER INCOME TAX</TableHead>
                            <TableHead>EXPENSES</TableHead>
                            <TableHead>PAYMENT DATE</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                             <TableRow>
                                <TableCell colSpan={15} className="h-48 text-center">Loading...</TableCell>
                            </TableRow>
                        ) : transactionData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={15} className="h-48 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <ClipboardList className="h-16 w-16 text-muted-foreground" />
                                        <p className="font-semibold">There are no records to show.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                           transactionData.map((t, i) => (
                               <TableRow key={i}>
                                    <TableCell>{t.invoice}</TableCell>
                                    <TableCell>{t.mrn}</TableCell>
                                    <TableCell>{t.patientName}</TableCell>
                                    <TableCell>{t.description}</TableCell>
                                    <TableCell>{t.total.toFixed(2)}</TableCell>
                                    <TableCell>{t.paid.toFixed(2)}</TableCell>
                                    <TableCell>{t.dues.toFixed(2)}</TableCell>
                                    <TableCell>{t.deductionsInsurance.toFixed(2)}</TableCell>
                                    <TableCell>{t.taxDeductions.toFixed(2)}</TableCell>
                                    <TableCell>{t.insuranceClaims.toFixed(2)}</TableCell>
                                    <TableCell>{t.advance.toFixed(2)}</TableCell>
                                    <TableCell>{t.doctorRevenue}</TableCell>
                                    <TableCell>0.00</TableCell>
                                    <TableCell>0.00</TableCell>
                                    <TableCell>{t.paymentDate}</TableCell>
                               </TableRow>
                           ))
                        )}
                    </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="referrals" className="pt-4">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <DatePickerWithRange />
                        <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Referral" /></SelectTrigger><SelectContent/></Select>
                        <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Department" /></SelectTrigger><SelectContent/></Select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="show-dues" />
                        <Label htmlFor="show-dues">Only Show Entries With Dues</Label>
                    </div>
                </div>

                <div className="text-center py-10">
                    <h3 className="font-semibold">Referral Report</h3>
                    <p className="text-muted-foreground mt-4">No data</p>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline">Excel</Button>
                    <Button variant="outline"><Printer className="mr-2 h-4 w-4"/> Print</Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead><Checkbox/></TableHead>
                            <TableHead>INVOICE#</TableHead>
                            <TableHead>PATIENT NAME</TableHead>
                            <TableHead>MR#</TableHead>
                            <TableHead>TESTS</TableHead>
                            <TableHead>TOTAL</TableHead>
                            <TableHead>DISCOUNT</TableHead>
                            <TableHead>PAID</TableHead>
                            <TableHead>REFERRAL SHARE</TableHead>
                            <TableHead>PENDING SHARE</TableHead>
                            <TableHead>PAY FIELD</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={11} className="h-48 text-center">
                                <p className="text-muted-foreground">There are no records to show.</p>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="most-performed" className="pt-4">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <DatePickerWithRange />
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Test Name" className="pl-8" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Total Tests Performed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">0</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Most Performed Test</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">N/A</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Month With Highest Tests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">N/A</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center py-10">
                  <h3 className="font-semibold">Most Performed Tests</h3>
                  <p className="text-muted-foreground mt-4">No data</p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline">
                    <BarChart className="mr-2 h-4 w-4" /> PRINT CHART
                  </Button>
                  <Button variant="outline">
                    <Printer className="mr-2 h-4 w-4" /> Print
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>TEST NAME</TableHead>
                      <TableHead>DEPARTMENT</TableHead>
                      <TableHead>TIMES PERFORMED</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={3} className="h-48 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <ClipboardList className="h-16 w-16 text-muted-foreground" />
                          <p className="font-semibold">There are no records to show.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="outsourced" className="pt-4">
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <DatePickerWithRange />
                            <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Laboratory" /></SelectTrigger><SelectContent/></Select>
                            <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Status" /></SelectTrigger><SelectContent/></Select>
                            <Input placeholder="Search by Invoice Ref" className="w-[180px]" />
                        </div>
                    </div>

                    <div className="text-center py-10">
                        <h3 className="font-semibold">Outsourced Tests</h3>
                        <p className="text-muted-foreground mt-4">No data</p>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline">Excel</Button>
                        <Button variant="outline"><Printer className="mr-2 h-4 w-4"/> Print</Button>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Checkbox/> SELECT ALL</TableHead>
                                <TableHead>INVOICE REF</TableHead>
                                <TableHead>PATIENT NAME</TableHead>
                                <TableHead>TEST NAME</TableHead>
                                <TableHead>QUANTITY</TableHead>
                                <TableHead>RETURN QUANTITY</TableHead>
                                <TableHead>LABORATORY NAME</TableHead>
                                <TableHead>TEST PRICE</TableHead>
                                <TableHead>LABORATORY SHARE</TableHead>
                                <TableHead>PROCESSED SHARE</TableHead>
                                <TableHead>PENDING SHARE</TableHead>
                                <TableHead>INVOICE CREATED AT</TableHead>
                                <TableHead>PAY FIELD</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={13} className="h-48 text-center">
                                    <p className="text-muted-foreground">There are no records to show.</p>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>
            <TabsContent value="quality-control" className="pt-4">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <DatePickerWithRange />
                        <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Doctor" /></SelectTrigger><SelectContent/></Select>
                    </div>
                </div>

                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Time Period Accuracy</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-2xl font-bold">N/A</p>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                    <Button variant="outline">Excel</Button>
                    <Button variant="outline"><Printer className="mr-2 h-4 w-4"/> Print</Button>
                    <Button variant="outline">Customize</Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>LAB#</TableHead>
                            <TableHead>DOCTOR NAME</TableHead>
                            <TableHead>PATIENT MR#</TableHead>
                            <TableHead>PATIENT NAME</TableHead>
                            <TableHead>TEST NAME</TableHead>
                            <TableHead>ORDER DATE</TableHead>
                            <TableHead>SAMPLE COLLECTED BY</TableHead>
                            <TableHead>RESULTS ENTERED BY</TableHead>
                            <TableHead>TEST VALIDATED BY</TableHead>
                            <TableHead>TURN AROUND TIME (DAYS/HOURS/MINUTES)</TableHead>
                            <TableHead>STATUS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={11} className="h-48 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <ClipboardList className="h-16 w-16 text-muted-foreground" />
                                    <p className="font-semibold">There are no records to show.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="collection-center" className="pt-4">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <Select>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Select Collection Center" />
                    </SelectTrigger>
                    <SelectContent/>
                  </Select>
                  <DatePickerWithRange />
                </div>
                 <Card className="w-full max-w-xs">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Total Collection Center Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">0.0</p>
                    </CardContent>
                </Card>
                 <div className="flex justify-end gap-2">
                    <Button variant="outline">Excel</Button>
                    <Button variant="outline"><Printer className="mr-2 h-4 w-4"/> Print</Button>
                </div>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>COLLECTION CENTER</TableHead>
                            <TableHead>TOTAL TESTS</TableHead>
                            <TableHead>TOTAL REVENUE</TableHead>
                            <TableHead>COLLECTION CENTER SHARE</TableHead>
                            <TableHead>LAB SHARE</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={5} className="h-48 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <ClipboardList className="h-16 w-16 text-muted-foreground" />
                                    <p className="font-semibold">There are no records to show.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="pending-payments" className="pt-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <DatePickerWithRange />
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                </div>

                <Card className="w-full max-w-xs">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Total Dues</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">0.0</p>
                    </CardContent>
                </Card>
                
                 <div className="flex justify-end gap-2">
                    <Button variant="outline">Excel</Button>
                    <Button variant="outline"><Printer className="mr-2 h-4 w-4"/> Print</Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead><Checkbox/> SELECT ALL</TableHead>
                            <TableHead>MR#</TableHead>
                            <TableHead>PATIENT NAME</TableHead>
                            <TableHead>INVOICE NUMBER</TableHead>
                            <TableHead>TESTS</TableHead>
                            <TableHead>TOTAL</TableHead>
                            <TableHead>PAID</TableHead>
                            <TableHead>DUE</TableHead>
                            <TableHead>PAY FIELD</TableHead>
                            <TableHead>CREDITOR</TableHead>
                            <TableHead>DEPARTMENT</TableHead>
                            <TableHead>REFERRAL</TableHead>
                            <TableHead>CREATED AT</TableHead>
                            <TableHead>ACTION</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={14} className="h-48 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <ClipboardList className="h-16 w-16 text-muted-foreground" />
                                    <p className="font-semibold">There are no records to show.</p>
                                </div>
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
                                  <div className="flex flex-col items-center gap-2">
                                      <ClipboardList className="h-16 w-16 text-muted-foreground" />
                                      <p className="mt-4 text-lg font-medium text-muted-foreground">There are no refund reports to show.</p>
                                  </div>
                              </TableCell>
                          </TableRow>
                      </TableBody>
                  </Table>
              </div>
            </TabsContent>
            <TabsContent value="income-statement" className="pt-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <Select>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Shift" />
                      </SelectTrigger>
                      <SelectContent />
                    </Select>
                    <DatePickerWithRange />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline">Excel</Button>
                    <Button variant="outline">
                      <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
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
                    <TableRow>
                      <TableCell>Total Expenses</TableCell>
                      <TableCell className="text-right">0.0</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Revenue</TableCell>
                      <TableCell className="text-right">0.0</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Net Income</TableCell>
                      <TableCell className="text-right">0.0</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <div className="fixed bottom-8 right-8 flex flex-col gap-2">
        <Button size="icon" className="rounded-full h-12 w-12"><FileText className="h-6 w-6" /></Button>
        <Button size="icon" className="rounded-full h-12 w-12"><Pencil className="h-6 w-6" /></Button>
        <Button size="icon" className="rounded-full h-12 w-12"><Eye className="h-6 w-6" /></Button>
      </div>
    </div>
  );
}
