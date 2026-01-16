'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { PlusCircle, Search, Trash2, Info, MessageSquare, Pencil, Phone } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

type ReturnItem = {
  id: string;
  itemName: string;
  invoiceNumber: string;
  unit: string;
  batch: string;
  rate: number;
  returnQuantity: number;
  refundAmount: number;
  deduction: number;
  deductionType: string;
};

export default function OpenSaleReturnPage() {
  const [returnItems, setReturnItems] = React.useState<ReturnItem[]>([
    {
      id: uuidv4(),
      itemName: '',
      invoiceNumber: 'No Invoice',
      unit: 'Pack',
      batch: '',
      rate: 0,
      returnQuantity: 1,
      refundAmount: 0.0,
      deduction: 0,
      deductionType: 'value'
    }
  ]);

  const handleAddItem = () => {
    setReturnItems(prev => [...prev, {
      id: uuidv4(),
      itemName: '',
      invoiceNumber: 'No Invoice',
      unit: 'Pack',
      batch: '',
      rate: 0,
      returnQuantity: 1,
      refundAmount: 0.0,
      deduction: 0,
      deductionType: 'value'
    }]);
  };
  
  const handleRemoveItem = (id: string) => {
    setReturnItems(prev => prev.filter(item => item.id !== id));
  };
  
  const handleItemChange = (id: string, field: keyof ReturnItem, value: any) => {
    setReturnItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  
  const summary = React.useMemo(() => {
    const subTotal = returnItems.reduce((acc, item) => acc + item.refundAmount, 0);
    const totalDeduction = returnItems.reduce((acc, item) => acc + item.deduction, 0);
    const refundTotal = subTotal - totalDeduction;
    return { subTotal, totalDeduction, refundTotal };
  }, [returnItems]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-6">Open Sale Return</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Patient</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search By Name, MR# or Phone" className="pl-8" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Invoice #</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Enter Complete Invoice#" className="pl-8" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {returnItems.map(item => (
              <div key={item.id} className="grid grid-cols-1 lg:grid-cols-10 gap-2 items-end p-3 border rounded-lg">
                <div className="space-y-1 lg:col-span-2">
                  <Label>Item</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Search for items" /></SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                </div>
                 <div className="space-y-1">
                  <Label>Invoice Numbers</Label>
                  <Select defaultValue="No Invoice">
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent><SelectItem value="No Invoice">No Invoice</SelectItem></SelectContent>
                  </Select>
                </div>
                 <div className="space-y-1">
                  <Label>Unit</Label>
                  <Select defaultValue="Pack">
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent><SelectItem value="Pack">Pack</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Select Batch</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select Batch"/></SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Rate</Label>
                  <Input type="number" value={item.rate} readOnly className="bg-muted"/>
                </div>
                 <div className="space-y-1">
                  <Label>Return Quantity</Label>
                  <Input type="number" value={item.returnQuantity} onChange={e => handleItemChange(item.id, 'returnQuantity', +e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Refund Amount</Label>
                  <Input type="number" value={item.refundAmount} onChange={e => handleItemChange(item.id, 'refundAmount', +e.target.value)} />
                </div>
                 <div className="space-y-1">
                  <Label>Deduction</Label>
                  <Input type="number" value={item.deduction} onChange={e => handleItemChange(item.id, 'deduction', +e.target.value)} />
                </div>
                 <div className="flex items-end gap-2">
                    <div className="space-y-1 flex-grow">
                      <Label>Deduction Type</Label>
                      <Select defaultValue="value">
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent><SelectItem value="value">Value</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4"/>
                    </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Button variant="outline" onClick={handleAddItem}><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
          </div>

          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-sm space-y-4">
               <div className="flex justify-between items-center">
                  <Label>Total Deduction: Rs.</Label>
                  <div className="flex gap-2 w-2/3">
                    <Input readOnly value={summary.totalDeduction.toFixed(2)} className="bg-muted"/>
                    <Select defaultValue="value">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="value">Value</SelectItem></SelectContent>
                    </Select>
                  </div>
              </div>
              <div className="text-right space-y-1 text-sm font-medium">
                <p>Sub - Total: Rs. {summary.subTotal.toFixed(2)}</p>
                <p className="text-lg">Refund Total: Rs. {summary.refundTotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-end pt-4">
                 <Button>Save</Button>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
      
      <div className="fixed bottom-8 right-8 flex flex-col gap-2">
            <Button size="icon" className="rounded-full h-12 w-12"><Info className="h-6 w-6" /></Button>
            <Button size="icon" className="rounded-full h-12 w-12"><Pencil className="h-6 w-6" /></Button>
            <Button size="icon" className="rounded-full h-12 w-12"><MessageSquare className="h-6 w-6" /></Button>
        </div>
    </div>
  );
}
