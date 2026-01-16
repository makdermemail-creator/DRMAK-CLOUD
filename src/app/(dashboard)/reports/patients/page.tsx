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
import { File, Search, Download, Printer, User, PieChart, BarChart } from 'lucide-react';
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Patient } from '@/lib/types';


export default function PatientReportsPage() {
  const firestore = useFirestore();
  const patientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'patients') : null, [firestore]);
  const { data: patients, isLoading } = useCollection<Patient>(patientsQuery);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Patient Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="biography">
            <TabsList>
              <TabsTrigger value="biography"><User className="mr-2 h-4 w-4" /> Biography</TabsTrigger>
              <TabsTrigger value="visits">Visits</TabsTrigger>
              <TabsTrigger value="deceased">Deceased</TabsTrigger>
            </TabsList>
            <TabsContent value="biography" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="space-y-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search By Tag..." className="pl-8" />
                    </div>
                    <DatePickerWithRange />
                </div>
                <div className="space-y-2">
                    <Input placeholder="Search By Age..." />
                    <Select><SelectTrigger><SelectValue placeholder="Select Patient Type" /></SelectTrigger><SelectContent/></Select>
                </div>
                <div className="space-y-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search by MR#" className="pl-8" />
                    </div>
                    <Select><SelectTrigger><SelectValue placeholder="Select Admitted To" /></SelectTrigger><SelectContent/></Select>
                </div>
                <div className="space-y-2">
                     <Select><SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger><SelectContent/></Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8 h-48">
                 <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                    <PieChart className="h-12 w-12" />
                    <p className="mt-2 text-sm font-medium">Gender</p>
                    <p className="text-xs">No data</p>
                 </div>
                 <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                    <BarChart className="h-12 w-12" />
                    <p className="mt-2 text-sm font-medium">Age Range</p>
                    <p className="text-xs">No data</p>
                 </div>
              </div>

              <div className="flex justify-end gap-2 mb-4">
                  <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                  <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
              </div>

               <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>MR#</TableHead>
                        <TableHead>NAME</TableHead>
                        <TableHead>PHONE</TableHead>
                        <TableHead>GENDER</TableHead>
                        <TableHead>PATIENT TYPE</TableHead>
                        <TableHead>CREATED AT</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow><TableCell colSpan={6} className="h-48 text-center">Loading...</TableCell></TableRow>
                    ) : patients?.map((patient) => (
                        <TableRow key={patient.id}>
                            <TableCell>{patient.id.slice(0, 8)}</TableCell>
                            <TableCell className="font-medium">{patient.name}</TableCell>
                            <TableCell>{patient.mobileNumber}</TableCell>
                            <TableCell>{patient.gender}</TableCell>
                            <TableCell>General</TableCell>
                            <TableCell>{/* Placeholder for created at */}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="text-xs text-muted-foreground text-right mt-2">
                Displaying {patients?.length || 0} of {patients?.length || 0} patients
            </div>

            </TabsContent>
            <TabsContent value="visits">
                <div className="h-96 flex flex-col items-center justify-center text-center">
                    <File className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">Visits data will be shown here.</p>
                </div>
            </TabsContent>
             <TabsContent value="deceased">
                <div className="h-96 flex flex-col items-center justify-center text-center">
                    <File className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">Deceased patient data will be shown here.</p>
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
