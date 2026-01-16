'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
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
import { MoreHorizontal, PlusCircle, Search, Loader2, Upload, FileUp, FileText, Printer, Edit, Pencil, Eye } from 'lucide-react';
import { DatePicker } from '@/components/DatePicker';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function ManageStockPage() {

  const stockData: any[] = [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Pharmacy Stocks</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline"><FileUp className="mr-2 h-4 w-4" /> PO To GRN Report</Button>
                <Button variant="outline"><FileText className="mr-2 h-4 w-4" /> Excel</Button>
                <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Stock</Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
              <div className="flex flex-wrap gap-2">
                  <DatePicker date={new Date()} onDateChange={() => {}} />
                  <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search by Item Name" className="pl-8 w-48" />
                  </div>
                   <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search by Document No..." className="pl-8 w-48" />
                  </div>
                  <Select><SelectTrigger className="w-48"><SelectValue placeholder="Select Manufacturer" /></SelectTrigger><SelectContent></SelectContent></Select>
                  <Select><SelectTrigger className="w-48"><SelectValue placeholder="Select Supplier" /></SelectTrigger><SelectContent></SelectContent></Select>
              </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Total Inbounded Price</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rs0.00</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Net Purchase</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rs0.00</div>
                    </CardContent>
                </Card>
            </div>

            {stockData.length === 0 ? (
                <div className="text-center p-12 border-dashed border-2 rounded-md">
                    <p className="text-muted-foreground">No stock entries found.</p>
                </div>
            ) : stockData.map((stock, index) => (
                <Card key={index} className="mb-4">
                    <CardHeader className="bg-muted/50 p-3">
                        <div className="flex flex-wrap justify-between items-center text-xs font-medium text-muted-foreground">
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                <span>Supplier: <span className="font-semibold text-foreground">{stock.supplier}</span></span>
                                <span>Document #: <span className="font-semibold text-foreground">{stock.document}</span></span>
                                <span>SKUs: <span className="font-semibold text-foreground">{stock.sku}</span></span>
                                <span>Created At: <span className="font-semibold text-foreground">{stock.createdAt}</span></span>
                                <span>Supplier Invoice Date: <span className="font-semibold text-foreground">{stock.supplierInvoiceDate}</span></span>
                                <span>Supplier Invoice#: <span className="font-semibold text-foreground">{stock.supplierInvoice}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="icon" variant="ghost" className="h-6 w-6"><Printer className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6"><Edit className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SR #</TableHead>
                                    <TableHead>Item Name</TableHead>
                                    <TableHead>Manufacturer</TableHead>
                                    <TableHead>B2B Category</TableHead>
                                    <TableHead>Conversion Unit</TableHead>
                                    <TableHead>Total Qty</TableHead>
                                    <TableHead>Qty in Units</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead className="text-right">Unit Cost</TableHead>
                                    <TableHead className="text-right">Unit Cost with Tax</TableHead>
                                    <TableHead className="text-right">Discounted Price</TableHead>
                                    <TableHead className="text-right">Net Unit Cost</TableHead>
                                    <TableHead className="text-right">Total Cost</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stock.items.map((item: any) => (
                                    <TableRow key={item.sr}>
                                        <TableCell>{item.sr}</TableCell>
                                        <TableCell className="font-medium">{item.itemName}</TableCell>
                                        <TableCell>{item.manufacturer}</TableCell>
                                        <TableCell>{item.category}</TableCell>
                                        <TableCell>{item.conversionUnit}</TableCell>
                                        <TableCell>{item.totalQty}</TableCell>
                                        <TableCell>{item.qtyInUnits}</TableCell>
                                        <TableCell>{item.unit}</TableCell>
                                        <TableCell className="text-right">Rs{item.unitCost.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">Rs{item.unitCostWithTax.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">Rs{item.discountedPrice.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">Rs{item.netUnitCost.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">Rs{item.totalCost.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ))}
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
