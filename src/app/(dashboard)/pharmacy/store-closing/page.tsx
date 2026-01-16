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
import { PlusCircle, FileText, Printer, File, Eye, Pencil } from 'lucide-react';
import { DatePickerWithRange } from '@/components/DatePickerWithRange';

export default function StoreClosingPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Store Closings</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline"><FileText className="mr-2 h-4 w-4" /> Excel</Button>
                <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Store Closing</Button>
            </div>
          </div>
          <div className="pt-4">
              <DatePickerWithRange />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>OPENING CASH</TableHead>
                <TableHead>TOTAL INFLOW</TableHead>
                <TableHead>CASH PAYMENT</TableHead>
                <TableHead>ONLINE PAYMENT</TableHead>
                <TableHead>TOTAL OUTFLOW</TableHead>
                <TableHead>SYSTEM CASH</TableHead>
                <TableHead>PHYSICAL CASH</TableHead>
                <TableHead>CASH DIFFERENCE</TableHead>
                <TableHead>SUBMITTED TO BANK</TableHead>
                <TableHead>SUBMITTED TO HO</TableHead>
                <TableHead>TOTAL CASH SUBMITTED</TableHead>
                <TableHead>CLOSING CASH</TableHead>
                <TableHead>STORE CLOSING DATE</TableHead>
                <TableHead>USER</TableHead>
                <TableHead>ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={15} className="h-48 text-center">
                  <File className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">There are no record to show.</p>
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
