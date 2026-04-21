'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, Printer, Save, Search, Calendar, X, Send } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, doc, query, where, deleteDoc } from 'firebase/firestore';
import type { Patient, Doctor } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { safeFormat } from '@/lib/safe-date';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, History } from 'lucide-react';
import { PrescriptionPreview } from '@/components/PrescriptionPreview';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// ─── Types ────────────────────────────────────────────────────────────────────

type Medicine = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

type Vital = {
  bp: string;
  pulse: string;
  temp: string;
  weight: string;
  height: string;
};

const defaultMedicine = (): Medicine => ({
  id: uuidv4(),
  name: '',
  dosage: '1 tablet',
  frequency: 'OD',
  duration: '7 days',
  instructions: '',
});

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EPrescriptionPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const patientsRef = useMemoFirebase(() => firestore ? collection(firestore, 'patients') : null, [firestore]);
  const { data: patients } = useCollection<Patient>(patientsRef);

  const doctorsRef = useMemoFirebase(() => firestore ? collection(firestore, 'doctors') : null, [firestore]);
  const { data: doctors } = useCollection<Doctor>(doctorsRef);

  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = React.useState('');
  const [chiefComplaint, setChiefComplaint] = React.useState('');
  const [diagnosis, setDiagnosis] = React.useState('');
  const [medicines, setMedicines] = React.useState<Medicine[]>([defaultMedicine()]);
  const [investigations, setInvestigations] = React.useState('');
  const [advice, setAdvice] = React.useState('');
  const [followUpDates, setFollowUpDates] = React.useState<string[]>([]);
  const [newFollowUpDate, setNewFollowUpDate] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedId, setSavedId] = React.useState<string | null>(null);
  const [printOnLetterhead, setPrintOnLetterhead] = React.useState(false);
  const [previewRx, setPreviewRx] = React.useState<any | null>(null);
  const [rxToDelete, setRxToDelete] = React.useState<string | null>(null);

  const resetForm = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setChiefComplaint('');
    setDiagnosis('');
    setMedicines([defaultMedicine()]);
    setInvestigations('');
    setAdvice('');
    setFollowUpDates([]);
    setNewFollowUpDate('');
    setNotes('');
    setSavedId(null);
  };

  const prescriptionsQuery = useMemoFirebase(() => firestore && selectedPatient ? query(collection(firestore, 'prescriptions'), where('patientId', '==', selectedPatient.id)) : null, [firestore, selectedPatient]);
  const { data: rawPastPrescriptions } = useCollection<any>(prescriptionsQuery as any);
  const pastPrescriptions = React.useMemo(() => {
    if (!rawPastPrescriptions) return [];
    return rawPastPrescriptions.slice().sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [rawPastPrescriptions]);

  const handleLoadPrescription = (rx: any) => {
    setChiefComplaint(rx.chiefComplaint || '');
    setDiagnosis(rx.diagnosis || '');
    setMedicines(rx.medicines && rx.medicines.length > 0 ? rx.medicines : [defaultMedicine()]);
    setInvestigations(rx.investigations || '');
    setAdvice(rx.advice || '');
    setFollowUpDates(rx.followUp || []);
    setNotes(rx.notes || '');
    toast({ title: 'Prescription Loaded', description: 'Data has been pre-filled from history.' });
  };

  const linkedDoctor = React.useMemo(() => {
    if (!doctors || !user) return null;
    if ((user as any).doctorId) return doctors.find(d => d.id === (user as any).doctorId) || null;
    const norm = user.name?.toLowerCase().replace(/^dr\.?\s+/g, '').trim() || '';
    return doctors.find(d => {
      const dn = (d.fullName || '').toLowerCase().replace(/^dr\.?\s+/g, '').trim();
      return dn.includes(norm) || norm.includes(dn);
    }) || null;
  }, [doctors, user]);

  const filteredPatients = React.useMemo(() => {
    if (!patients) return [];
    if (!patientSearch) return patients.slice(0, 200);
    const term = patientSearch.toLowerCase();
    return patients.filter(p => p.name?.toLowerCase().includes(term) || p.mobileNumber?.includes(term)).slice(0, 200);
  }, [patients, patientSearch]);

  const handleMedicineChange = (id: string, field: keyof Medicine, value: string) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handlePrint = () => {
    if (!selectedPatient) {
      toast({ variant: 'destructive', title: 'Select a Patient', description: 'Please select a patient before printing.' });
      return;
    }
    window.print();
  };

  const handleSave = async () => {
    if (!firestore || !selectedPatient) {
      toast({ variant: 'destructive', title: 'Select a Patient' });
      return;
    }
    setIsSaving(true);
    try {
      const docRef = await addDoc(collection(firestore, 'prescriptions'), {
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientMobile: selectedPatient.mobileNumber,
        patient: selectedPatient,
        doctorId: linkedDoctor?.id || (user as any)?.doctorId || user?.id,
        doctorName: linkedDoctor?.fullName || user?.name,
        doctorQualification: linkedDoctor?.qualification || '',
        doctorSpecialization: linkedDoctor?.specialization || '',
        chiefComplaint, diagnosis, medicines, investigations, advice,
        followUp: followUpDates,
        notes,
        createdAt: new Date().toISOString(),
      });
      setSavedId(docRef.id);
      toast({ title: 'Prescription Saved', description: 'You can now send it for print.' });
    } catch {
      toast({ variant: 'destructive', title: 'Save Failed' });
    }
    setIsSaving(false);
  };

  const handleDeletePrescription = async () => {
    if (!firestore || !rxToDelete) return;
    try {
      await deleteDoc(doc(firestore, 'prescriptions', rxToDelete));
      toast({ title: 'Prescription Deleted', description: 'The record has been permanently removed.' });
      setRxToDelete(null);
    } catch {
      toast({ variant: 'destructive', title: 'Deletion Failed' });
    }
  };

  const handleSendForPrint = async () => {
    if (!firestore || !savedId) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(firestore, 'prescriptions', savedId), { printStatus: 'Pending' });
      toast({ title: 'Sent for Print', description: 'The prescription has been added to the operations print queue.' });
      resetForm();
    } catch {
      toast({ variant: 'destructive', title: 'Failed to Send for Print' });
    }
    setIsSaving(false);
  };

  const doctorName = linkedDoctor?.fullName || user?.name || 'Doctor';
  const doctorQualification = (linkedDoctor as any)?.qualification || '';
  const doctorSpecialization = (linkedDoctor as any)?.specialization || 'Dermatologist';
  const today = format(new Date(), 'dd MMMM yyyy');

  const previewProps = { 
    doctorName, doctorQualification, doctorSpecialization, 
    patient: selectedPatient, chiefComplaint, diagnosis, 
    medicines, investigations, advice, followUpDates, today,
    hideBranding: printOnLetterhead 
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          #rx-print-area, #rx-print-area * { visibility: visible !important; }
          #rx-print-area {
            position: fixed !important;
            inset: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 auto !important;
            background: white !important;
            z-index: 9999 !important;
          }
          .no-print { display: none !important; }
        }
      `}} />

      {/* ── SCREEN UI ── */}
      <div className="space-y-6 no-print">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">E-Prescription</h1>
            <p className="text-muted-foreground text-sm">Create and print professional prescriptions on the SkinSmith letterhead.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2 bg-muted/30 px-3 py-1.5 rounded-full ring-1 ring-border">
              <Switch id="letterhead-mode" checked={printOnLetterhead} onCheckedChange={setPrintOnLetterhead} />
              <Label htmlFor="letterhead-mode" className="text-xs font-semibold whitespace-nowrap">Use Pre-printed Physical Stationery</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-48 text-xs">When ON, branding (logo/motifs) are hidden to print directly on your clinic's stationery.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSave} disabled={isSaving || !!savedId}>
                <Save className="mr-2 h-4 w-4" />{isSaving ? 'Saving...' : savedId ? 'Saved' : 'Save'}
              </Button>
              <Button variant="default" onClick={handleSendForPrint} disabled={isSaving || !savedId}>
                <Send className="mr-2 h-4 w-4" />Send for Print
              </Button>
              <Button onClick={handlePrint} variant="secondary"><Printer className="mr-2 h-4 w-4" />Print Direct</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* ─ Form ─ */}
          <div className="xl:col-span-3 space-y-4">

            <Card>
              <CardHeader><CardTitle className="text-base">Patient</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by name or mobile..." className="pl-9" value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
                </div>
                {patientSearch && (
                  <div className="border rounded-lg max-h-40 overflow-y-auto divide-y">
                    {filteredPatients.map(p => (
                      <div key={p.id} className="px-3 py-2 hover:bg-muted cursor-pointer flex justify-between items-center" onClick={() => { setSelectedPatient(p); setPatientSearch(''); setSavedId(null); }}>
                        <span className="font-medium text-sm">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.mobileNumber}</span>
                      </div>
                    ))}
                    {filteredPatients.length === 0 && <p className="text-center py-3 text-sm text-muted-foreground">No patients found</p>}
                  </div>
                )}
                {selectedPatient && (
                  <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div>
                      <p className="font-semibold text-sm">{selectedPatient.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedPatient.mobileNumber} · {selectedPatient.gender} · Age {selectedPatient.age}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedPatient(null)}>×</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedPatient && pastPrescriptions && pastPrescriptions.length > 0 && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> Prescription History</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {pastPrescriptions.map(rx => (
                      <div key={rx.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg bg-muted/10 gap-3">
                        <div>
                          <p className="text-sm font-semibold">
                            {safeFormat(rx.createdAt, 'dd MMMM yyyy, p')}
                          </p>
                          <p className="text-xs text-muted-foreground">{rx.doctorName} • {rx.diagnosis || 'No diagnosis recorded'}</p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => setPreviewRx(rx)}>View</Button>
                          <Button size="sm" variant="secondary" className="flex-1 sm:flex-none" onClick={() => handleLoadPrescription(rx)}>Load</Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setRxToDelete(rx.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}



            <Card>
              <CardHeader><CardTitle className="text-base">Clinical Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Chief Complaint</Label>
                  <Textarea placeholder="Patient's main complaint..." value={chiefComplaint} onChange={e => setChiefComplaint(e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Diagnosis</Label>
                  <Textarea placeholder="Clinical diagnosis..." value={diagnosis} onChange={e => setDiagnosis(e.target.value)} rows={2} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Rx — Medicines</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setMedicines(prev => [...prev, defaultMedicine()])}><PlusCircle className="mr-2 h-4 w-4" />Add Medicine</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {medicines.map((med, index) => (
                  <div key={med.id} className="border rounded-lg p-3 space-y-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">{index + 1}</Badge>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setMedicines(prev => prev.filter(m => m.id !== med.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Medicine Name</Label>
                        <Input placeholder="e.g., Betnovate Cream, Cetirizine" value={med.name} onChange={e => handleMedicineChange(med.id, 'name', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Dosage</Label>
                        <Input placeholder="e.g., 1 tablet, 5ml" value={med.dosage} onChange={e => handleMedicineChange(med.id, 'dosage', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Frequency</Label>
                        <Select value={med.frequency} onValueChange={val => handleMedicineChange(med.id, 'frequency', val)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OD">OD — Once a day</SelectItem>
                            <SelectItem value="BD">BD — Twice a day</SelectItem>
                            <SelectItem value="TDS">TDS — Three times a day</SelectItem>
                            <SelectItem value="QID">QID — Four times a day</SelectItem>
                            <SelectItem value="SOS">SOS — As needed</SelectItem>
                            <SelectItem value="HS">HS — At bedtime</SelectItem>
                            <SelectItem value="Stat">Stat — Immediately</SelectItem>
                            <SelectItem value="Weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Duration</Label>
                        <Input placeholder="e.g., 7 days, 1 month" value={med.duration} onChange={e => handleMedicineChange(med.id, 'duration', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Special Instructions</Label>
                        <Input placeholder="e.g., After meals, Apply twice daily" value={med.instructions} onChange={e => handleMedicineChange(med.id, 'instructions', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Additional Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Investigations / Tests</Label><Textarea placeholder="e.g., CBC, LFTs, Skin biopsy" value={investigations} onChange={e => setInvestigations(e.target.value)} rows={2} /></div>
                <div className="space-y-2"><Label>Advice / Instructions</Label><Textarea placeholder="e.g., Avoid sun exposure, Use SPF 50+..." value={advice} onChange={e => setAdvice(e.target.value)} rows={2} /></div>
                 <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Follow-up Appointments</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="date" 
                        className="max-w-[200px]"
                        value={newFollowUpDate}
                        onChange={(e) => setNewFollowUpDate(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newFollowUpDate && !followUpDates.includes(newFollowUpDate)) {
                            setFollowUpDates(prev => [...prev, newFollowUpDate].sort());
                            setNewFollowUpDate('');
                          }
                        }}
                      />
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => {
                          if (newFollowUpDate && !followUpDates.includes(newFollowUpDate)) {
                            setFollowUpDates(prev => [...prev, newFollowUpDate].sort());
                            setNewFollowUpDate('');
                          }
                        }}
                      >
                        Add Date
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {followUpDates.map(date => (
                        <Badge key={date} variant="outline" className="flex items-center gap-1 pl-2.5 pr-1 py-1">
                          {safeFormat(date, 'dd MMM yyyy')}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-4 w-4 rounded-full p-0" 
                            onClick={() => setFollowUpDates(prev => prev.filter(d => d !== date))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                      {followUpDates.length === 0 && <span className="text-xs text-muted-foreground italic">No follow-up dates added.</span>}
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Private Notes (Not Printed)</Label><Input placeholder="Internal notes..." value={notes} onChange={e => setNotes(prev => e.target.value)} /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─ Live Preview ─ */}
          <div className="xl:col-span-2">
            <div className="sticky top-4">
              <p className="text-xs text-muted-foreground text-center mb-2">Live Preview</p>
              <div className="border rounded-lg overflow-hidden shadow-lg" style={{ transform: 'scale(0.88)', transformOrigin: 'top center' }}>
                <PrescriptionPreview {...previewProps} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PRINT AREA ── */}
      <div id="rx-print-area" style={{ display: 'none' }}>
        <PrescriptionPreview {...previewProps} />
      </div>

      {/* ── VIEW PAST RECORD DIALOG ── */}
      <Dialog open={!!previewRx} onOpenChange={(o) => { if (!o) setPreviewRx(null); }}>
        <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
          <DialogTitle className="sr-only">Past Prescription</DialogTitle>
          <DialogDescription className="sr-only">Preview of past prescription</DialogDescription>
          {previewRx && (
            <div className="flex justify-center items-center h-full pt-8">
              <div className="bg-white" style={{ width: '210mm', height: '297mm', transform: 'scale(0.85)', transformOrigin: 'top center', boxShadow: '0 0 20px rgba(0,0,0,0.1)' }}>
                <PrescriptionPreview 
                  doctorName={previewRx.doctorName || 'Doctor'}
                  doctorQualification={previewRx.doctorQualification || ''}
                  doctorSpecialization={previewRx.doctorSpecialization || ''}
                  patient={previewRx.patient || selectedPatient}
                  chiefComplaint={previewRx.chiefComplaint || ''}
                  diagnosis={previewRx.diagnosis || ''}
                  medicines={previewRx.medicines || []}
                  investigations={previewRx.investigations || ''}
                  advice={previewRx.advice || ''}
                  followUpDates={previewRx.followUp || []}
                  today={safeFormat(previewRx.createdAt, 'dd MMMM yyyy', today)}
                  hideBranding={false}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRMATION DIALOG ── */}
      <Dialog open={!!rxToDelete} onOpenChange={(o) => { if (!o) setRxToDelete(null); }}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" /> Warning: Deleting Record
          </DialogTitle>
          <DialogDescription className="py-4 font-semibold text-foreground">
            You are deleting the patient history, are you sure?
          </DialogDescription>
          <p className="text-sm text-muted-foreground mb-4">This action is permanent and cannot be undone. The clinical data for this visit will be lost.</p>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setRxToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePrescription}>Delete Permanently</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

