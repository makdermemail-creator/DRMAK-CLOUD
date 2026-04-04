'use client';

import * as React from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, updateDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Printer, CheckCircle2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PrescriptionPreview } from '@/components/PrescriptionPreview';

export default function PrintPrescriptionPage() {
  const firestore = useFirestore();

  // Query all prescriptions that are Pending print
  const pendingQuery = React.useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'prescriptions'), where('printStatus', '==', 'Pending'));
  }, [firestore]);

  const { toast } = useToast();
  const { data: rawPendingJobs, isLoading: loading } = useCollection(pendingQuery);

  // Since we couldn't orderBy createdAt alongside where without a composite index,
  // we sort them client-side.
  const pendingJobs = React.useMemo(() => {
    if (!rawPendingJobs) return [];
    return [...rawPendingJobs].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // newest first
    });
  }, [rawPendingJobs]);

  const [printingJob, setPrintingJob] = React.useState<any | null>(null);

  const handlePrint = async (job: any) => {
    setPrintingJob(job);
    
    // Brief delay to allow the DOM to render the hidden print section
    setTimeout(async () => {
      window.print();
      
      // Mark as printed
      if (firestore && job.id) {
        try {
          await updateDoc(doc(firestore, 'prescriptions', job.id), {
            printStatus: 'Printed'
          });
          toast({ title: 'Marked as Printed', description: 'The prescription has been cleared from the queue.' });
        } catch (error) {
          console.error("Failed to update print status:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Printed, but failed to clear from queue.' });
        }
      }
      
      // Clear print job from state after printing dialog closes
      setTimeout(() => setPrintingJob(null), 1000);
    }, 300);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight dark:text-white">Print Queue</h1>
        <p className="text-slate-500 mt-1">Manage and print E-Prescriptions sent by doctors.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Pending Prescriptions</CardTitle>
          <CardDescription>Prescriptions that were sent to Core Operations for physical printing.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-500 animate-pulse">Loading queue...</TableCell>
                  </TableRow>
                ) : pendingJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <CheckCircle2 className="w-8 h-8 text-indigo-300" />
                        <p>No pending prescriptions in the queue.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        {job.createdAt ? format(new Date(job.createdAt), 'dd MMM yyyy, hh:mm a') : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{job.patientName}</div>
                        <div className="text-xs text-slate-500">{job.patientMobile}</div>
                      </TableCell>
                      <TableCell>{job.doctorName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          onClick={() => handlePrint(job)} 
                          size="sm" 
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          Print & Clear
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* HIDDEN PRINT LAYER */}
      {printingJob && (
        <div className="hidden print:block absolute top-0 left-0 w-full bg-white z-[9999]">
          <PrescriptionPreview
            doctorName={printingJob.doctorName || ''}
            doctorQualification={printingJob.doctorQualification || ''}
            doctorSpecialization={printingJob.doctorSpecialization || ''}
            patient={printingJob.patient || { name: printingJob.patientName, mobileNumber: printingJob.patientMobile, age: '', gender: '' }}
            vitals={printingJob.vitals || { bp: '', pulse: '', temp: '', weight: '', height: '' }}
            chiefComplaint={printingJob.chiefComplaint || ''}
            diagnosis={printingJob.diagnosis || ''}
            medicines={printingJob.medicines || []}
            investigations={printingJob.investigations || ''}
            advice={printingJob.advice || ''}
            followUpDates={printingJob.followUp || []}
            today={printingJob.createdAt ? format(new Date(printingJob.createdAt), 'dd MMMM yyyy') : format(new Date(), 'dd MMMM yyyy')}
          />
        </div>
      )}
    </div>
  );
}
