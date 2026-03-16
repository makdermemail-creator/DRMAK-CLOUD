'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Patient } from '@/lib/types';
import * as XLSX from 'xlsx';

// pdfjs-dist requires a worker
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PatientImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImportSuccess: () => void;
}

export function PatientImportDialog({ open, onOpenChange, onImportSuccess }: PatientImportDialogProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [file, setFile] = React.useState<File | null>(null);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [isImporting, setIsImporting] = React.useState(false);
    const [previewData, setPreviewData] = React.useState<Partial<Patient>[]>([]);
    const [error, setError] = React.useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewData([]);
            setError(null);
        }
    };

    const processExcel = async (file: File, existingMobiles: Set<string>) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

            const seenInFile = new Set<string>();
            const patients: Partial<Patient>[] = [];

            jsonData.forEach((row: any) => {
                // Extract name
                const name = row['Patient Name'] || row.Name || row.name || '';

                // Extract and sanitize mobile number
                const mobileRaw = row.Phone || row.phone || row.Mobile || row.mobile || '';
                const mobileNumber = String(mobileRaw).replace(/\D/g, '');

                // Skip if invalid or duplicate
                if (!name || !mobileNumber || existingMobiles.has(mobileNumber) || seenInFile.has(mobileNumber)) {
                    return;
                }

                // Extract age (handles "22 Years" -> 22)
                const ageRaw = row.Age || row.age || row.AGE || '';
                const age = typeof ageRaw === 'number' ? ageRaw : parseInt(String(ageRaw).replace(/\D/g, ''), 10) || 0;

                // Extract gender
                const genderRaw = String(row.Gender || row.gender || 'Other').toLowerCase();
                const gender = genderRaw.startsWith('m') ? 'Male' : genderRaw.startsWith('f') ? 'Female' : 'Other';

                // Parse Registration Date
                let registrationDate = new Date().toISOString();
                const dateRaw = row['REGISTRATION DATE'] || row['Registration Date'] || row['registration date'] || row.date || row.Date;
                if (dateRaw) {
                    if (typeof dateRaw === 'string' && dateRaw.includes('/')) {
                        const [day, month, year] = dateRaw.split('/');
                        const parsedDate = new Date(`${year}-${month}-${day}`);
                        if (!isNaN(parsedDate.getTime())) {
                            registrationDate = parsedDate.toISOString();
                        }
                    } else if (!isNaN(new Date(dateRaw).getTime())) {
                        registrationDate = new Date(dateRaw).toISOString();
                    }
                }

                patients.push({
                    name,
                    mobileNumber,
                    age,
                    gender: gender as Patient['gender'],
                    address: row.Address || row.address || '',
                    registrationDate,
                    status: (row.Status || row.status || 'Active') as Patient['status'],
                    avatarUrl: '',
                });
                seenInFile.add(mobileNumber);
            });

            if (patients.length === 0) {
                setError('No new unique patients found in the file.');
            } else {
                setPreviewData(patients);
            }
        } catch (err) {
            console.error('Excel processing error:', err);
            setError('Failed to process Excel file.');
        }
    };

    const processPDF = async (file: File, existingMobiles: Set<string>) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n';
            }

            const lines = fullText.split('\n');
            const seenInFile = new Set<string>();
            const patients: Partial<Patient>[] = [];

            lines.forEach(line => {
                const phoneMatch = line.match(/(03\d{9}|92\d{10})/);
                if (phoneMatch) {
                    const mobile = phoneMatch[0];
                    if (existingMobiles.has(mobile) || seenInFile.has(mobile)) return;

                    const namePart = line.split(mobile)[0].trim();
                    const ageMatch = line.match(/\b\d{1,2}\b/);

                    if (namePart) {
                        patients.push({
                            name: namePart,
                            mobileNumber: mobile,
                            age: ageMatch ? Number(ageMatch[0]) : 0,
                            gender: 'Other',
                            registrationDate: new Date().toISOString(),
                            status: 'Active' as Patient['status'],
                            avatarUrl: '',
                        });
                        seenInFile.add(mobile);
                    }
                }
            });

            if (patients.length === 0) {
                setError('No new unique patients found in PDF.');
            } else {
                setPreviewData(patients);
            }
        } catch (err) {
            console.error('PDF processing error:', err);
            setError('Failed to process PDF file.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleProcess = async () => {
        if (!file || !firestore) return;
        setIsProcessing(true);
        setError(null);

        try {
            // Fetch existing patient mobile numbers for deduplication
            const patientsCollection = collection(firestore, 'patients');
            const querySnapshot = await getDocs(patientsCollection);
            const existingMobiles = new Set(querySnapshot.docs.map(doc => doc.id));

            const extension = file.name.split('.').pop()?.toLowerCase();
            if (extension === 'xlsx' || extension === 'xls' || extension === 'csv') {
                await processExcel(file, existingMobiles);
            } else if (extension === 'pdf') {
                await processPDF(file, existingMobiles);
            } else {
                setError('Unsupported file type. Please use Excel (.xlsx, .xls, .csv) or PDF.');
            }
        } catch (err) {
            console.error('Processing error:', err);
            setError('An error occurred while preparing the import.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImport = async () => {
        if (!firestore || previewData.length === 0) return;
        setIsImporting(true);
        const patientsCollection = collection(firestore, 'patients');
        let successCount = 0;

        try {
            for (const patient of previewData) {
                if (patient.mobileNumber) {
                    // Use mobileNumber as ID to match existing logic
                    await setDoc(doc(patientsCollection, patient.mobileNumber), patient);
                    successCount++;
                }
            }
            toast({
                title: 'Import Complete',
                description: `Successfully imported ${successCount} patients.`
            });
            onImportSuccess();
            onOpenChange(false);
        } catch (err) {
            console.error('Import error:', err);
            toast({
                variant: 'destructive',
                title: 'Import Failed',
                description: 'An error occurred during the import process.'
            });
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Import Patients</DialogTitle>
                    <DialogDescription>
                        Upload an Excel (.xlsx, .csv) or PDF file to bulk register patients.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="patient-file">File</Label>
                        <div className="flex gap-2">
                            <Input
                                id="patient-file"
                                type="file"
                                accept=".xlsx,.xls,.csv,.pdf"
                                onChange={handleFileChange}
                                className="flex-1"
                            />
                            <Button onClick={handleProcess} disabled={!file || isProcessing}>
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Process'}
                            </Button>
                        </div>
                        {error && (
                            <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                                <AlertCircle className="h-4 w-4" /> {error}
                            </p>
                        )}
                    </div>

                    {previewData.length > 0 && (
                        <div className="border rounded-md">
                            <div className="bg-muted p-2 border-b font-medium text-sm flex justify-between">
                                <span>Preview ({previewData.length} records found)</span>
                                <span className="text-xs text-muted-foreground italic">Review before importing</span>
                            </div>
                            <div className="max-h-[300px] overflow-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-white border-b">
                                        <tr>
                                            <th className="p-2 text-left">Name</th>
                                            <th className="p-2 text-left">Mobile</th>
                                            <th className="p-2 text-left">Age</th>
                                            <th className="p-2 text-left">Gender</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {previewData.slice(0, 50).map((p, i) => (
                                            <tr key={i}>
                                                <td className="p-2">{p.name}</td>
                                                <td className="p-2">{p.mobileNumber}</td>
                                                <td className="p-2">{p.age}</td>
                                                <td className="p-2">{p.gender}</td>
                                            </tr>
                                        ))}
                                        {previewData.length > 50 && (
                                            <tr>
                                                <td colSpan={4} className="p-2 text-center text-muted-foreground italic">
                                                    Showing first 50 of {previewData.length} records...
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
                        Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={previewData.length === 0 || isImporting}>
                        {isImporting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
                        ) : (
                            <><CheckCircle2 className="mr-2 h-4 w-4" /> Import {previewData.length} Patients</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
