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
import { Search, PlusCircle, Download, Printer, Eye, Edit, Trash2, ClipboardList } from 'lucide-react';
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['hsl(var(--primary))'];


export default function AccountsPage() {

    const expenseData: any[] = [];
    const pieData = [{ name: 'Office Supplies', value: 0 }];
    const doctorSharePieData = [{ name: 'Dr. Mahvish Aftab Khan', value: 0 }];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="expenses">
            <TabsList>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="expenses-summary">Expenses Summary</TabsTrigger>
              <TabsTrigger value="bill-payments">Bill Payments</TabsTrigger>
              <TabsTrigger value="doctor-shares">Doctor Shares</TabsTrigger>
            </TabsList>
            <TabsContent value="expenses" className="pt-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search Voucher No." className="pl-8" />
                        </div>
                        <Select><SelectTrigger><SelectValue placeholder="Select Expense Category" /></SelectTrigger><SelectContent/></Select>
                        <DatePickerWithRange />
                        <Select><SelectTrigger><SelectValue placeholder="Select Payment Mode" /></SelectTrigger><SelectContent/></Select>
                        <Select><SelectTrigger><SelectValue placeholder="Select Doctor" /></SelectTrigger><SelectContent/></Select>
                    </div>
                     <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Expense</Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">0.0</p>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-2">
                         <CardHeader>
                            <CardTitle className="text-sm font-medium text-center">Expenses</CardTitle>
                        </CardHeader>
                        <CardContent className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="hsl(var(--primary))" label={({percent}) => `${(percent * 100).toFixed(0)}%`}>
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
                
                 <div className="flex justify-end gap-2 mb-4">
                    <Button variant="outline"><Download className="mr-2 h-4 w-4"/> Excel</Button>
                    <Button variant="outline"><Printer className="mr-2 h-4 w-4"/> Print</Button>
                    <Button variant="outline">Customize</Button>
                </div>

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
                        {expenseData.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={9} className="h-48 text-center">No expenses found.</TableCell>
                            </TableRow>
                        ) : expenseData.map((exp, i) => (
                            <TableRow key={i}>
                                <TableCell>{exp.voucher}</TableCell>
                                <TableCell>{exp.employee}</TableCell>
                                <TableCell>{exp.description}</TableCell>
                                <TableCell>{exp.date}</TableCell>
                                <TableCell>{exp.category}</TableCell>
                                <TableCell>{exp.amount.toFixed(1)}</TableCell>
                                <TableCell>{exp.paymentMode}</TableCell>
                                <TableCell>{exp.createdAt}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-6 w-6"><Eye className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6"><Edit className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 <div className="text-right text-xs text-muted-foreground mt-2">
                    Displaying all {expenseData.length} expenses
                </div>
            </TabsContent>
            <TabsContent value="expenses-summary" className="pt-6">
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <DatePickerWithRange />
                         <div className="flex items-center gap-2">
                            <Button variant="outline"><Download className="mr-2 h-4 w-4"/> Excel</Button>
                            <Button variant="outline"><Printer className="mr-2 h-4 w-4"/> Print</Button>
                        </div>
                    </div>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>EXPENSE CATEGORY</TableHead>
                                <TableHead className="text-right">EXPENSE</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>Office Supplies</TableCell>
                                <TableCell className="text-right">0.0</TableCell>
                            </TableRow>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell>Total</TableCell>
                                <TableCell className="text-right">0.0</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>
            <TabsContent value="bill-payments" className="pt-6">
                 <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <Select><SelectTrigger className="w-[280px]"><SelectValue placeholder="Select Supplier" /></SelectTrigger><SelectContent/></Select>
                        <DatePickerWithRange />
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>DOCUMENT NO.</TableHead>
                                <TableHead>SUPPLIER</TableHead>
                                <TableHead>STOCK DATE</TableHead>
                                <TableHead>SUPPLIER INVOICE#</TableHead>
                                <TableHead>SUPPLIER INVOICE DATE</TableHead>
                                <TableHead>GRAND TOTAL</TableHead>
                                <TableHead>AMOUNT DUE</TableHead>
                                <TableHead>TOTAL PAID</TableHead>
                                <TableHead>ACTION</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             <TableRow>
                                <TableCell colSpan={9} className="h-48 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <ClipboardList className="h-16 w-16 text-muted-foreground" />
                                        <p className="font-semibold">There is no stock payment to collect.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Opening Balance Payments</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SUPPLIER</TableHead>
                                    <TableHead>DUE AMOUNT</TableHead>
                                    <TableHead>ACTION</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell>Rs.</TableCell>
                                    <TableCell>0.0</TableCell>
                                    <TableCell><Button>Supplier Payment</Button></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                 </div>
            </TabsContent>
            <TabsContent value="doctor-shares" className="pt-6">
                 <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <Select><SelectTrigger className="w-[280px]"><SelectValue placeholder="Select Doctor" /></SelectTrigger><SelectContent/></Select>
                            <p className="text-xs text-destructive mt-1">Kindly select the Doctor to view share</p>
                        </div>
                        <DatePickerWithRange />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Amount To Be Paid</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">0.0</p>
                            </CardContent>
                        </Card>
                        <Card className="md:col-span-2">
                            <CardContent className="h-48 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={doctorSharePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="hsl(var(--primary))">
                                            {doctorSharePieData.map((entry, index) => (
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
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>INVOICE#</TableHead>
                                <TableHead>MR#</TableHead>
                                <TableHead>PATIENT NAME</TableHead>
                                <TableHead>TOTAL</TableHead>
                                <TableHead>PAID</TableHead>
                                <TableHead>DOCTOR'S NAME</TableHead>
                                <TableHead>DOCTOR'S SHARE</TableHead>
                                <TableHead>PROCESS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             <TableRow>
                                <TableCell colSpan={8} className="h-48 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <ClipboardList className="h-16 w-16 text-muted-foreground" />
                                        <p className="font-semibold">There are no doctor shares to be processed.</p>
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
        <Button size="icon" className="rounded-full h-12 w-12"><Eye className="h-6 w-6" /></Button>
        <Button size="icon" className="rounded-full h-12 w-12"><Edit className="h-6 w-6" /></Button>
        <Button size="icon" className="rounded-full h-12 w-12"><Trash2 className="h-6 w-6" /></Button>
      </div>
    </div>
  );
}
