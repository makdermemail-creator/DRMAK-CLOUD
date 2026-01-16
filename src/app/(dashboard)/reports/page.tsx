import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FileText,
  Stethoscope,
  Boxes,
  CircleDollarSign,
  CalendarDays,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/DatePickerWithRange';

const reportCards = [
  {
    title: 'Patient Visit Reports',
    description: 'Analyze patient demographics and visit frequency.',
    icon: FileText,
  },
  {
    title: 'Doctor Performance',
    description: 'Track appointments and revenue per doctor.',
    icon: Stethoscope,
  },
  {
    title: 'Inventory Consumption',
    description: 'Monitor product usage and stock levels.',
    icon: Boxes,
  },
  {
    title: 'Revenue Reports',
    description: 'Detailed financial summaries and trends.',
    icon: CircleDollarSign,
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle>Reports</CardTitle>
                    <CardDescription>
                    Generate and view detailed reports for your clinic.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <DatePickerWithRange />
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export All
                    </Button>
                </div>
            </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {reportCards.map((report) => (
          <Card key={report.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </div>
              <report.icon className="h-8 w-8 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
                <div className="text-center text-muted-foreground">
                  <CalendarDays className="mx-auto h-10 w-10" />
                  <p className="mt-2 text-sm">Chart data will be shown here.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
