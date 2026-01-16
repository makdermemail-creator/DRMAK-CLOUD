'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, X, FilePen, Pencil, Eye } from 'lucide-react';
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import { Label } from '@/components/ui/label';

export default function IpdReportPage() {
  const [showAlert, setShowAlert] = React.useState(true);

  return (
    <div className="space-y-6">
      {showAlert && (
        <Alert variant="destructive" className="relative bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300">
          <AlertDescription>
            You have no right to access this page
          </AlertDescription>
          <button onClick={() => setShowAlert(false)} className="absolute top-2 right-2">
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">5</div>
              </CardContent>
          </Card>
      </div>

       <div className="flex items-center gap-4">
            <Label>Patient Visits</Label>
            <DatePickerWithRange />
       </div>


      {/* Empty content area to push FABs down */}
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
