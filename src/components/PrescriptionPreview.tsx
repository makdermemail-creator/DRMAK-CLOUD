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

export function PrescriptionPreview({ 
  doctorName, doctorQualification, doctorSpecialization, 
  patient, vitals, chiefComplaint, diagnosis, medicines, 
  investigations, advice, followUpDates, today, hideBranding 
}: PrescriptionPreviewProps) {
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
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Clinical Details</div>
            <div style={{ fontSize: '14px', color: '#1a1a1a', lineHeight: 1.6, minHeight: chiefComplaint ? 'auto' : '80px' }}>
              {chiefComplaint}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Diagnosis / Assessment</div>
            <div style={{ fontSize: '14px', color: '#1a1a1a', lineHeight: 1.6, fontWeight: 600, minHeight: diagnosis ? 'auto' : '80px' }}>
              {diagnosis}
            </div>
          </div>
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
                <div key={date} style={{ fontWeight: 700 }}>• {(() => {
                  try {
                    return format(new Date(date), 'dd MMMM yyyy');
                  } catch {
                    return 'Invalid Date';
                  }
                })()}</div>
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
