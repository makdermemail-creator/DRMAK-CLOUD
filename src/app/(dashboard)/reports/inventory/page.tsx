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
import { File, Search, Download, Printer, User, PieChart, BarChart, FileText, Pencil, Eye, Boxes } from 'lucide-react';
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function InventoryReportPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Inventory Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="consumptions">
            <TabsList>
              <TabsTrigger value="consumptions">Itemwise Consumptions</TabsTrigger>
              <TabsTrigger value="low-stocks">Low Stocks</TabsTrigger>
              <TabsTrigger value="purchase-reports">Purchase Reports</TabsTrigger>
              <TabsTrigger value="expiry">Expiry</TabsTrigger>
              <TabsTrigger value="stock-statistics">Stock Statistics</TabsTrigger>
            </TabsList>
            <TabsContent value="consumptions" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Select><SelectTrigger><SelectValue placeholder="Select Item" /></SelectTrigger><SelectContent/></Select>
                <Select><SelectTrigger><SelectValue placeholder="Select Consumption Type" /></SelectTrigger><SelectContent/></Select>
                <DatePickerWithRange />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Consumptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0.0</div>
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
                        <TableHead>ITEM NAME</TableHead>
                        <TableHead>TOTAL CONSUMPTION</TableHead>
                        <TableHead>TOTAL COST</TableHead>
                        <TableHead>TOTAL RETAIL PRICE</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell colSpan={4} className="h-48 text-center">
                            <File className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">No data to display.</p>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            </TabsContent>
            <TabsContent value="low-stocks">
                <div className="h-96 flex flex-col items-center justify-center text-center">
                    <File className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">Low Stocks data will be shown here.</p>
                </div>
            </TabsContent>
             <TabsContent value="purchase-reports">
                <div className="h-96 flex flex-col items-center justify-center text-center">
                    <File className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">Purchase Reports data will be shown here.</p>
                </div>
            </TabsContent>
             <TabsContent value="expiry">
                <div className="h-96 flex flex-col items-center justify-center text-center">
                    <File className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">Expiry data will be shown here.</p>
                </div>
            </TabsContent>
            <TabsContent value="stock-statistics">
                <div className="h-96 flex flex-col items-center justify-center text-center">
                    <File className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">Stock Statistics data will be shown here.</p>
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
