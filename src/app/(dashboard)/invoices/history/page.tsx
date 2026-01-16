'use client';
import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  Loader2,
  Printer,
  Eye,
  Trash2,
  Edit,
} from 'lucide-react';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useDoc,
} from '@/firebase';
import type { Patient, Invoice } from '@/lib/types';
import { collection, doc, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { DatePicker } from '@/components/DatePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function InvoiceHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('id');
  const firestore = useFirestore();

  const patientDocRef = useMemoFirebase(
    () => (firestore && patientId ? doc(firestore, 'patients', patientId) : null),
    [firestore, patientId]
  );

  const invoicesQuery = useMemoFirebase(
    () => (firestore && patientId ? query(collection(firestore, 'invoices'), where('patientId', '==', patientId)) : null),
    [firestore, patientId]
  );

  const { data: patient, isLoading: patientLoading } = useDoc<Patient>(patientDocRef);
  const { data: invoices, isLoading: invoicesLoading } = useCollection<Invoice>(invoicesQuery);

  const isLoading = patientLoading || invoicesLoading;

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }

  if (!patient) {
    return <div className="text-center p-8">Patient not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ChevronLeft /></Button>
          <div>
            <h1 className="text-lg font-semibold">{patient.id.slice(0, 8)} - {patient.name}</h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'dd/MM/yyyy hh:mm:ss a')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/invoices/history?id=${patient.id}`)}>View Invoice History</Button>
          <Button onClick={() => router.push(`/invoices/create?id=${patient.id}`)}>Create Invoice</Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
            <DatePicker date={new Date()} onDateChange={() => {}} />
            <DatePicker date={new Date()} onDateChange={() => {}} />
            <Select>
                <SelectTrigger className="w-48"><SelectValue placeholder="Select Department"/></SelectTrigger>
                <SelectContent/>
            </Select>
            <Input placeholder="Search By Description..." className="w-64"/>
        </div>
      </div>

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SR #</TableHead>
              <TableHead>INVOICE#</TableHead>
              <TableHead>DESCRIPTION</TableHead>
              <TableHead>DEPARTMENT</TableHead>
              <TableHead>TOTAL</TableHead>
              <TableHead>DISCOUNT</TableHead>
              <TableHead>PAID</TableHead>
              <TableHead>DUES</TableHead>
              <TableHead>DEDUCTIONS AGAINST INSURANCE CLAIMS</TableHead>
              <TableHead>TAX DEDUCTIONS AGAINST INSURANCE CLAIMS</TableHead>
              <TableHead>INSURANCE CLAIMS</TableHead>
              <TableHead>ADVANCE</TableHead>
              <TableHead>PAYMENT DATE</TableHead>
              <TableHead>USER</TableHead>
              <TableHead>ACTION</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices && invoices.length > 0 ? (
              invoices.map((invoice, index) => (
                <TableRow key={invoice.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{invoice.id.slice(0, 8)}</TableCell>
                  <TableCell>{invoice.items.map(i => i.procedure).join(', ')}</TableCell>
                  <TableCell>OPD</TableCell>
                  <TableCell>{invoice.grandTotal.toFixed(2)}</TableCell>
                  <TableCell>{invoice.totalDiscount.toFixed(2)}</TableCell>
                  <TableCell>{invoice.amountPaid.toFixed(2)}</TableCell>
                  <TableCell>{invoice.amountDue.toFixed(2)}</TableCell>
                  <TableCell>0.00</TableCell>
                  <TableCell>0.00</TableCell>
                  <TableCell>0.00</TableCell>
                  <TableCell>0.00</TableCell>
                  <TableCell>{format(new Date(invoice.invoiceDate), 'PPpp')}</TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><Printer className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={15} className="h-48 text-center">
                  No invoices found for this patient.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
