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
import { ClipboardList, Search, Printer, FileText, Pencil, Eye } from 'lucide-react';
import { DatePickerWithRange } from '@/components/DatePickerWithRange';

export default function InvoiceReturnPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-xl font-semibold text-gray-500 bg-gray-100 py-2 px-4 w-fit rounded-md">Invoice Return</h1>
            <Button variant="outline"><Printer className="mr-2 h-4 w-4"/> Print</Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
              <div className="flex flex-wrap gap-2">
                  <DatePickerWithRange />
                  <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search Item by Name..." className="pl-8 w-full sm:w-48" />
                  </div>
                  <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search by Invoice #" className="pl-8 w-full sm:w-48" />
                  </div>
                   <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search by MRN, Patient Name" className="pl-8 w-full sm:w-48" />
                  </div>
              </div>
          </div>
        </CardHeader>
        <CardContent>
           <div className="h-96 flex flex-col items-center justify-center text-center">
                <ClipboardList className="mx-auto h-16 w-16 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium text-muted-foreground">There is no Invoice Return to show.</p>
            </div>
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
