import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Lead } from '@/lib/types';

export const useSheetLeads = (sheetUrl: string, enabled: boolean = true) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchSheetLeads = async () => {
            // Validate URL before fetching
            if (!sheetUrl || !sheetUrl.includes('docs.google.com/spreadsheets') || !enabled) {
                setLeads([]);
                return;
            }

            setIsLoading(true);
            try {
                // Use server-side proxy to avoid CORS issues
                const proxyUrl = `/api/sheet-proxy?url=${encodeURIComponent(sheetUrl)}`;
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error("Failed to fetch sheet data");
                const text = await response.text();

                const rows = text.split('\n').filter(line => line.trim()).map(row => {
                    const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;
                    const cells = [];
                    let match;
                    while ((match = regex.exec(row)) !== null) {
                        cells.push(match[1] ? match[1].replace(/""/g, '"') : match[2]);
                    }
                    return cells.map(cell => cell?.trim() || '');
                });

                if (rows.length < 2) {
                    setLeads([]);
                    return;
                }

                const headers = rows[0].map(h => h.toLowerCase().trim());

                // Helper to score columns based on content
                const scoreColumn = (rows: string[][], checkFn: (cell: string) => boolean): number => {
                    const sampleRows = rows.slice(0, 10); // Check first 10 rows
                    let bestCol = -1;
                    let maxScore = 0;

                    if (sampleRows.length === 0) return -1;

                    const numCols = sampleRows[0].length;
                    for (let col = 0; col < numCols; col++) {
                        let score = 0;
                        let validCount = 0;
                        for (const row of sampleRows) {
                            if (row[col] && checkFn(row[col])) {
                                score++;
                            }
                            if (row[col]) validCount++;
                        }
                        // Require at least a few matches to consider it valid
                        if (score > maxScore && score >= 1) {
                            maxScore = score;
                            bestCol = col;
                        }
                    }
                    return bestCol;
                };

                const isEmail = (text: string) => /\S+@\S+\.\S+/.test(text);

                const isPhone = (text: string) => {
                    const cleaned = text.replace(/\D/g, ''); // Remove non-digits
                    // Look for at least 7 digits, or starts with 'p:'
                    return (cleaned.length > 6) || text.trim().toLowerCase().startsWith('p:');
                };

                const isProduct = (text: string) => {
                    const lower = text.toLowerCase();
                    return lower.startsWith('c:') || lower.startsWith('f:') || lower.includes('exosome') || lower.includes('hair') || lower.includes('skin') || lower.includes('lead');
                };

                // Content-based Detection
                const emailIdx = scoreColumn(rows.slice(1), isEmail);
                const contactIdx = scoreColumn(rows.slice(1), isPhone);

                // For Product, if header exists, use it, otherwise try to guess.
                let productIdx = headers.findIndex(h => h.includes('form_name') || h.includes('form_id') || h.includes('product') || h.includes('service'));
                if (productIdx === -1) {
                    productIdx = scoreColumn(rows.slice(1), isProduct);
                }
                if (productIdx === -1) {
                    productIdx = headers.findIndex(h => h.includes('campaign') || h.includes('ad set'));
                }

                // For Name
                let nameIdx = headers.findIndex(h => (h.includes('name') || h.includes('full name')) && !h.includes('campaign') && !h.includes('ad'));
                if (nameIdx === emailIdx || nameIdx === contactIdx) nameIdx = -1;

                if (nameIdx === -1) {
                    const ambiguousHeaderIdx = headers.findIndex(h => h.includes('phone') || h.includes('number'));
                    if (ambiguousHeaderIdx !== -1 && ambiguousHeaderIdx !== contactIdx && ambiguousHeaderIdx !== emailIdx) {
                        nameIdx = ambiguousHeaderIdx;
                    }
                }

                if (nameIdx === -1) {
                    nameIdx = 0; // simplistic fallback
                }

                const finalNameIdx = nameIdx;
                const finalContactIdx = contactIdx;
                const finalEmailIdx = emailIdx;
                const finalProductIdx = productIdx;

                const sheetLeads: Lead[] = rows.slice(1)
                    .filter(r => r[finalNameIdx] && r[finalNameIdx].trim())
                    .map((r, i) => ({
                        id: `sheet-${i}-${Date.now()}`,
                        name: r[finalNameIdx],
                        email: finalEmailIdx !== -1 ? r[finalEmailIdx] : '',
                        phone: r[finalContactIdx] || '',
                        product: finalProductIdx !== -1 ? r[finalProductIdx] : '',
                        status: 'New Lead',
                        source: 'Google Sheet',
                        assignedTo: '', // Not assigned in sheet usually
                        createdAt: new Date().toISOString(),
                        isOnlineOnly: true
                    }));

                setLeads(sheetLeads);
            } catch (error) {
                console.error("Sheet fetch error:", error);
                // Keep leads empty on error
            } finally {
                setIsLoading(false);
            }
        };

        fetchSheetLeads();
    }, [sheetUrl, enabled, toast]);

    return { leads, isLoading };
};
