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
import { PlusCircle, Search, FileText, Pencil, Eye, Phone, Loader2 } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { PharmacyItem } from '@/lib/types';


export default function StockSuppliersPage() {
    const firestore = useFirestore();
    const pharmacyQuery = useMemoFirebase(() => firestore ? collection(firestore, 'pharmacyItems') : null, [firestore]);
    const { data: pharmacyItems, isLoading } = useCollection<PharmacyItem>(pharmacyQuery);

    const suppliersData = React.useMemo(() => {
        if (!pharmacyItems) return [];
        const supplierMap = new Map<string, any>();
        pharmacyItems.forEach(item => {
            if(item.supplier && !supplierMap.has(item.supplier)) {
                 supplierMap.set(item.supplier, {
                    supplier: item.supplier,
                    ntn: '',
                    stn: '',
                    phone: '',
                    address: '',
                    primaryContactPerson: '',
                    primaryContactPhone: '',
                    openingBalance: '0.0',
                    slaDate: '',
                    totalAmount: '0.00',
                    amountDue: '0.00',
                    createdAt: ''
                });
            }
        });
        return Array.from(supplierMap.values());
    }, [pharmacyItems]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Pharmacy Suppliers</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Supplier</Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-start gap-2 pt-4">
              <Input placeholder="Search By Name, Phone or Address..." className="w-full sm:w-64" />
              <Select>
                <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Select Supplier" />
                </SelectTrigger>
                <SelectContent>
                    {suppliersData.map((s,i) => <SelectItem key={i} value={s.supplier}>{s.supplier}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button><Search className="mr-2 h-4 w-4" /> Search</Button>
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
                        <TableHead>SUPPLIER</TableHead>
                        <TableHead>NTN</TableHead>
                        <TableHead>STN</TableHead>
                        <TableHead>PHONE</TableHead>
                        <TableHead>ADDRESS</TableHead>
                        <TableHead>PRIMARY CONTACT PERSON</TableHead>
                        <TableHead>PRIMARY CONTACT PHONE</TableHead>
                        <TableHead>OPENING BALANCE</TableHead>
                        <TableHead>SLA DATE</TableHead>
                        <TableHead>TOTAL AMOUNT</TableHead>
                        <TableHead>AMOUNT DUE</TableHead>
                        <TableHead>CREATED AT</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {suppliersData.map((supplier, index) => (
                         <TableRow key={index}>
                            <TableCell>{supplier.supplier}</TableCell>
                            <TableCell>{supplier.ntn}</TableCell>
                            <TableCell>{supplier.stn}</TableCell>
                            <TableCell>{supplier.phone}</TableCell>
                            <TableCell>{supplier.address}</TableCell>
                            <TableCell>{supplier.primaryContactPerson}</TableCell>
                            <TableCell>{supplier.primaryContactPhone}</TableCell>
                            <TableCell>{supplier.openingBalance}</TableCell>
                            <TableCell>{supplier.slaDate}</TableCell>
                            <TableCell>{supplier.totalAmount}</TableCell>
                            <TableCell>{supplier.amountDue}</TableCell>
                            <TableCell>{supplier.createdAt}</TableCell>
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
            <Button size="icon" className="rounded-full h-12 w-12"><Phone className="h-6 w-6" /></Button>
        </div>
    </div>
  );
}
