import * as React from 'react';
import type { Patient } from '@/lib/types';
import { format } from 'date-fns';

type Vital = {
  bp: string;
  pulse: string;
  temp: string;
  weight: string;
  height: string;
};

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

function safeFormatDate(dateStr: string) {
  try { return format(new Date(dateStr), 'dd MMMM yyyy'); } catch { return ''; }
}

const GOLD = '#C9A84C';
const INK  = '#1a1a1a';

const preciseFace = "M31.2,16.8c-0.2-2.1,0.2-4.2,1.2-6.1c0.4-0.8,1.4-1,2-0.3c0.7,0.8,1.3,1.6,1.9,2.4c0.7,1,1.5,1.9,2.3,2.8c1,1.1,2.2,2.1,3.4,3c1.3,1,2.7,1.8,4.2,2.5c1.6,0.7,3.2,1.3,4.9,1.7c1.7,0.4,3.5,0.7,5.3,0.7c1.8,0,3.6-0.2,5.4-0.6c1.8-0.4,3.5-1.1,5.1-1.9c0.8-0.4,1.8,0,2,0.8c0.2,0.8,0.1,1.8-0.4,2.5c-0.8,1.3-1.8,2.4-2.8,3.5c-1.1,1-2.3,1.9-3.6,2.7c-1.3,0.8-2.7,1.5-4.2,2c-1.5,0.5-3.1,0.8-4.7,1c-1.6,0.2-3.3,0.3-4.9,0.2c-1.7-0.1-3.3-0.3-5-0.7c-1.6-0.4-3.1-1-4.6-1.7c-1.4-0.7-2.8-1.7-3.9-2.7c-0.8-0.8-1.5-1.7-2.1-2.6c-0.6-0.9-1.1-1.9-1.5-2.9C31.5,21.1,31.2,19,31.2,16.8z M50.4,14.4c-2.4,0-4.3,1.9-4.3,4.3c0,2.4,1.9,4.3,4.3,4.3c2.4,0,4.3-1.9,4.3-4.3C54.7,16.3,52.8,14.4,50.4,14.4z";

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

      {/* Top-right corner diamonds — BEHIND content */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '160px', height: '160px', pointerEvents: 'none', zIndex: 0 }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          <rect x="90"  y="-5"  width="90" height="90" transform="rotate(45 135 40)"  fill="none" stroke={GOLD} strokeWidth="5" />
          <rect x="55"  y="30"  width="90" height="90" transform="rotate(45 100 75)"  fill="#2a2a2a" />
          <rect x="20"  y="65"  width="90" height="90" transform="rotate(45 65  110)" fill="none" stroke={GOLD} strokeWidth="3.5" />
          <rect x="-15" y="100" width="90" height="90" transform="rotate(45 30  145)" fill="#333" />
        </svg>
      </div>

      {/* ── All prescription content — ABOVE decorations ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Header: Logo + Doctor info */}
        <div style={{ padding: '48px 65px 20px 55px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '70px', height: '70px' }}>
              <svg viewBox="0 0 100 100" style={{ fill: GOLD, width: '100%', height: '100%' }}>
                <path d={preciseFace} />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '4px', color: INK, lineHeight: 1 }}>SKINSMITH</div>
              <div style={{ fontSize: '12px', letterSpacing: '5px', color: '#666', marginTop: '5px', fontWeight: 500 }}>BE BETTER BE YOU</div>
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
          <div style={{ margin: '0 65px 0 55px', display: 'flex', gap: '35px', flexWrap: 'wrap', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '12px' }}>
            <div><span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#999', letterSpacing: '1px' }}>Patient: </span><span style={{ fontSize: '14px', fontWeight: 700, color: INK }}>{p.patient.name}</span></div>
            <div><span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#999', letterSpacing: '1px' }}>Age/Sex: </span><span style={{ fontSize: '14px', fontWeight: 700, color: INK }}>{p.patient.age} / {p.patient.gender}</span></div>
            <div style={{ marginLeft: 'auto' }}><span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#999', letterSpacing: '1px' }}>Contact: </span><span style={{ fontSize: '13px', fontWeight: 600, color: INK }}>{p.patient.mobileNumber}</span></div>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '20px 65px 160px 55px' }}>

          {/* Vitals */}
          {(p.vitals.bp || p.vitals.pulse || p.vitals.temp || p.vitals.weight || p.vitals.height) && (
            <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap', marginBottom: '28px', paddingBottom: '10px', borderBottom: '1px dashed #eee', color: '#555' }}>
              {p.vitals.bp     && <span style={{ fontSize: '11px' }}><strong style={{ color: GOLD }}>BP:</strong> {p.vitals.bp}</span>}
              {p.vitals.pulse  && <span style={{ fontSize: '11px' }}><strong style={{ color: GOLD }}>PULSE:</strong> {p.vitals.pulse}</span>}
              {p.vitals.temp   && <span style={{ fontSize: '11px' }}><strong style={{ color: GOLD }}>TEMP:</strong> {p.vitals.temp}</span>}
              {p.vitals.weight && <span style={{ fontSize: '11px' }}><strong style={{ color: GOLD }}>WT:</strong> {p.vitals.weight}</span>}
              {p.vitals.height && <span style={{ fontSize: '11px' }}><strong style={{ color: GOLD }}>HT:</strong> {p.vitals.height}</span>}
            </div>
          )}

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

      {/* ── Bottom-left corner diamonds — BEHIND content ── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '280px', height: '280px', pointerEvents: 'none', zIndex: 0 }}>
        <svg width="280" height="280" viewBox="0 0 280 280">
          <rect x="20"  y="155" width="115" height="115" transform="rotate(45 77 212)"  fill="#222" />
          <rect x="75"  y="100" width="115" height="115" transform="rotate(45 132 157)" fill="none" stroke={GOLD} strokeWidth="5" />
          <rect x="130" y="45"  width="115" height="115" transform="rotate(45 187 102)" fill="#2a2a2a" />
          <rect x="185" y="-10" width="115" height="115" transform="rotate(45 242 47)"  fill="none" stroke={GOLD} strokeWidth="3.5" />
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
