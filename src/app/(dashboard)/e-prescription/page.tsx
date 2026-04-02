'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, Printer, Save, Search, Calendar, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import type { Patient, Doctor } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

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
  const [vitals, setVitals] = React.useState<Vital>({ bp: '', pulse: '', temp: '', weight: '', height: '' });
  const [medicines, setMedicines] = React.useState<Medicine[]>([defaultMedicine()]);
  const [investigations, setInvestigations] = React.useState('');
  const [advice, setAdvice] = React.useState('');
  const [followUpDates, setFollowUpDates] = React.useState<string[]>([]);
  const [newFollowUpDate, setNewFollowUpDate] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [printOnLetterhead, setPrintOnLetterhead] = React.useState(true);

  const linkedDoctor = React.useMemo(() => {
    if (!doctors || !user) return null;
    if ((user as any).doctorId) return doctors.find(d => d.id === (user as any).doctorId) || null;
    const norm = user.name?.toLowerCase().replace(/^dr\.?\s+/g, '').trim() || '';
    return doctors.find(d => {
      const dn = d.fullName.toLowerCase().replace(/^dr\.?\s+/g, '').trim();
      return dn.includes(norm) || norm.includes(dn);
    }) || null;
  }, [doctors, user]);

  const filteredPatients = React.useMemo(() => {
    if (!patients) return [];
    if (!patientSearch) return patients.slice(0, 20);
    const term = patientSearch.toLowerCase();
    return patients.filter(p => p.name?.toLowerCase().includes(term) || p.mobileNumber?.includes(term)).slice(0, 10);
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
      await addDoc(collection(firestore, 'prescriptions'), {
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientMobile: selectedPatient.mobileNumber,
        doctorId: linkedDoctor?.id || (user as any)?.doctorId || user?.id,
        doctorName: linkedDoctor?.fullName || user?.name,
        chiefComplaint, diagnosis, vitals, medicines, investigations, advice, 
        followUp: followUpDates, 
        notes,
        createdAt: new Date().toISOString(),
      });
      toast({ title: 'Prescription Saved' });
    } catch {
      toast({ variant: 'destructive', title: 'Save Failed' });
    }
    setIsSaving(false);
  };

  const doctorName = linkedDoctor?.fullName || user?.name || 'Doctor';
  const doctorQualification = (linkedDoctor as any)?.qualification || '';
  const doctorSpecialization = (linkedDoctor as any)?.specialization || 'Dermatologist';
  const today = format(new Date(), 'dd MMMM yyyy');

  const previewProps = { 
    doctorName, doctorQualification, doctorSpecialization, 
    patient: selectedPatient, vitals, chiefComplaint, diagnosis, 
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
              <Label htmlFor="letterhead-mode" className="text-xs font-semibold whitespace-nowrap">Print on Physical Letterhead</Label>
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
              <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />{isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Print Prescription</Button>
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
                      <div key={p.id} className="px-3 py-2 hover:bg-muted cursor-pointer flex justify-between items-center" onClick={() => { setSelectedPatient(p); setPatientSearch(''); }}>
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

            <Card>
              <CardHeader><CardTitle className="text-base">Vitals</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(['bp', 'pulse', 'temp', 'weight', 'height'] as (keyof Vital)[]).map(key => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">{key === 'bp' ? 'Blood Pressure' : key === 'temp' ? 'Temperature' : key.charAt(0).toUpperCase() + key.slice(1)}</Label>
                      <Input placeholder={key === 'bp' ? '120/80' : key === 'pulse' ? '72 bpm' : key === 'temp' ? '98.6°F' : key === 'weight' ? '65 kg' : '170 cm'} value={vitals[key]} onChange={e => setVitals(prev => ({ ...prev, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

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
                          {format(new Date(date), 'dd MMM yyyy')}
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
    </>
  );
}

// ─── Prescription Print Template ─────────────────────────────────────────────

interface PreviewProps {
  doctorName: string;
  doctorQualification: string;
  doctorSpecialization: string;
  patient: Patient | null;
  vitals: Vital;
  chiefComplaint: string;
  diagnosis: string;
  medicines: Medicine[];
  investigations: string;
  advice: string;
  followUpDates: string[];
  today: string;
  hideBranding?: boolean;
}

function PrescriptionPreview({ 
  doctorName, doctorQualification, doctorSpecialization, 
  patient, vitals, chiefComplaint, diagnosis, medicines, 
  investigations, advice, followUpDates, today, hideBranding 
}: PreviewProps) {
  // Refined face profile silhouette path
  const preciseFace = "M31.2,16.8c-0.2-2.1,0.2-4.2,1.2-6.1c0.4-0.8,1.4-1,2-0.3c0.7,0.8,1.3,1.6,1.9,2.4c0.7,1,1.5,1.9,2.3,2.8c1,1.1,2.2,2.1,3.4,3c1.3,1,2.7,1.8,4.2,2.5c1.6,0.7,3.2,1.3,4.9,1.7c1.7,0.4,3.5,0.7,5.3,0.7c1.8,0,3.6-0.2,5.4-0.6c1.8-0.4,3.5-1.1,5.1-1.9c0.8-0.4,1.8,0,2,0.8c0.2,0.8,0.1,1.8-0.4,2.5c-0.8,1.3-1.8,2.4-2.8,3.5c-1.1,1-2.3,1.9-3.6,2.7c-1.3,0.8-2.7,1.5-4.2,2c-1.5,0.5-3.1,0.8-4.7,1c-1.6,0.2-3.3,0.3-4.9,0.2c-1.7-0.1-3.3-0.3-5-0.7c-1.6-0.4-3.1-1-4.6-1.7c-1.4-0.7-2.8-1.7-3.9-2.7c-0.8-0.8-1.5-1.7-2.1-2.6c-0.6-0.9-1.1-1.9-1.5-2.9C31.5,21.1,31.2,19,31.2,16.8z M50.4,14.4c-2.4,0-4.3,1.9-4.3,4.3c0,2.4,1.9,4.3,4.3,4.3c2.4,0,4.3-1.9,4.3-4.3C54.7,16.3,52.8,14.4,50.4,14.4z";

  return (
    <div style={{ 
      fontFamily: "'Inter', 'Arial', sans-serif", 
      backgroundColor: 'white', 
      width: '100%', 
      minHeight: '297mm', 
      position: 'relative', 
      overflow: 'hidden' 
    }}>
      
      {/* ── Background Watermark ── */}
      {!hideBranding && (
        <div style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -45%)',
          opacity: 0.025,
          pointerEvents: 'none',
          zIndex: 0
        }}>
          <svg width="550" height="550" viewBox="0 0 100 100" style={{ fill: '#C9A84C' }}>
            <path d={preciseFace} />
          </svg>
        </div>
      )}

      {/* ── TOP-RIGHT CORNER MOTIF ── */}
      {!hideBranding && (
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '320px', height: '320px', pointerEvents: 'none' }}>
          <svg width="320" height="320" viewBox="0 0 320 320">
            <rect x="230" y="30" width="115" height="115" transform="rotate(45 287 87)" fill="none" stroke="#C9A84C" strokeWidth="6" />
            <rect x="175" y="85" width="115" height="115" transform="rotate(45 232 142)" fill="#2a2a2a" />
            <rect x="120" y="140" width="115" height="115" transform="rotate(45 177 197)" fill="none" stroke="#C9A84C" strokeWidth="4" />
            <rect x="65" y="195" width="115" height="115" transform="rotate(45 122 252)" fill="#333" />
          </svg>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ padding: '60px 70px 40px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <div>
          {!hideBranding ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '80px', height: '80px' }}>
                <svg viewBox="0 0 100 100" style={{ fill: '#C9A84C', width: '100%', height: '100%' }}>
                  <path d={preciseFace} />
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '38px', fontWeight: 900, letterSpacing: '4px', color: '#1a1a1a', lineHeight: 1 }}>SKINSMITH</div>
                <div style={{ fontSize: '13px', letterSpacing: '5px', color: '#666', marginTop: '6px', fontWeight: 500 }}>BE BETTER BE YOU</div>
              </div>
            </div>
          ) : (
            <div style={{ height: '80px', width: '1px' }}></div> /* Maintain spacing */
          )}
        </div>

        {/* Date & Doctor Info */}
        <div style={{ textAlign: 'right', marginTop: '10px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a' }}>Date: {today}</div>
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a' }}>{doctorName}</div>
            <div style={{ fontSize: '13px', color: '#555', fontWeight: 500, marginTop: '2px' }}>{doctorQualification}</div>
            <div style={{ fontSize: '13px', color: '#C9A84C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>{doctorSpecialization}</div>
          </div>
        </div>
      </div>

      {/* ── PATIENT INFO BLOCK (Minimalist) ── */}
      {patient && (
        <div style={{ margin: '10px 70px', display: 'flex', gap: '40px', borderBottom: '1px solid #eee', paddingBottom: '15px', zIndex: 1, position: 'relative' }}>
          <div>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#999', letterSpacing: '1px' }}>Patient: </span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a' }}>{patient.name}</span>
          </div>
          <div>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#999', letterSpacing: '1px' }}>Age/Sex: </span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a' }}>{patient.age} / {patient.gender}</span>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#999', letterSpacing: '1px' }}>ID: </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>{patient.mobileNumber}</span>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT BODY ── */}
      <div style={{ padding: '30px 70px 180px 70px', minHeight: '150mm', position: 'relative', zIndex: 1 }}>
        
        {/* Vitals Summary (Ultra Minimal) */}
        {(vitals.bp || vitals.pulse || vitals.temp || vitals.weight || vitals.height) && (
          <div style={{ display: 'flex', gap: '30px', marginBottom: '35px', color: '#666', borderBottom: '1px double #eee', paddingBottom: '10px' }}>
            {vitals.bp && <span style={{ fontSize: '11px' }}><strong style={{ color: '#C9A84C' }}>BP:</strong> {vitals.bp}</span>}
            {vitals.pulse && <span style={{ fontSize: '11px' }}><strong style={{ color: '#C9A84C' }}>PULSE:</strong> {vitals.pulse}</span>}
            {vitals.temp && <span style={{ fontSize: '11px' }}><strong style={{ color: '#C9A84C' }}>TEMP:</strong> {vitals.temp}</span>}
            {vitals.weight && <span style={{ fontSize: '11px' }}><strong style={{ color: '#C9A84C' }}>WT:</strong> {vitals.weight}</span>}
            {vitals.height && <span style={{ fontSize: '11px' }}><strong style={{ color: '#C9A84C' }}>HT:</strong> {vitals.height}</span>}
          </div>
        )}

        {/* Complaints & Diagnosis */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
          {chiefComplaint && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Chief Complaints</div>
              <div style={{ fontSize: '14px', color: '#1a1a1a', lineHeight: 1.6 }}>{chiefComplaint}</div>
            </div>
          )}
          {diagnosis && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Diagnosis / Assessment</div>
              <div style={{ fontSize: '14px', color: '#1a1a1a', lineHeight: 1.6, fontWeight: 600 }}>{diagnosis}</div>
            </div>
          )}
        </div>

        {/* Rx Symbol Removed as per user feedback */}

        {/* Medicines List */}
        <div style={{ marginBottom: '40px' }}>
          {medicines.filter(m => m.name).map((med, i) => (
            <div key={med.id} style={{ marginBottom: '20px', paddingLeft: '10px', borderLeft: '3px solid #C9A84C' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'baseline' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#111' }}>{i + 1}. {med.name}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>({med.dosage} - {med.frequency} - {med.duration})</div>
              </div>
              {med.instructions && <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#888', marginTop: '4px', paddingLeft: '20px' }}>Instr: {med.instructions}</div>}
            </div>
          ))}
          {medicines.filter(m => m.name).length === 0 && (
            <div style={{ fontSize: '12px', color: '#ccc', fontStyle: 'italic' }}>No medicines prescribed.</div>
          )}
        </div>

        {/* Other Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', marginTop: '40px' }}>
          {investigations && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Investigations</div>
              <div style={{ fontSize: '13px', color: '#333', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{investigations}</div>
            </div>
          )}
          {advice && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Special Advice</div>
              <div style={{ fontSize: '13px', color: '#333', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{advice}</div>
            </div>
          )}
        </div>

        {followUpDates.length > 0 && (
          <div style={{ marginTop: '40px', fontSize: '13px', color: '#1a1a1a', borderLeft: '2px solid #C9A84C', paddingLeft: '15px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '5px' }}>Follow-up Appointments</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
              {followUpDates.map(date => (
                <div key={date} style={{ fontWeight: 700 }}>• {format(new Date(date), 'dd MMMM yyyy')}</div>
              ))}
            </div>
          </div>
        )}

        {/* Signature Area */}
        <div style={{ position: 'absolute', bottom: '20px', right: '70px', textAlign: 'center', minWidth: '200px' }}>
          <div style={{ height: '60px' }}></div>
          <div style={{ borderTop: '2px solid #1a1a1a', paddingTop: '10px' }}>
            <div style={{ fontSize: '16px', fontWeight: 900 }}>{doctorName}</div>
            <div style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>Signature</div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM-LEFT CORNER MOTIF ── */}
      {!hideBranding && (
        <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '380px', height: '380px', pointerEvents: 'none' }}>
          <svg width="380" height="380" viewBox="0 0 380 380">
            <rect x="40" y="220" width="135" height="135" transform="rotate(45 107 287)" fill="#222" />
            <rect x="110" y="150" width="135" height="135" transform="rotate(45 177 217)" fill="none" stroke="#C9A84C" strokeWidth="6" />
            <rect x="180" y="80" width="135" height="135" transform="rotate(45 247 147)" fill="#2a2a2a" />
            <rect x="250" y="10" width="135" height="135" transform="rotate(45 317 77)" fill="none" stroke="#C9A84C" strokeWidth="4" />
          </svg>
        </div>
      )}

      {/* ── FOOTER ── */}
      {!hideBranding ? (
        <div style={{ 
          position: 'absolute', 
          bottom: '0px', 
          right: '0px', 
          padding: '50px 70px', 
          zIndex: 2
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end', textAlign: 'right' }}>
            {/* Phones */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a' }}>+92 333 0477704</div>
              <div style={{ width: '24px', height: '24px', backgroundColor: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '2px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z" />
                </svg>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a' }}>+92 333 3336683</div>
              <div style={{ width: '24px', height: '24px', backgroundColor: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '2px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z" />
                </svg>
              </div>
            </div>
            {/* Address */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '350px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.4 }}>06 Lord Trade Centre, 1st floor, F-11 Markaz, Islamabad</div>
              <div style={{ width: '24px', height: '24px', backgroundColor: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: '2px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5Z" />
                </svg>
              </div>
            </div>
            {/* Email */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a' }}>skinsmithisb@gmail.com</div>
              <div style={{ width: '24px', height: '24px', backgroundColor: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '2px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ position: 'absolute', bottom: '0', height: '80px', width: '100%' }}></div> /* Maintain footer volume */
      )}
    </div>
  );
}
