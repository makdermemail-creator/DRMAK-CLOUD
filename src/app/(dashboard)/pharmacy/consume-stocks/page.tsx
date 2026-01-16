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
import { PlusCircle, Search, FileText, Printer, File, Edit, Eye, Pencil } from 'lucide-react';
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Boxes } from 'lucide-react';

export default function ConsumeStocksPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Pharmacy Consumptions</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Consume Stock</Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
              <div className="flex flex-wrap gap-2">
                  <DatePickerWithRange />
                  <Select><SelectTrigger className="w-48"><SelectValue placeholder="Search By Item Name" /></SelectTrigger><SelectContent></SelectContent></Select>
                  <Select><SelectTrigger className="w-48"><SelectValue placeholder="Search By Batch Name" /></SelectTrigger><SelectContent></SelectContent></Select>
                  <Select><SelectTrigger className="w-48"><SelectValue placeholder="Select Consumption Type" /></SelectTrigger><SelectContent></SelectContent></Select>
              </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Consumed Quantity</CardTitle>
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0.0</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Consumption Cost</CardTitle>
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0.0</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Consumption Retail</CardTitle>
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0.0</div>
                    </CardContent>
                </Card>
            </div>
            <div className="flex justify-end gap-2 mb-4">
                <Button variant="outline"><FileText className="mr-2 h-4 w-4" /> Excel</Button>
                <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>INVOICE REF</TableHead>
                        <TableHead>ITEMS</TableHead>
                        <TableHead>CONSUMED QTY.</TableHead>
                        <TableHead>UNIT</TableHead>
                        <TableHead>BATCH</TableHead>
                        <TableHead>CONSUMPTION TYPE</TableHead>
                        <TableHead>TEMPLATE NAME</TableHead>
                        <TableHead>ADDED BY</TableHead>
                        <TableHead>COMMENT</TableHead>
                        <TableHead>TOTAL COST</TableHead>
                        <TableHead>TOTAL RETAIL PRICE</TableHead>
                        <TableHead>CREATED AT</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell colSpan={12} className="h-48 text-center">
                            <File className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">There are no consumptions to show.</p>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
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
