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
import {
  Search,
  Download,
  Printer,
  FileText,
  Pencil,
  Eye,
  ClipboardList,
  LineChart as LineChartIcon,
  Lock,
  Info,
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
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/DatePicker';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { PharmacyItem, BillingRecord } from '@/lib/types';
import { isAfter, parseISO } from 'date-fns';

export default function PharmacyReportPage() {
  const firestore = useFirestore();
  const pharmacyQuery = useMemoFirebase(() => firestore ? collection(firestore, 'pharmacyItems') : null, [firestore]);
  const billingQuery = useMemoFirebase(() => firestore ? collection(firestore, 'billingRecords') : null, [firestore]);
  
  const { data: pharmacyItems, isLoading: itemsLoading } = useCollection<PharmacyItem>(pharmacyQuery);
  const { data: billingRecords, isLoading: billingLoading } = useCollection<BillingRecord>(billingQuery);
  
  const isLoading = itemsLoading || billingLoading;

  const lowStockItems = React.useMemo(() => {
      if (!pharmacyItems) return [];
      return pharmacyItems.filter(item => item.quantity < 10); // Example threshold
  }, [pharmacyItems]);

  const deadStockItems = React.useMemo(() => {
      // This is a complex calculation. For now, we filter items with low quantity as a placeholder.
      if (!pharmacyItems) return [];
      return pharmacyItems.filter(item => item.quantity <= 1);
  }, [pharmacyItems]);
  
  const totalRevenue = React.useMemo(() => {
      if (!billingRecords) return 0;
      return billingRecords.reduce((sum, record) => sum + record.medicineCharges, 0);
  }, [billingRecords]);

  const tabs = [
    { value: 'transaction', label: 'Transaction' },
    { value: 'narcotic', label: 'Narcotic' },
    { value: 'income-statement', label: 'Income Statement' },
    { value: 'doctorwise-sales', label: 'Doctorwise Sales' },
    { value: 'itemwise-revenue', label: 'Itemwise Revenue' },
    { value: 'low-stocks', label: 'Low Stocks' },
    { value: 'purchase-reports', label: 'Purchase Reports' },
    { value: 'open-sale-returns', label: 'Open Sale Returns' },
    { value: 'discounts', label: 'Discounts' },
    { value: 'profit-loss-statement', label: 'Profit/Loss Statement' },
    { value: 'dead-stock', label: 'Dead Stock' },
    { value: 'expiry', label: 'Expiry' },
    { value: 'stock-statistics', label: 'Stock Statistics' },
    { value: 'pending-payments', label: 'Pending Payments' },
    { value: 'manufacturerwise-sales', label: 'Manufacturerwise Sales' },
    { value: 'stock-expiry-report', label: 'Stock Expiry Report' },
    { value: 'closing-revenue', label: 'Closing Revenue' },
    { value: 'shift', label: 'Shift' },
    { value: 'itemwise-purchase-margin-report', label: 'Itemwise Purchase Margin Report' },
    { value: 'itemwise-sales-margin-report', label: 'Itemwise Sales Margin Report' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pharmacy</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="closing-revenue" className="w-full">
            <div className="overflow-x-auto">
              <TabsList className="h-auto whitespace-nowrap">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value="transaction" className="pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <DatePickerWithRange />
                  <Input placeholder="Search By Invoice# & Patient Name" />
                  <Input placeholder="Search By Item Name" />
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                  <Input placeholder="Search By Order #" />
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Payment Mode" />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader><CardTitle className="text-sm font-medium">Total Revenue</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{totalRevenue.toFixed(2)}</p></CardContent>
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
                            <TableHead>PATIENT</TableHead>
                            <TableHead>TOTAL</TableHead>
                            <TableHead>PAID</TableHead>
                            <TableHead>PAYMENT MODE</TableHead>
                            <TableHead>DEPARTMENT REVENUE</TableHead>
                            <TableHead>PAYMENT DATE</TableHead>
                            <TableHead>SOURCE</TableHead>
                            <TableHead>CREATED AT</TableHead>
                            <TableHead>CREATED BY</TableHead>
                            <TableHead>ACTION</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={12} className="h-48 text-center">Loading...</TableCell></TableRow>
                        ) : billingRecords?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={12} className="h-48 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <ClipboardList className="h-16 w-16 text-muted-foreground" />
                                        <p className="font-semibold">There are no invoices to show.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                           billingRecords?.map(record => (
                               <TableRow key={record.id}>
                                   <TableCell>{record.id.slice(0,8)}</TableCell>
                                   <TableCell>{record.patientMobileNumber}</TableCell>
                                   <TableCell>Patient Name</TableCell>
                                   <TableCell>{record.medicineCharges.toFixed(2)}</TableCell>
                                   <TableCell>{record.medicineCharges.toFixed(2)}</TableCell>
                                   <TableCell>{record.paymentMethod}</TableCell>
                                   <TableCell>Pharmacy</TableCell>
                                   <TableCell>{new Date(record.billingDate).toLocaleDateString()}</TableCell>
                                   <TableCell>POS</TableCell>
                                   <TableCell>{new Date(record.billingDate).toLocaleString()}</TableCell>
                                   <TableCell>Admin</TableCell>
                                   <TableCell></TableCell>
                               </TableRow>
                           ))
                        )}
                    </TableBody>
                </Table>

              </div>
            </TabsContent>
             <TabsContent value="narcotic" className="pt-4">
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <DatePickerWithRange />
                         <div className="flex items-center gap-2">
                            <Button variant="outline">Excel</Button>
                            <Button variant="outline"><Printer className="mr-2 h-4 w-4"/> Print</Button>
                        </div>
                    </div>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>INVOICE#</TableHead>
                                <TableHead>PATIENT</TableHead>
                                <TableHead>DOCTOR</TableHead>
                                <TableHead>NARCOTIC DRUG(S)</TableHead>
                                <TableHead>QUANTITY</TableHead>
                                <TableHead>VALUE</TableHead>
                                <TableHead>PAYMENT DATE</TableHead>
                                <TableHead>CREATED AT</TableHead>
                                <TableHead>CREATED BY</TableHead>
                                <TableHead>ACTION</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={10} className="h-96 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <ClipboardList className="h-16 w-16 text-muted-foreground" />
                                        <p className="font-semibold">There are no invoices to show.</p>
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
                  <DatePickerWithRange />
                  <div className="flex items-center gap-2">
                    <Button variant="outline">Excel</Button>
                    <Button variant="outline"><Printer className="mr-2 h-4 w-4"/> Print</Button>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>INCOME STATEMENT</TableHead>
                      <TableHead className="text-right">_</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Stock Payments</TableCell>
                      <TableCell className="text-right">0.0</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Revenue</TableCell>
                      <TableCell className="text-right">0.0</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>NET INCOME</TableCell>
                      <TableCell className="text-right">0.0</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="doctorwise-sales" className="pt-4">
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <Select>
                            <SelectTrigger className="w-[280px]">
                                <SelectValue placeholder="Select Doctor" />
                            </SelectTrigger>
                            <SelectContent></SelectContent>
                        </Select>
                        <DatePickerWithRange />
                    </div>
                    <Card className="w-full max-w-xs">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">0.0</p>
                        </CardContent>
                    </Card>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                        <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>DOCTOR'S NAME</TableHead>
                                <TableHead className="text-right">TOTAL REVENUE</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={2} className="h-48 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <ClipboardList className="h-16 w-16 text-muted-foreground" />
                                        <p className="font-semibold">There are no invoices to show.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>
            <TabsContent value="itemwise-revenue" className="pt-4">
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <DatePickerWithRange />
                        <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Search by Item" /></SelectTrigger><SelectContent/></Select>
                        <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Category" /></SelectTrigger><SelectContent/></Select>
                        <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Supplier" /></SelectTrigger><SelectContent/></Select>
                        <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="UNIT" /></SelectTrigger><SelectContent/></Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-medium">Total Revenue</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle className="text-sm font-medium">Total Quantity</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Items Revenue</CardTitle>
                        </CardHeader>
                        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
                            <LineChartIcon className="h-12 w-12" />
                            <p>Chart will be displayed here.</p>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                        <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                    </div>
                    
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ITEM NAME</TableHead>
                                <TableHead>CATEGORY</TableHead>
                                <TableHead>MANUFACTURER</TableHead>
                                <TableHead>SUPPLIERS</TableHead>
                                <TableHead>AVAILABLE QUANTITY</TableHead>
                                <TableHead>SOLD QUANTITY</TableHead>
                                <TableHead>REVENUE</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={7} className="h-48 text-center">
                                    <p>There are no items to show.</p>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>
            <TabsContent value="low-stocks" className="pt-6">
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox />
                      </TableHead>
                      <TableHead>ITEM NAME</TableHead>
                      <TableHead>RE-ORDERING LEVEL</TableHead>
                      <TableHead>UNITS LEFT</TableHead>
                      <TableHead>LAST STOCK ADDED</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                        <TableRow><TableCell colSpan={6} className="h-48 text-center">Loading...</TableCell></TableRow>
                    ) : lowStockItems.length === 0 ? (
                         <TableRow><TableCell colSpan={6} className="h-48 text-center">No low stock items.</TableCell></TableRow>
                    ) : (
                        lowStockItems.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                <Checkbox />
                                </TableCell>
                                <TableCell>{item.productName}</TableCell>
                                <TableCell>10</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{/* Placeholder for last stock added */}</TableCell>
                                <TableCell>
                                <Button size="sm">PO</Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <div>
                        <Button variant="outline">Create PO</Button>
                    </div>
                    <div className="flex items-center gap-4">
                        <span>Rows per page: {lowStockItems.length}</span>
                        <span>1 - {lowStockItems.length} of {lowStockItems.length}</span>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" disabled>&lt;</Button>
                            <Button variant="ghost" size="icon" disabled>&gt;</Button>
                        </div>
                    </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="purchase-reports" className="pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  <Select><SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger><SelectContent/></Select>
                  <Select><SelectTrigger><SelectValue placeholder="Select Document Number" /></SelectTrigger><SelectContent/></Select>
                  <Select><SelectTrigger><SelectValue placeholder="Select Payment Mode" /></SelectTrigger><SelectContent/></Select>
                  <Select><SelectTrigger><SelectValue placeholder="Select Invoice Number" /></SelectTrigger><SelectContent/></Select>
                  <DatePickerWithRange />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardHeader><CardTitle className="text-sm font-medium">Purchase Paid Amount</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-sm font-medium">Total Dues</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-sm font-medium">Total Advance Tax</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-sm font-medium">Total WHT</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
                    </Card>
                </div>
                
                <div className="flex justify-end gap-2 mb-4">
                    <Button variant="outline">Excel</Button>
                    <Button variant="outline">Print</Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>DOCUMENT NO.</TableHead>
                            <TableHead>SUPPLIER</TableHead>
                            <TableHead>STOCK DATE</TableHead>
                            <TableHead>SUPPLIER INVOICE#</TableHead>
                            <TableHead>SUPPLIER INVOICE DATE</TableHead>
                            <TableHead>TOTAL</TableHead>
                            <TableHead>PAID</TableHead>
                            <TableHead>AMOUNT DUE</TableHead>
                            <TableHead>WHT</TableHead>
                            <TableHead>ADVANCE TAX</TableHead>
                            <TableHead>PAYMENT DATE</TableHead>
                            <TableHead>ACTIONS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={12} className="h-48 text-center">
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
            <TabsContent value="open-sale-returns" className="pt-4">
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-start gap-4">
                        <DatePickerWithRange />
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">0.0</p>
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Refund</CardTitle>
                                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">0.0</p>
                            </CardContent>
                        </Card>
                    </div>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>RETURN#</TableHead>
                                <TableHead>MR#</TableHead>
                                <TableHead>PATIENT NAME</TableHead>
                                <TableHead>ITEM NAME</TableHead>
                                <TableHead>INVOICE#</TableHead>
                                <TableHead>RETURN QTY</TableHead>
                                <TableHead>TOTAL REFUND AMOUNT</TableHead>
                                <TableHead>CREATED AT</TableHead>
                                <TableHead>CREATED BY</TableHead>
                                <TableHead>ACTION</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={10} className="h-48 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <ClipboardList className="h-16 w-16 text-muted-foreground" />
                                        <p className="font-semibold">There are no sale return to show.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>
            <TabsContent value="discounts" className="pt-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Cost Of Available Stock</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-fuchsia-500">0.00</p>
                        </CardContent>
                    </Card>
                    <div className="flex items-center gap-2">
                        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                        <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                    </div>
                </div>

                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ITEM NAME</TableHead>
                            <TableHead>CATEGORY</TableHead>
                            <TableHead>MANUFACTURER</TableHead>
                            <TableHead>SUPPLIERS</TableHead>
                            <TableHead>AVAILABLE QTY</TableHead>
                            <TableHead className="text-right">UNIT COST</TableHead>
                            <TableHead className="text-right">TOTAL COST</TableHead>
                            <TableHead>LAST STOCK-IN</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         <TableRow>
                            <TableCell colSpan={8} className="h-48 text-center">No data available</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="profit-loss-statement" className="pt-4">
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <DatePickerWithRange />
                        <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Created By" /></SelectTrigger><SelectContent/></Select>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="profit-loss-summary-checkbox" />
                            <label htmlFor="profit-loss-summary-checkbox" className="text-sm font-medium">Profit & Loss Summary</label>
                        </div>
                        <div className="flex gap-2 ml-auto">
                            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                            <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-medium">Total Revenue</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-medium">Total Expense</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-medium">Net Profit/Loss</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">0.0</p></CardContent>
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
                                <TableRow>
                                    <TableCell colSpan={18} className="h-48 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <ClipboardList className="h-16 w-16 text-muted-foreground" />
                                            <p className="font-semibold">There are no records to show.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
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
                                <TableRow>
                                    <TableCell colSpan={9} className="h-48 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <ClipboardList className="h-16 w-16 text-muted-foreground" />
                                            <p className="font-semibold">There are no records to show.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="dead-stock" className="pt-6">
              <div className="space-y-4">
                 <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <DatePickerWithRange />
                        <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Search by Item" /></SelectTrigger><SelectContent/></Select>
                        <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Manufacturer" /></SelectTrigger><SelectContent/></Select>
                        <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Supplier" /></SelectTrigger><SelectContent/></Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                        <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                    </div>
                </div>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Cost Of Available Stock</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-fuchsia-500">0.00</p>
                    </CardContent>
                </Card>

                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ITEM NAME</TableHead>
                            <TableHead>CATEGORY</TableHead>
                            <TableHead>MANUFACTURER</TableHead>
                            <TableHead>SUPPLIERS</TableHead>
                            <TableHead>AVAILABLE QTY.</TableHead>
                            <TableHead className="text-right">UNIT COST</TableHead>
                            <TableHead className="text-right">TOTAL COST</TableHead>
                            <TableHead>LAST SALES AT</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                             <TableRow><TableCell colSpan={8} className="h-48 text-center">Loading...</TableCell></TableRow>
                        ) : deadStockItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-48 text-center">No dead stock items.</TableCell>
                            </TableRow>
                        ) : (
                            deadStockItems.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.productName}</TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell>{item.manufacturer || '-'}</TableCell>
                                    <TableCell>{item.supplier}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell className="text-right">{item.purchasePrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{(item.purchasePrice * item.quantity).toFixed(2)}</TableCell>
                                    <TableCell>{/* Placeholder for last sale date */}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="expiry" className="pt-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <DatePickerWithRange />
                        <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Item" /></SelectTrigger><SelectContent/></Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline">Excel</Button>
                        <Button variant="outline"><Printer className="mr-2 h-4 w-4"/> Print</Button>
                    </div>
                </div>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ITEM NAME</TableHead>
                            <TableHead>BATCH</TableHead>
                            <TableHead>QUANTITY</TableHead>
                            <TableHead>EXPIRY DATE</TableHead>
                            <TableHead>STOCK ADDITION DATE</TableHead>
                            <TableHead>TOTAL COST</TableHead>
                            <TableHead>TOTAL RETAIL VALUE</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={7} className="h-96 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <ClipboardList className="h-16 w-16 text-muted-foreground" />
                                    <p className="font-semibold">No records Found.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="stock-statistics" className="pt-6">
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <DatePicker date={new Date()} onDateChange={() => {}} />
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search by Item Name..." className="pl-8 w-full sm:w-64" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-medium">Cost Of Available Stock</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold text-fuchsia-500">0.00</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-medium">Net Cost Of Available Stock</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold text-fuchsia-500">0.00</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-medium">Retail Value Of Available Stock</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold text-green-500">0.00</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-medium">Avg. Margin %</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold text-green-500">0.00</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-medium">InStock SKU's</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">0</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-medium">Out Of Stock SKU's</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold text-orange-500">0</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle className="text-sm font-medium">Consumed Out Of Stock SKU's</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold text-orange-500">0</p></CardContent>
                        </Card>
                    </div>
                    <div className="flex justify-end">
                        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="pending-payments" className="pt-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <DatePickerWithRange />
                    <div className="flex items-center gap-2">
                        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                        <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                    </div>
                </div>
                <Card className="w-full max-w-xs">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Total Dues</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">0.0</p>
                    </CardContent>
                </Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>MR#</TableHead>
                            <TableHead>PATIENT NAME</TableHead>
                            <TableHead>INVOICE NUMBER</TableHead>
                            <TableHead>TOTAL</TableHead>
                            <TableHead>PAID</TableHead>
                            <TableHead>DUE</TableHead>
                            <TableHead>CREDITOR</TableHead>
                            <TableHead>CREATED AT</TableHead>
                            <TableHead>ACTION</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={9} className="h-48 text-center">
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
            <TabsContent value="manufacturerwise-sales" className="pt-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <DatePickerWithRange />
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Manufacturer" />
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Search by Item" />
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">0.0</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">0.0</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Excel
                  </Button>
                  <Button variant="outline">
                    <Printer className="mr-2 h-4 w-4" /> Print
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ITEM NAME</TableHead>
                      <TableHead>MANUFACTURER NAME</TableHead>
                      <TableHead>PURCHASE QTY</TableHead>
                      <TableHead>SOLD QTY</TableHead>
                      <TableHead>REVENUE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <ClipboardList className="h-16 w-16 text-muted-foreground" />
                          <p className="font-semibold">There is No data to Show.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="stock-expiry-report" className="pt-6">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="secondary">Expired Stock</Button>
                        <Button variant="outline">1 Month Expiry Stock</Button>
                        <Button variant="outline">3 Month Expiry Stock</Button>
                        <Button variant="outline">6 Month Expiry Stock</Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search by Item Name..." className="pl-8 w-full sm:w-64" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">0</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Cost Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">0.00</p>
                        </CardContent>
                    </Card>
                </div>
                 <div className="flex justify-end">
                    <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ITEM NAME</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          BATCH DATA <Info className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>TOTAL QUANTITY</TableHead>
                      <TableHead>TOTAL COST</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     <TableRow>
                        <TableCell colSpan={4} className="h-48 text-center">No expired items.</TableCell>
                     </TableRow>
                  </TableBody>
                </Table>
                <div className="text-right text-xs text-muted-foreground">
                    Displaying 0 of 0 items
                </div>
              </div>
            </TabsContent>
            <TabsContent value="closing-revenue" className="pt-6">
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <DatePickerWithRange />
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search by Invoice# or Order#" className="pl-8 w-full sm:w-56" />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Invoices With Profit Loss" /></SelectTrigger><SelectContent/></Select>
                            <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Select User" /></SelectTrigger><SelectContent/></Select>
                            <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Payment Mode" /></SelectTrigger><SelectContent/></Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <Card><CardHeader><CardTitle className="text-sm font-medium">Total Revenue</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">0.0</p></CardContent></Card>
                        <Card><CardHeader><CardTitle className="text-sm font-medium">Total Footfall</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">0.0</p></CardContent></Card>
                        <Card><CardHeader><CardTitle className="text-sm font-medium">Avg Ticket Size</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">0.0</p></CardContent></Card>
                        <Card><CardHeader><CardTitle className="text-sm font-medium">Total Cost</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">0.0</p></CardContent></Card>
                        <Card><CardHeader><CardTitle className="text-sm font-medium">Total Discounted Cost</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">0.0</p></CardContent></Card>
                        <Card><CardHeader><CardTitle className="text-sm font-medium">Gross Profit</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">0.0</p></CardContent></Card>
                        <Card><CardHeader><CardTitle className="text-sm font-medium">Profit Margin</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">0.0</p></CardContent></Card>
                        <Card><CardHeader><CardTitle className="text-sm font-medium">Total Refund</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">0.0</p></CardContent></Card>
                        <Card><CardHeader><CardTitle className="text-sm font-medium">Total Tax</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">0.0</p></CardContent></Card>
                        <Card><CardHeader><CardTitle className="text-sm font-medium">Total Dues</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">0.0</p></CardContent></Card>
                        <Card><CardHeader><CardTitle className="text-sm font-medium">Total Discount</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">0.0</p></CardContent></Card>
                    </div>
                     <div className="flex justify-end">
                        <Button variant="outline">
                          <Download className="mr-2 h-4 w-4" /> Excel
                        </Button>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>DATE</TableHead>
                                <TableHead>INVOICE #</TableHead>
                                <TableHead>INVOICE TYPE</TableHead>
                                <TableHead>PAYMENT MODE</TableHead>
                                <TableHead>MR#</TableHead>
                                <TableHead>ITEMS</TableHead>
                                <TableHead>TOTAL REVENUE(A)</TableHead>
                                <TableHead>TOTAL COST</TableHead>
                                <TableHead>TOTAL DISCOUNTED PRICE</TableHead>
                                <TableHead>TOTAL RETAIL PRICE</TableHead>
                                <TableHead>PROFIT LOSS (A-(B+C))</TableHead>
                                <TableHead>PROFIT AS %</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={12} className="h-48 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <ClipboardList className="h-16 w-16 text-muted-foreground" />
                                        <p className="font-semibold">There is No data to Show.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>
            <TabsContent value="shift" className="pt-6">
                <div className="space-y-6">
                    <p className="text-red-600 text-sm">* Please Enable Shifts from Admin Settings To Show the Shift Collections</p>
                    <DatePickerWithRange />
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>SHIFT</TableHead>
                                <TableHead>USER NAME</TableHead>
                                <TableHead>TOTAL INFLOW</TableHead>
                                <TableHead>TOTAL OUTFLOW</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center">
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
            <TabsContent value="itemwise-purchase-margin-report" className="pt-6">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                    <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Search by Item" /></SelectTrigger><SelectContent/></Select>
                    <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Category" /></SelectTrigger><SelectContent/></Select>
                    <DatePickerWithRange />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Purchase Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">0.0</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Net Retail Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">0.0</p>
                        </CardContent>
                    </Card>
                </div>
                <div className="h-64 border-b">
                    <p className="text-sm text-muted-foreground mt-4">Itemwise Purchase</p>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline">Excel</Button>
                    <Button variant="outline"><Printer className="mr-2 h-4 w-4"/> Print</Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="itemwise-sales-margin-report" className="pt-6">
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <DatePickerWithRange />
                        <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Search by Item" /></SelectTrigger><SelectContent/></Select>
                        <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Supplier" /></SelectTrigger><SelectContent/></Select>
                        <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Unit" /></SelectTrigger><SelectContent/></Select>
                    </div>
                    <Card className="w-full max-w-xs">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">0.0</p>
                        </CardContent>
                    </Card>
                    <div className="h-48 border-b">
                        <p className="text-sm text-muted-foreground mt-4 p-4">Itemwise Sales</p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                        <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                    </div>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ITEM NAME</TableHead>
                                <TableHead>CATEGORY</TableHead>
                                <TableHead>MANUFACTURER</TableHead>
                                <TableHead>SUPPLIERS</TableHead>
                                <TableHead>AVAILABLE QUANTITY</TableHead>
                                <TableHead>TOTAL SALES</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <ClipboardList className="h-16 w-16 text-muted-foreground" />
                                        <p className="font-semibold">There is No data to Show.</p>
                                    </div>
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
