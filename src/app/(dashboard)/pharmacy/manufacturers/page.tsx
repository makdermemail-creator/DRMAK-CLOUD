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
import { PlusCircle, FileText, Pencil, Eye, Loader2 } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { PharmacyItem } from '@/lib/types';


export default function ManufacturersPage() {
  const firestore = useFirestore();
  const pharmacyQuery = useMemoFirebase(() => firestore ? collection(firestore, 'pharmacyItems') : null, [firestore]);
  const { data: pharmacyItems, isLoading } = useCollection<PharmacyItem>(pharmacyQuery);

  const manufacturersData = React.useMemo(() => {
    if (!pharmacyItems) return [];
    const manufacturerMap = new Map<string, { name: string, tax: string, discount: string }>();
    pharmacyItems.forEach(item => {
        if(item.manufacturer && !manufacturerMap.has(item.manufacturer)) {
            manufacturerMap.set(item.manufacturer, { name: item.manufacturer, tax: '1.00%', discount: '' });
        }
    });
    return Array.from(manufacturerMap.values());
  }, [pharmacyItems]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
             <h1 className="text-xl font-semibold text-gray-500 bg-gray-100 py-2 px-4 w-fit rounded-md">Manufacturers</h1>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Manufacturer</Button>
          </div>
           <div className="pt-4">
                <Select>
                    <SelectTrigger className="w-full sm:w-64">
                        <SelectValue placeholder="Select Manufacturer" />
                    </SelectTrigger>
                    <SelectContent>
                        {manufacturersData.map((m, i) => <SelectItem key={i} value={m.name}>{m.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NAME</TableHead>
                <TableHead>WITHHOLDING TAX INCLUDED IN TP</TableHead>
                <TableHead>DISCOUNT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {manufacturersData.map((manufacturer, index) => (
                <TableRow key={index}>
                  <TableCell>{manufacturer.name}</TableCell>
                  <TableCell>{manufacturer.tax}</TableCell>
                  <TableCell>{manufacturer.discount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
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
