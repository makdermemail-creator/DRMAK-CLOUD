'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilePen, Pencil, Eye } from 'lucide-react';

export default function AppointmentsReportPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Appointments Report</h1>
          <Badge variant="outline" className="mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="m10 10.5 4 4"></path><path d="m14 10.5-4 4"></path></svg>
            Quality Control
          </Badge>
        </div>
      </div>
      
      {/* Empty content area */}
      <div className="h-96"></div>

      <div className="fixed bottom-8 right-8 flex flex-col gap-2">
        <Button size="icon" className="rounded-full h-12 w-12 bg-blue-600 hover:bg-blue-700 text-white">
          <FilePen className="h-6 w-6" />
        </Button>
        <Button size="icon" className="rounded-full h-12 w-12 bg-blue-600 hover:bg-blue-700 text-white">
          <Pencil className="h-6 w-6" />
        </Button>
        <Button size="icon" className="rounded-full h-12 w-12 bg-blue-600 hover:bg-blue-700 text-white">
          <Eye className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
