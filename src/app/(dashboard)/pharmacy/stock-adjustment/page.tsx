'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, Printer, File, Eye, Pencil, ClipboardList, Boxes } from 'lucide-react';
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function StockAdjustmentPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Pharmacy Stock Adjustments</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline"><FileText className="mr-2 h-4 w-4" /> Excel</Button>
                <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Adjustment</Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-start gap-4 pt-4">
              <div className="flex flex-wrap gap-2">
                  <DatePickerWithRange />
                  <Select><SelectTrigger className="w-48"><SelectValue placeholder="Search By Item" /></SelectTrigger><SelectContent></SelectContent></Select>
              </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Adjustment Value</CardTitle>
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0.0</div>
                    </CardContent>
                </Card>
            </div>

            <div className="h-96 flex flex-col items-center justify-center text-center">
                <ClipboardList className="mx-auto h-16 w-16 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium text-muted-foreground">There are no adjustments to show.</p>
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
