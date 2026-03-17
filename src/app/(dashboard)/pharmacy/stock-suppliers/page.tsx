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
import type { PharmacyItem, Supplier } from '@/lib/types';
import { cn } from '@/lib/utils';


export default function StockSuppliersPage() {
    const firestore = useFirestore();
    const pharmacyQuery = useMemoFirebase(() => firestore ? collection(firestore, 'pharmacyItems') : null, [firestore]);
    const { data: pharmacyItems, isLoading } = useCollection<PharmacyItem>(pharmacyQuery);

    const suppliersRef = useMemoFirebase(() => firestore ? collection(firestore, 'suppliers') : null, [firestore]);
    const { data: allSuppliers, isLoading: isSuppliersLoading } = useCollection<Supplier>(suppliersRef);

    const distributors = React.useMemo(() => {
        if (!allSuppliers) return [];
        return allSuppliers.filter(s => s.type === 'Distributor');
    }, [allSuppliers]);

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
                    <SelectValue placeholder="Select Distributor" />
                </SelectTrigger>
                <SelectContent>
                    {distributors.map((s,i) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button><Search className="mr-2 h-4 w-4" /> Search</Button>
          </div>
        </CardHeader>
        <CardContent>
            {isSuppliersLoading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>SUPPLIER</TableHead>
                        <TableHead>CATEGORY</TableHead>
                        <TableHead>STN/NTN</TableHead>
                        <TableHead>PHONE</TableHead>
                        <TableHead>ADDRESS</TableHead>
                        <TableHead>CONTACT PERSON</TableHead>
                        <TableHead>CONTACT PHONE</TableHead>
                        <TableHead>OPENING BALANCE</TableHead>
                        <TableHead>SLA DATE</TableHead>
                        <TableHead>CURRENT LIABILITY</TableHead>
                        <TableHead>CREDIT LIMIT</TableHead>
                        <TableHead>ONBOARDED</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {distributors.map((supplier, index) => (
                         <TableRow key={supplier.id}>
                            <TableCell className="font-bold">{supplier.name}</TableCell>
                            <TableCell>{supplier.category}</TableCell>
                            <TableCell>—</TableCell>
                            <TableCell>{supplier.phone}</TableCell>
                            <TableCell>{supplier.address}</TableCell>
                            <TableCell>{supplier.contactPerson}</TableCell>
                            <TableCell>{supplier.phone}</TableCell>
                            <TableCell className="font-bold">Rs {supplier.openingBalance?.toLocaleString()}</TableCell>
                            <TableCell>—</TableCell>
                            <TableCell className="text-red-600 font-bold">Rs {supplier.currentBalance?.toLocaleString()}</TableCell>
                            <TableCell className="font-bold text-emerald-600">Rs {supplier.creditLimit?.toLocaleString()}</TableCell>
                            <TableCell>{new Date(supplier.createdAt || '').toLocaleDateString()}</TableCell>
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
