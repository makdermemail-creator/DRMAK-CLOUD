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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GOLD = '#C9A84C';
const BLACK = '#1a1a1a';

function safeFormatDate(dateStr: string) {
  try { return format(new Date(dateStr), 'dd MMMM yyyy'); } catch { return ''; }
}

// ─── Letterhead Mode ──────────────────────────────────────────────────────────
// Content is precisely positioned to land in the blank middle area of the
// pre-printed physical SkinSmith letterhead.
//
// Physical letterhead zones (A4 = 297mm tall):
//   Top 40mm   → pre-printed: SkinSmith logo (left) + diamond motif (right)
//   Middle      → blank white space  ← all content goes here
//   Bottom 63mm → pre-printed: diamond motif (left) + contact info (right)

function LetterheadLayout({
  doctorName, doctorQualification, doctorSpecialization,
  patient, vitals, chiefComplaint, diagnosis, medicines,
  investigations, advice, followUpDates, today,
}: Omit<PrescriptionPreviewProps, 'hideBranding'>) {
  const namedMeds = medicines.filter(m => m.name);

  return (
    <div style={{
      fontFamily: "'Inter', 'Arial', sans-serif",
      width: '210mm',
      height: '297mm',
      boxSizing: 'border-box',
      // ↓ these paddings keep content away from pre-printed header & footer
      paddingTop: '40mm',
      paddingBottom: '63mm',
      paddingLeft: '16mm',
      paddingRight: '16mm',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'transparent',
      color: BLACK,
    }}>

      {/* ── Doctor + Date ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '3mm',
        paddingBottom: '3mm',
        borderBottom: '0.5px solid #ccc',
      }}>
        <div>
          <div style={{ fontSize: '14pt', fontWeight: 800, lineHeight: 1.2 }}>{doctorName}</div>
          {doctorQualification && (
            <div style={{ fontSize: '8pt', color: '#555', marginTop: '1mm' }}>{doctorQualification}</div>
          )}
          {doctorSpecialization && (
            <div style={{ fontSize: '8pt', color: GOLD, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.8mm' }}>
              {doctorSpecialization}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '7pt', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</div>
          <div style={{ fontSize: '10pt', fontWeight: 700, marginTop: '0.8mm' }}>{today}</div>
        </div>
      </div>

      {/* ── Patient Info ──────────────────────────────────────────────────── */}
      {patient && (
        <div style={{
          display: 'flex',
          gap: '18px',
          borderBottom: '0.5px solid #eee',
          paddingBottom: '2.5mm',
          marginBottom: '3mm',
          flexWrap: 'wrap',
        }}>
          <div>
            <span style={{ fontSize: '7pt', textTransform: 'uppercase', color: '#bbb', letterSpacing: '0.8px' }}>Patient  </span>
            <span style={{ fontSize: '11pt', fontWeight: 700 }}>{patient.name}</span>
          </div>
          <div>
            <span style={{ fontSize: '7pt', textTransform: 'uppercase', color: '#bbb', letterSpacing: '0.8px' }}>Age / Sex  </span>
            <span style={{ fontSize: '11pt', fontWeight: 700 }}>{patient.age} / {patient.gender}</span>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ fontSize: '7pt', textTransform: 'uppercase', color: '#bbb', letterSpacing: '0.8px' }}>Contact  </span>
            <span style={{ fontSize: '10pt', fontWeight: 600 }}>{patient.mobileNumber}</span>
          </div>
        </div>
      )}

      {/* ── Vitals ────────────────────────────────────────────────────────── */}
      {(vitals.bp || vitals.pulse || vitals.temp || vitals.weight || vitals.height) && (
        <div style={{
          display: 'flex',
          gap: '14px',
          marginBottom: '3mm',
          paddingBottom: '2.5mm',
          borderBottom: '0.5px solid #eee',
          flexWrap: 'wrap',
        }}>
          {vitals.bp     && <span style={{ fontSize: '9pt' }}><strong style={{ color: GOLD, fontSize: '7.5pt' }}>BP </strong>{vitals.bp}</span>}
          {vitals.pulse  && <span style={{ fontSize: '9pt' }}><strong style={{ color: GOLD, fontSize: '7.5pt' }}>Pulse </strong>{vitals.pulse}</span>}
          {vitals.temp   && <span style={{ fontSize: '9pt' }}><strong style={{ color: GOLD, fontSize: '7.5pt' }}>Temp </strong>{vitals.temp}</span>}
          {vitals.weight && <span style={{ fontSize: '9pt' }}><strong style={{ color: GOLD, fontSize: '7.5pt' }}>Wt </strong>{vitals.weight}</span>}
          {vitals.height && <span style={{ fontSize: '9pt' }}><strong style={{ color: GOLD, fontSize: '7.5pt' }}>Ht </strong>{vitals.height}</span>}
        </div>
      )}

      {/* ── Chief Complaint + Diagnosis ───────────────────────────────────── */}
      {(chiefComplaint || diagnosis) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '3mm' }}>
          {chiefComplaint && (
            <div>
              <div style={{ fontSize: '6.5pt', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '1.5mm' }}>Chief Complaint</div>
              <div style={{ fontSize: '10pt', lineHeight: 1.55 }}>{chiefComplaint}</div>
            </div>
          )}
          {diagnosis && (
            <div>
              <div style={{ fontSize: '6.5pt', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '1.5mm' }}>Diagnosis</div>
              <div style={{ fontSize: '10pt', lineHeight: 1.55, fontWeight: 600 }}>{diagnosis}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Rx — Medicines ───────────────────────────────────────────────── */}
      <div style={{ borderTop: '0.5px solid #ccc', paddingTop: '3mm', marginBottom: '3mm' }}>
        <div style={{ fontSize: '6.5pt', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '2.5mm' }}>
          Rx — Medicines
        </div>
        {namedMeds.length === 0 && (
          <div style={{ fontSize: '9pt', color: '#ccc', fontStyle: 'italic' }}>No medicines prescribed.</div>
        )}
        {namedMeds.map((med, i) => (
          <div key={med.id} style={{ marginBottom: '2.5mm', paddingLeft: '5px', borderLeft: `2px solid ${GOLD}` }}>
            <div style={{ fontSize: '11pt', fontWeight: 700 }}>
              {i + 1}.&nbsp;{med.name}
              <span style={{ fontSize: '8.5pt', fontWeight: 400, color: '#666', marginLeft: '5px' }}>
                {med.dosage} · {med.frequency} · {med.duration}
              </span>
            </div>
            {med.instructions && (
              <div style={{ fontSize: '8pt', fontStyle: 'italic', color: '#888', marginTop: '0.8mm', paddingLeft: '12px' }}>
                — {med.instructions}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Investigations + Advice ───────────────────────────────────────── */}
      {(investigations || advice) && (
        <div style={{ borderTop: '0.5px solid #eee', paddingTop: '3mm', marginBottom: '3mm' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {investigations && (
              <div>
                <div style={{ fontSize: '6.5pt', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '1.5mm' }}>Investigations / Tests</div>
                <div style={{ fontSize: '9pt', color: '#333', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{investigations}</div>
              </div>
            )}
            {advice && (
              <div>
                <div style={{ fontSize: '6.5pt', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '1.5mm' }}>Advice / Instructions</div>
                <div style={{ fontSize: '9pt', color: '#333', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{advice}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Follow-up ─────────────────────────────────────────────────────── */}
      {followUpDates.length > 0 && (
        <div style={{ marginBottom: '3mm', paddingLeft: '5px', borderLeft: `2px solid ${GOLD}` }}>
          <div style={{ fontSize: '6.5pt', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '1.5mm' }}>Follow-up</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {followUpDates.map(d => (
              <span key={d} style={{ fontSize: '9.5pt', fontWeight: 700 }}>• {safeFormatDate(d)}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Spacer pushes signature to bottom of content area ────────────── */}
      <div style={{ flex: 1 }} />

      {/* ── Signature ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ textAlign: 'center', minWidth: '140px' }}>
          <div style={{ height: '32px' }} />
          <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '4px' }}>
            <div style={{ fontSize: '10pt', fontWeight: 800 }}>{doctorName}</div>
            <div style={{ fontSize: '7pt', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>Signature</div>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── Full Digital / Branding Mode ─────────────────────────────────────────────

export function PrescriptionPreview({
  doctorName, doctorQualification, doctorSpecialization,
  patient, vitals, chiefComplaint, diagnosis, medicines,
  investigations, advice, followUpDates, today, hideBranding,
}: PrescriptionPreviewProps) {

  // Route to the letterhead layout when printing on physical stationery
  if (hideBranding) {
    return (
      <LetterheadLayout
        doctorName={doctorName}
        doctorQualification={doctorQualification}
        doctorSpecialization={doctorSpecialization}
        patient={patient}
        vitals={vitals}
        chiefComplaint={chiefComplaint}
        diagnosis={diagnosis}
        medicines={medicines}
        investigations={investigations}
        advice={advice}
        followUpDates={followUpDates}
        today={today}
      />
    );
  }

  // ── Full digital branding mode (unchanged) ────────────────────────────────

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
      <div style={{
        position: 'absolute', top: '45%', left: '50%',
        transform: 'translate(-50%, -45%)',
        opacity: 0.025, pointerEvents: 'none', zIndex: 0
      }}>
        <svg width="550" height="550" viewBox="0 0 100 100" style={{ fill: GOLD }}>
          <path d={preciseFace} />
        </svg>
      </div>

      {/* ── Top-Right Corner Motif ── */}
      <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '320px', height: '320px', pointerEvents: 'none' }}>
        <svg width="320" height="320" viewBox="0 0 320 320">
          <rect x="230" y="30" width="115" height="115" transform="rotate(45 287 87)" fill="none" stroke={GOLD} strokeWidth="6" />
          <rect x="175" y="85" width="115" height="115" transform="rotate(45 232 142)" fill="#2a2a2a" />
          <rect x="120" y="140" width="115" height="115" transform="rotate(45 177 197)" fill="none" stroke={GOLD} strokeWidth="4" />
          <rect x="65"  y="195" width="115" height="115" transform="rotate(45 122 252)" fill="#333" />
        </svg>
      </div>

      {/* ── Header ── */}
      <div style={{ padding: '60px 70px 40px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '80px', height: '80px' }}>
            <svg viewBox="0 0 100 100" style={{ fill: GOLD, width: '100%', height: '100%' }}>
              <path d={preciseFace} />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '38px', fontWeight: 900, letterSpacing: '4px', color: BLACK, lineHeight: 1 }}>SKINSMITH</div>
            <div style={{ fontSize: '13px', letterSpacing: '5px', color: '#666', marginTop: '6px', fontWeight: 500 }}>BE BETTER BE YOU</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', marginTop: '10px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: BLACK }}>Date: {today}</div>
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: BLACK }}>{doctorName}</div>
            <div style={{ fontSize: '13px', color: '#555', fontWeight: 500, marginTop: '2px' }}>{doctorQualification}</div>
            <div style={{ fontSize: '13px', color: GOLD, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>{doctorSpecialization}</div>
          </div>
        </div>
      </div>

      {/* ── Patient Info ── */}
      {patient && (
        <div style={{ margin: '10px 70px', display: 'flex', gap: '40px', borderBottom: '1px solid #eee', paddingBottom: '15px', zIndex: 1, position: 'relative' }}>
          <div>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#999', letterSpacing: '1px' }}>Patient: </span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: BLACK }}>{patient.name}</span>
          </div>
          <div>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#999', letterSpacing: '1px' }}>Age/Sex: </span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: BLACK }}>{patient.age} / {patient.gender}</span>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#999', letterSpacing: '1px' }}>ID: </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: BLACK }}>{patient.mobileNumber}</span>
          </div>
        </div>
      )}

      {/* ── Main Content Body ── */}
      <div style={{ padding: '30px 70px 180px 70px', minHeight: '150mm', position: 'relative', zIndex: 1 }}>

        {/* Vitals */}
        {(vitals.bp || vitals.pulse || vitals.temp || vitals.weight || vitals.height) && (
          <div style={{ display: 'flex', gap: '30px', marginBottom: '35px', color: '#666', borderBottom: '1px double #eee', paddingBottom: '10px' }}>
            {vitals.bp     && <span style={{ fontSize: '11px' }}><strong style={{ color: GOLD }}>BP:</strong> {vitals.bp}</span>}
            {vitals.pulse  && <span style={{ fontSize: '11px' }}><strong style={{ color: GOLD }}>PULSE:</strong> {vitals.pulse}</span>}
            {vitals.temp   && <span style={{ fontSize: '11px' }}><strong style={{ color: GOLD }}>TEMP:</strong> {vitals.temp}</span>}
            {vitals.weight && <span style={{ fontSize: '11px' }}><strong style={{ color: GOLD }}>WT:</strong> {vitals.weight}</span>}
            {vitals.height && <span style={{ fontSize: '11px' }}><strong style={{ color: GOLD }}>HT:</strong> {vitals.height}</span>}
          </div>
        )}

        {/* Complaints & Diagnosis */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Clinical Details</div>
            <div style={{ fontSize: '14px', color: BLACK, lineHeight: 1.6, minHeight: chiefComplaint ? 'auto' : '80px' }}>{chiefComplaint}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Diagnosis / Assessment</div>
            <div style={{ fontSize: '14px', color: BLACK, lineHeight: 1.6, fontWeight: 600, minHeight: diagnosis ? 'auto' : '80px' }}>{diagnosis}</div>
          </div>
        </div>

        {/* Medicines */}
        <div style={{ marginBottom: '40px' }}>
          {medicines.filter(m => m.name).map((med, i) => (
            <div key={med.id} style={{ marginBottom: '20px', paddingLeft: '10px', borderLeft: `3px solid ${GOLD}` }}>
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

        {/* Investigations + Advice */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', marginTop: '40px' }}>
          {investigations && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Investigations</div>
              <div style={{ fontSize: '13px', color: '#333', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{investigations}</div>
            </div>
          )}
          {advice && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Special Advice</div>
              <div style={{ fontSize: '13px', color: '#333', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{advice}</div>
            </div>
          )}
        </div>

        {/* Follow-up */}
        {followUpDates.length > 0 && (
          <div style={{ marginTop: '40px', fontSize: '13px', color: BLACK, borderLeft: `2px solid ${GOLD}`, paddingLeft: '15px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '5px' }}>Follow-up Appointments</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
              {followUpDates.map(date => (
                <div key={date} style={{ fontWeight: 700 }}>• {safeFormatDate(date)}</div>
              ))}
            </div>
          </div>
        )}

        {/* Signature */}
        <div style={{ position: 'absolute', bottom: '20px', right: '70px', textAlign: 'center', minWidth: '200px' }}>
          <div style={{ height: '60px' }}></div>
          <div style={{ borderTop: '2px solid #1a1a1a', paddingTop: '10px' }}>
            <div style={{ fontSize: '16px', fontWeight: 900 }}>{doctorName}</div>
            <div style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>Signature</div>
          </div>
        </div>
      </div>

      {/* ── Bottom-Left Corner Motif ── */}
      <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '380px', height: '380px', pointerEvents: 'none' }}>
        <svg width="380" height="380" viewBox="0 0 380 380">
          <rect x="40"  y="220" width="135" height="135" transform="rotate(45 107 287)" fill="#222" />
          <rect x="110" y="150" width="135" height="135" transform="rotate(45 177 217)" fill="none" stroke={GOLD} strokeWidth="6" />
          <rect x="180" y="80"  width="135" height="135" transform="rotate(45 247 147)" fill="#2a2a2a" />
          <rect x="250" y="10"  width="135" height="135" transform="rotate(45 317 77)"  fill="none" stroke={GOLD} strokeWidth="4" />
        </svg>
      </div>

      {/* ── Footer ── */}
      <div style={{ position: 'absolute', bottom: '0px', right: '0px', padding: '50px 70px', zIndex: 2 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end', textAlign: 'right' }}>
          {['+92 333 0477704', '+92 333 3336683'].map(phone => (
            <div key={phone} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: BLACK }}>{phone}</div>
              <div style={{ width: '24px', height: '24px', backgroundColor: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '2px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z" />
                </svg>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '350px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: BLACK, lineHeight: 1.4 }}>06 Lord Trade Centre, 1st floor, F-11 Markaz, Islamabad</div>
            <div style={{ width: '24px', height: '24px', backgroundColor: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: '2px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5Z" />
              </svg>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: BLACK }}>skinsmithisb@gmail.com</div>
            <div style={{ width: '24px', height: '24px', backgroundColor: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '2px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
