'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, Printer } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/firebase';
import { v4 as uuidv4 } from 'uuid';

type Medicine = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
};

export default function EPrescriptionPage() {
  const { user } = useUser();
  const [patient, setPatient] = React.useState('');
  const [diagnosis, setDiagnosis] = React.useState('');
  const [medicines, setMedicines] = React.useState<Medicine[]>([
    { id: uuidv4(), name: '', dosage: '1', frequency: 'OD', duration: '7 days' }
  ]);
  const [notes, setNotes] = React.useState('');

  const handleAddMedicine = () => {
    setMedicines(prev => [...prev, { id: uuidv4(), name: '', dosage: '1', frequency: 'OD', duration: '7 days' }]);
  };

  const handleRemoveMedicine = (id: string) => {
    setMedicines(prev => prev.filter(med => med.id !== id));
  };

  const handleMedicineChange = (id: string, field: keyof Medicine, value: string) => {
    setMedicines(prev => prev.map(med => med.id === id ? { ...med, [field]: value } : med));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create E-Prescription</CardTitle>
          <CardDescription>Generate and print a prescription for a patient.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-1">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient and Diagnosis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient</Label>
                <Select onValueChange={setPatient} value={patient}>
                  <SelectTrigger id="patient">
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* In a real app, this would be populated from Firestore */}
                    <SelectItem value="p1">Alex Johnson</SelectItem>
                    <SelectItem value="p2">Maria Garcia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Textarea id="diagnosis" placeholder="Enter diagnosis details..." value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medicines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {medicines.map((med, index) => (
                <div key={med.id} className="grid grid-cols-1 sm:grid-cols-10 gap-2 items-end p-3 border rounded-lg">
                  <div className="font-medium sm:col-span-1">{index + 1}.</div>
                  <div className="space-y-1 sm:col-span-3">
                    <Label>Medicine Name</Label>
                    <Input placeholder="e.g., Paracetamol" value={med.name} onChange={e => handleMedicineChange(med.id, 'name', e.target.value)} />
                  </div>
                  <div className="space-y-1 sm:col-span-1">
                    <Label>Dosage</Label>
                    <Input placeholder="1" value={med.dosage} onChange={e => handleMedicineChange(med.id, 'dosage', e.target.value)} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Frequency</Label>
                    <Select value={med.frequency} onValueChange={val => handleMedicineChange(med.id, 'frequency', val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OD">OD (Once a day)</SelectItem>
                        <SelectItem value="BD">BD (Twice a day)</SelectItem>
                        <SelectItem value="TDS">TDS (Three times a day)</SelectItem>
                        <SelectItem value="QID">QID (Four times a day)</SelectItem>
                        <SelectItem value="SOS">SOS (As needed)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Duration</Label>
                    <Input placeholder="e.g., 7 days" value={med.duration} onChange={e => handleMedicineChange(med.id, 'duration', e.target.value)} />
                  </div>
                  <div className="sm:col-span-1">
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveMedicine(med.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={handleAddMedicine}><PlusCircle className="mr-2 h-4 w-4" /> Add Medicine</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea placeholder="Add any additional notes or instructions for the patient..." value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="print:shadow-none print:border-none">
            <CardHeader className="text-center space-y-0">
              <h2 className="text-xl font-bold">Dr. {user?.name || 'Your Name'}</h2>
              <p className="text-sm text-muted-foreground">{(user as any)?.specialization || 'Dermatologist'}</p>
              <p className="text-xs text-muted-foreground">PMDC: 12345-P</p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="border-t pt-4">
                <p><span className="font-semibold">Patient:</span> {patient || '___________________'}</p>
                <p><span className="font-semibold">Date:</span> {new Date().toLocaleDateString()}</p>
              </div>
              <div className="border-t pt-4">
                <p className="font-semibold">Diagnosis:</p>
                <p>{diagnosis || 'N/A'}</p>
              </div>

              <div className="border-t pt-4 space-y-2">
                <h3 className="font-semibold text-center mb-2">Rx</h3>
                {medicines.filter(m => m.name).map(med => (
                  <div key={med.id}>
                    <p className="font-bold">{med.name}</p>
                    <p className="pl-4 text-muted-foreground">{med.dosage} - {med.frequency} - for {med.duration}</p>
                  </div>
                ))}
              </div>

              {notes && (
                <div className="border-t pt-4">
                  <p className="font-semibold">Notes:</p>
                  <p className="whitespace-pre-wrap">{notes}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-2 print:hidden">
              <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Prescription</Button>
              <Button variant="outline">Save as Template</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
