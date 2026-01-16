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
import { PlusCircle, Search, Edit, Trash2, FileText, Pencil, Eye, Loader2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';


// Assuming a type for rack data
type Rack = {
    id: string;
    name: string;
    createdAt: { seconds: number, nanoseconds: number };
    items: string[];
}

export default function PharmacyRacksPage() {
  const firestore = useFirestore();
  // NOTE: Assuming collection name is 'pharmacyRacks'
  const racksQuery = useMemoFirebase(() => firestore ? collection(firestore, 'pharmacyRacks') : null, [firestore]);
  const { data: racks, isLoading } = useCollection<Rack>(racksQuery);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Pharmacy Racks</CardTitle>
            </div>
             <div className="flex items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by Pharmacy Rack Name" className="pl-8 w-full sm:w-64" />
                </div>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Rack</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : racks && racks.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {racks.map(rack => (
                        <AccordionItem value={rack.id} key={rack.id}>
                            <div className="flex items-center bg-muted/50 px-4 rounded-t-lg">
                                <AccordionTrigger>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold">{rack.name}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(rack.createdAt.seconds * 1000).toLocaleDateString()}
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <div className="flex items-center gap-2 mr-4">
                                    <Button size="icon" variant="ghost" className="h-6 w-6"><Edit className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                            <AccordionContent className="border border-t-0 rounded-b-lg">
                                 <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ITEMS</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rack.items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{item}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <div className="text-center p-12">
                    <p className="text-muted-foreground">No racks found.</p>
                </div>
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
