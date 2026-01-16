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
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, PlusCircle, Download, Printer, Edit, Eye, Trash2 } from 'lucide-react';

export default function DonationsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Donations</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="donations">
            <TabsList>
              <TabsTrigger value="donations">Donations & Zakat</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>
            <TabsContent value="donations" className="pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <DatePickerWithRange />
                <div className="flex items-center gap-2">
                  <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Donation Donor</Button>
                  <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Donation</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Remaining Donation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">0.0</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Remaining Zakat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">0.0</p>
                  </CardContent>
                </Card>
                 <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Remaining Welfare</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">0.0</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Remaining</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">0.0</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-2 mb-4">
                <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DONOR NAME</TableHead>
                    <TableHead>DESCRIPTION</TableHead>
                    <TableHead>DATE</TableHead>
                    <TableHead>CATEGORY</TableHead>
                    <TableHead>AMOUNT</TableHead>
                    <TableHead>PAYMENT MODE</TableHead>
                    <TableHead>CREATED BY</TableHead>
                    <TableHead>ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ClipboardList className="h-16 w-16 text-muted-foreground" />
                        <p className="font-semibold">There are no donations to show.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="transactions" className="pt-6">
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <DatePickerWithRange />
                        <div className="flex items-center gap-2">
                            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                            <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Total Donation Consumed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">0.0</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Total Zakat Consumed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">0.0</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Total Welfare Consumed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">0.0</p>
                            </CardContent>
                        </Card>
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
                                <TableHead>METHOD TYPE</TableHead>
                                <TableHead>DOCTOR REVENUE</TableHead>
                                <TableHead>PAYMENT DATE</TableHead>
                                <TableHead>ACTION</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={10} className="h-48 text-center">
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
