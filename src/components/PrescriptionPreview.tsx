import * as React from 'react';
import type { Patient } from '@/lib/types';
import { format } from 'date-fns';



type Medicine = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

export interface PrescriptionPreviewProps {
  doctorName: string;
  doctorQualification: string;
  doctorSpecialization: string;
  patient: Patient | null;
  chiefComplaint: string;
  diagnosis: string;
  medicines: Medicine[];
  investigations: string;
  advice: string;
  followUpDates: string[];
  today: string;
  hideBranding?: boolean;
}

function safeFormatDate(dateStr: string) {
  try { return format(new Date(dateStr), 'dd MMMM yyyy'); } catch { return ''; }
}

const GOLD = '#D1B057';
const INK  = '#2D2D2D';

// Ultra-Elegant Lady Profile for SkinSmith (Thin Line-Art)
const preciseFace = "M15.5,10.5c-4.2,0.1-7.8,3.2-8.5,7.3c-0.1,0.5,0.1,1.1,0.5,1.4c4.1,2.8,7.9,6.7,11.2,11.3c2.4,3.3,4.1,7.2,4.8,11.2c0.2,1,1.1,1.7,2,1.7c0.2,0,0.5,0,0.7-0.1c1.1-0.3,1.8-1.5,1.5-2.6c-0.6-3.1-4.7-18.4-12.2-24.1C15,16,15,10.5,15.5,10.5z M25.4,12.5c-5.1,1-9.2,5.2-10.2,10.3c10,2,15,12,15,12s5-15,15-20c-5-2-10-2.3-15-2.3c-1.5,0-3.2,0.1-4.8,0.2c-0.1,2.1,1.8,4.1,4,4.1s4.1-1.8,4.1-4C29.6,12.6,27.5,12.4,25.4,12.5z";
const swooshHair = "M32.5,5.5c-2.1,0-4,1.8-4,4c0,2.1,1.8,4,4,4s4-1.8,4-4C36.5,7.3,34.7,5.5,32.5,5.5z M18.5,8.5c-1.1,0-2,0.9-2,2c0,1.1,0.9,2,2,2s2-0.9,2-2C20.5,9.4,19.6,8.5,18.5,8.5z";

// ─────────────────────────────────────────────────────────────────────────────
// LETTERHEAD MODE
// Prints on top of the physical SkinSmith stationery.
// The physical paper already has logo, diamonds and footer pre-printed.
// This layout is completely plain — just the prescription data, no decorations.
//
// Physical letterhead safe zones (A4 = 297mm):
//   Top    ~42mm  → pre-printed logo + top-right diamond
//   Bottom ~60mm  → pre-printed bottom-left diamonds + contact info
// ─────────────────────────────────────────────────────────────────────────────
function LetterheadLayout(p: Omit<PrescriptionPreviewProps, 'hideBranding'>) {
  const namedMeds = p.medicines.filter(m => m.name);

  return (
    <div style={{
      fontFamily: "'Arial', sans-serif",
      width: '210mm',
      height: '297mm',
      boxSizing: 'border-box',
      paddingTop: '44mm',
      paddingBottom: '62mm',
      paddingLeft: '18mm',
      paddingRight: '18mm',
      display: 'flex',
      flexDirection: 'column',
      background: 'transparent',
      color: INK,
    }}>

      {/* Doctor + Date row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3mm', paddingBottom: '2.5mm', borderBottom: '0.6px solid #888' }}>
        <div>
          <div style={{ fontSize: '13pt', fontWeight: 800, lineHeight: 1.2 }}>{p.doctorName}</div>
          {p.doctorQualification && <div style={{ fontSize: '8pt', color: '#444', marginTop: '1mm' }}>{p.doctorQualification}</div>}
          {p.doctorSpecialization && <div style={{ fontSize: '8pt', color: '#444', fontWeight: 600, marginTop: '0.5mm', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{p.doctorSpecialization}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '8pt', color: '#666' }}>Date</div>
          <div style={{ fontSize: '10pt', fontWeight: 700 }}>{p.today}</div>
        </div>
      </div>

      {/* Patient */}
      {p.patient && (
        <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', paddingBottom: '2mm', marginBottom: '2.5mm', borderBottom: '0.6px solid #ccc' }}>
          <span style={{ fontSize: '10.5pt', fontWeight: 700 }}>
            <span style={{ fontSize: '7.5pt', color: '#888', fontWeight: 400, marginRight: '3px' }}>Patient:</span>
            {p.patient.name}
          </span>
          <span style={{ fontSize: '10.5pt', fontWeight: 700 }}>
            <span style={{ fontSize: '7.5pt', color: '#888', fontWeight: 400, marginRight: '3px' }}>Age/Sex:</span>
            {p.patient.age} / {p.patient.gender}
          </span>
          <span style={{ fontSize: '10pt', marginLeft: 'auto' }}>
            <span style={{ fontSize: '7.5pt', color: '#888', fontWeight: 400, marginRight: '3px' }}>Contact:</span>
            {p.patient.mobileNumber}
          </span>
        </div>
      )}

      {/* Vitals */}
      {(p.vitals.bp || p.vitals.pulse || p.vitals.temp || p.vitals.weight || p.vitals.height) && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '2.5mm', paddingBottom: '2mm', borderBottom: '0.6px solid #eee', fontSize: '9pt' }}>
          {p.vitals.bp     && <span><strong>BP:</strong> {p.vitals.bp}</span>}
          {p.vitals.pulse  && <span><strong>Pulse:</strong> {p.vitals.pulse}</span>}
          {p.vitals.temp   && <span><strong>Temp:</strong> {p.vitals.temp}</span>}
          {p.vitals.weight && <span><strong>Wt:</strong> {p.vitals.weight}</span>}
          {p.vitals.height && <span><strong>Ht:</strong> {p.vitals.height}</span>}
        </div>
      )}

      {/* Chief Complaint + Diagnosis */}
      {(p.chiefComplaint || p.diagnosis) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '3mm' }}>
          {p.chiefComplaint && (
            <div>
              <div style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#555', marginBottom: '1mm' }}>Chief Complaint</div>
              <div style={{ fontSize: '10pt', lineHeight: 1.5 }}>{p.chiefComplaint}</div>
            </div>
          )}
          {p.diagnosis && (
            <div>
              <div style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#555', marginBottom: '1mm' }}>Diagnosis</div>
              <div style={{ fontSize: '10pt', lineHeight: 1.5, fontWeight: 600 }}>{p.diagnosis}</div>
            </div>
          )}
        </div>
      )}

      {/* Medicines */}
      <div style={{ borderTop: '0.6px solid #bbb', paddingTop: '2.5mm', marginBottom: '3mm' }}>
        <div style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#555', marginBottom: '2mm' }}>Rx — Medicines</div>
        {namedMeds.length === 0 && <div style={{ fontSize: '9pt', color: '#bbb', fontStyle: 'italic' }}>No medicines prescribed.</div>}
        {namedMeds.map((med, i) => (
          <div key={med.id} style={{ marginBottom: '2.5mm', paddingLeft: '5px', borderLeft: '2px solid #888' }}>
            <div style={{ fontSize: '11pt', fontWeight: 700 }}>
              {i + 1}.&nbsp;{med.name}
              <span style={{ fontSize: '8.5pt', fontWeight: 400, color: '#555', marginLeft: '5px' }}>
                {med.dosage} · {med.frequency} · {med.duration}
              </span>
            </div>
            {med.instructions && (
              <div style={{ fontSize: '8pt', fontStyle: 'italic', color: '#777', marginTop: '0.5mm', paddingLeft: '14px' }}>— {med.instructions}</div>
            )}
          </div>
        ))}
      </div>

      {/* Investigations + Advice */}
      {(p.investigations || p.advice) && (
        <div style={{ borderTop: '0.6px solid #ddd', paddingTop: '2.5mm', marginBottom: '3mm' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {p.investigations && (
              <div>
                <div style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#555', marginBottom: '1mm' }}>Investigations / Tests</div>
                <div style={{ fontSize: '9pt', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{p.investigations}</div>
              </div>
            )}
            {p.advice && (
              <div>
                <div style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#555', marginBottom: '1mm' }}>Advice / Instructions</div>
                <div style={{ fontSize: '9pt', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{p.advice}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Follow-up */}
      {p.followUpDates.length > 0 && (
        <div style={{ marginBottom: '3mm' }}>
          <div style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#555', marginBottom: '1mm' }}>Follow-up</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {p.followUpDates.map(d => <span key={d} style={{ fontSize: '9.5pt', fontWeight: 700 }}>• {safeFormatDate(d)}</span>)}
          </div>
        </div>
      )}

      {/* Push signature to bottom */}
      <div style={{ flex: 1 }} />

      {/* Signature */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ textAlign: 'center', minWidth: '130px' }}>
          <div style={{ height: '28px' }} />
          <div style={{ borderTop: '1px solid #333', paddingTop: '3px' }}>
            <div style={{ fontSize: '9.5pt', fontWeight: 800 }}>{p.doctorName}</div>
            <div style={{ fontSize: '7pt', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Signature</div>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIGITAL / BRANDED MODE
// Full SkinSmith branded prescription for digital printing or screen preview.
// Corner motifs are kept BEHIND all content via z-index layering.
// ─────────────────────────────────────────────────────────────────────────────
function DigitalLayout(p: Omit<PrescriptionPreviewProps, 'hideBranding'>) {
  return (
    <div style={{ fontFamily: "'Inter','Arial',sans-serif", background: 'white', width: '100%', minHeight: '297mm', position: 'relative', overflow: 'hidden' }}>

      {/* ── Decorative layer (behind everything) ── */}

      {/* Watermark */}
      <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%,-45%)', opacity: 0.025, pointerEvents: 'none', zIndex: 0 }}>
        <svg width="500" height="500" viewBox="0 0 100 100" style={{ fill: GOLD }}>
          <path d={preciseFace} />
        </svg>
      </div>

      {/* Top-right corner diamonds — Exact Replication */}
      <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '200px', height: '200px', pointerEvents: 'none', zIndex: 0 }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          <rect x="135" y="-45" width="110" height="110" transform="rotate(45 190 10)" fill="#222" />
          <rect x="105" y="15"  width="80"  height="80"  transform="rotate(45 145 55)" fill="none" stroke={GOLD} strokeWidth="2" />
          <rect x="165" y="15"  width="50"  height="50"  transform="rotate(45 190 40)" fill="none" stroke={GOLD} strokeWidth="1.5" />
          <rect x="150" y="65"  width="40"  height="40"  transform="rotate(45 170 85)" fill="#333" />
        </svg>
      </div>

      {/* ── All prescription content — ABOVE decorations ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Header: Logo + Doctor info */}
        <div style={{ padding: '48px 85px 25px 75px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '60px', height: '80px' }}>
              <svg viewBox="0 0 80 100" style={{ fill: GOLD, width: '100%', height: '100%' }}>
                {/* Ultra-Fine Lady Profile */}
                <path d="M10,20 C10,5 25,2 35,10 C45,18 45,25 42,35 C39,45 35,50 30,58 C25,66 22,75 22,85 C22,95 25,100 25,100 L20,100 C20,100 15,95 15,85 C15,75 18,66 23,58 C28,50 34,45 36,36 C38,27 38,20 32,15 C26,10 15,10 15,25 C15,35 18,40 20,45 L15,48 C15,48 10,40 10,32 Z" />
                <path d="M45,15 C50,10 60,10 65,15 C70,20 70,30 65,40 C60,50 50,55 45,65 C40,75 38,85 38,95 L33,95 C33,85 35,75 40,65 C45,55 55,50 60,40 C65,30 65,20 60,15 C55,10 45,10 40,25" fill="none" stroke={GOLD} strokeWidth="1.5" />
              </svg>
            </div>
            <div style={{ transform: 'translateY(-2px)' }}>
              <div style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '3px', color: '#111', lineHeight: 1, fontFamily: 'Optima, Cardo, "Times New Roman", serif' }}>SKINSMITH</div>
              <div style={{ fontSize: '10px', letterSpacing: '6px', color: '#777', marginTop: '8px', fontWeight: 600 }}>BE BETTER BE YOU</div>
            </div>
          </div>
          {/* Date + Doctor */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: INK, marginBottom: '12px' }}>Date: {p.today}</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: INK }}>{p.doctorName}</div>
            {p.doctorQualification && <div style={{ fontSize: '12px', color: '#555', fontWeight: 500, marginTop: '2px' }}>{p.doctorQualification}</div>}
            {p.doctorSpecialization && <div style={{ fontSize: '12px', color: GOLD, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>{p.doctorSpecialization}</div>}
          </div>
        </div>

        {/* Patient info */}
        {p.patient && (
          <div style={{ margin: '0 85px 0 75px', display: 'flex', gap: '35px', flexWrap: 'wrap', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
            <div><span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#999', letterSpacing: '1px' }}>Patient: </span><span style={{ fontSize: '14px', fontWeight: 700, color: INK }}>{p.patient.name}</span></div>
            <div><span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#999', letterSpacing: '1px' }}>Age/Sex: </span><span style={{ fontSize: '14px', fontWeight: 700, color: INK }}>{p.patient.age} / {p.patient.gender}</span></div>
            <div style={{ marginLeft: 'auto' }}><span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#999', letterSpacing: '1px' }}>Contact: </span><span style={{ fontSize: '13px', fontWeight: 600, color: INK }}>{p.patient.mobileNumber}</span></div>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '20px 65px 160px 55px' }}>



          {/* Chief Complaint + Diagnosis */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '35px', marginBottom: '32px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Clinical Details</div>
              <div style={{ fontSize: '14px', color: INK, lineHeight: 1.6 }}>{p.chiefComplaint || <span style={{ color: '#ddd', fontStyle: 'italic' }}>—</span>}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Diagnosis / Assessment</div>
              <div style={{ fontSize: '14px', color: INK, lineHeight: 1.6, fontWeight: 600 }}>{p.diagnosis || <span style={{ color: '#ddd', fontStyle: 'italic', fontWeight: 400 }}>—</span>}</div>
            </div>
          </div>

          {/* Medicines */}
          <div style={{ marginBottom: '32px' }}>
            {p.medicines.filter(m => m.name).map((med, i) => (
              <div key={med.id} style={{ marginBottom: '16px', paddingLeft: '10px', borderLeft: `3px solid ${GOLD}` }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#111' }}>{i + 1}. {med.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>({med.dosage} — {med.frequency} — {med.duration})</div>
                </div>
                {med.instructions && <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#888', marginTop: '3px', paddingLeft: '18px' }}>Instr: {med.instructions}</div>}
              </div>
            ))}
            {p.medicines.filter(m => m.name).length === 0 && (
              <div style={{ fontSize: '12px', color: '#ccc', fontStyle: 'italic' }}>No medicines prescribed.</div>
            )}
          </div>

          {/* Investigations + Advice */}
          {(p.investigations || p.advice) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '32px' }}>
              {p.investigations && (
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Investigations</div>
                  <div style={{ fontSize: '12px', color: '#333', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{p.investigations}</div>
                </div>
              )}
              {p.advice && (
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Special Advice</div>
                  <div style={{ fontSize: '12px', color: '#333', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{p.advice}</div>
                </div>
              )}
            </div>
          )}

          {/* Follow-up */}
          {p.followUpDates.length > 0 && (
            <div style={{ marginBottom: '32px', borderLeft: `2px solid ${GOLD}`, paddingLeft: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '5px' }}>Follow-up Appointments</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                {p.followUpDates.map(d => <div key={d} style={{ fontSize: '13px', fontWeight: 700 }}>• {safeFormatDate(d)}</div>)}
              </div>
            </div>
          )}

          {/* Signature */}
          <div style={{ position: 'absolute', bottom: '18px', right: '65px', textAlign: 'center', minWidth: '180px' }}>
            <div style={{ height: '50px' }} />
            <div style={{ borderTop: '2px solid #1a1a1a', paddingTop: '8px' }}>
              <div style={{ fontSize: '15px', fontWeight: 900 }}>{p.doctorName}</div>
              <div style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>Signature</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom-left corner diamonds — Precise Replication ── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '220px', height: '220px', pointerEvents: 'none', zIndex: 0 }}>
        <svg width="220" height="220" viewBox="0 0 220 220">
          <rect x="-30" y="140" width="95"  height="95"  transform="rotate(45 17 187)" fill="#1a1a1a" />
          <rect x="5"   y="105" width="85"  height="85"  transform="rotate(45 47 147)" fill="none" stroke={GOLD} strokeWidth="2" />
          <rect x="45"  y="65"  width="75"  height="75"  transform="rotate(45 82 102)" fill="#333" />
          <rect x="85"  y="25"  width="65"  height="65"  transform="rotate(45 117 57)"  fill="none" stroke={GOLD} strokeWidth="1.5" />
          <rect x="120" y="-10" width="55"  height="55"  transform="rotate(45 147 17)"  fill="none" stroke={GOLD} strokeWidth="1.2" />
        </svg>
      </div>

      {/* ── Footer (contact info) — ABOVE corner diamonds ── */}
      <div style={{ position: 'absolute', bottom: 0, right: 0, padding: '40px 65px', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end', textAlign: 'right' }}>
          {['+92 333 0477704', '+92 333 3336683'].map(phone => (
            <div key={phone} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: INK }}>{phone}</div>
              <div style={{ width: '22px', height: '22px', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '2px', flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z" /></svg>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '320px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: INK, lineHeight: 1.4 }}>06 Lord Trade Centre, 1st floor, F-11 Markaz, Islamabad</div>
            <div style={{ width: '22px', height: '22px', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: '2px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5Z" /></svg>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: INK }}>skinsmithisb@gmail.com</div>
            <div style={{ width: '22px', height: '22px', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '2px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" /></svg>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export function PrescriptionPreview({ hideBranding, ...rest }: PrescriptionPreviewProps) {
  if (hideBranding) return <LetterheadLayout {...rest} />;
  return <DigitalLayout {...rest} />;
}
