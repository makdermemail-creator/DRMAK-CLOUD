'use client';

import * as React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Patient } from '@/lib/types';
import { Search, Plus, Trash2, Printer, CheckCircle2, CircleDollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"


// Define PharmacyItem type based on typical app structure (or adjust if needed)
interface PharmacyItem {
    id: string;
    name: string;
    sellingPrice: number;
    quantity: number;
    rack?: string;
}

interface BillItem {
    id: string;
    name: string;
    type: 'procedure' | 'pharmacy' | 'custom';
    price: number;
    qty: number;
}

interface Reimbursement {
    id: string;
    description: string;
    amount: number;
}

const COMMON_PROCEDURES = [
    { id: 'proc-1', name: 'Standard Consultation', price: 1500 },
    { id: 'proc-2', name: 'Follow-up Consultation', price: 1000 },
    { id: 'proc-3', name: 'Laser Hair Removal (Face)', price: 5000 },
    { id: 'proc-4', name: 'HydraFacial', price: 8000 },
    { id: 'proc-5', name: 'Acne Treatment', price: 3000 },
    { id: 'proc-6', name: 'Botox (Per Unit)', price: 500 },
];

export default function BillingPage() {
    const { toast } = useToast();
    const firestore = useFirestore();

    // Fetch Data
    const patientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'patients') : null, [firestore]);
    const pharmacyQuery = useMemoFirebase(() => firestore ? collection(firestore, 'pharmacy') : null, [firestore]);
    const proceduresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'procedures') : null, [firestore]);

    const { data: patients } = useCollection<Patient>(patientsQuery);
    const { data: pharmacyItems } = useCollection<PharmacyItem>(pharmacyQuery);
    const { data: dynamicProcedures } = useCollection<any>(proceduresQuery); // Using any temporarily to avoid circular deps with ProceduresPage

    // State
    const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);
    const [patientSearch, setPatientSearch] = React.useState('');

    const [billItems, setBillItems] = React.useState<BillItem[]>([]);
    const [reimbursements, setReimbursements] = React.useState<Reimbursement[]>([]);
    const [discountType, setDiscountType] = React.useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = React.useState<number>(0);
    const [paymentMethod, setPaymentMethod] = React.useState<'Cash' | 'Card' | 'Online' | 'Nill' | ''>('');

    // Custom Item Temp State
    const [customName, setCustomName] = React.useState('');
    const [customPrice, setCustomPrice] = React.useState('');

    // Reimbursement Temp State
    const [reimbursementName, setReimbursementName] = React.useState('');
    const [reimbursementAmount, setReimbursementAmount] = React.useState('');

    const filteredPatients = React.useMemo(() => {
        if (!patients || !patientSearch) return [];
        const term = patientSearch.toLowerCase();
        return patients.filter(p =>
            p.name.toLowerCase().includes(term) ||
            p.mobileNumber.includes(term)
        ).slice(0, 5); // Limit suggestions
    }, [patients, patientSearch]);

    const addProcedure = (procId: string) => {
        // Check dynamic procedures first, then fallback to common (for legacy support during transition if needed, but we'll prioritize dynamic)
        const procedure = dynamicProcedures?.find(p => p.id === procId) || COMMON_PROCEDURES.find(p => p.id === procId);
        if (procedure) {
            setBillItems(prev => {
                const existing = prev.find(i => i.id === procedure.id);
                if (existing) {
                    return prev.map(i => i.id === procedure.id ? { ...i, qty: i.qty + 1 } : i);
                }
                return [...prev, { id: procedure.id, name: procedure.name, type: 'procedure', price: Number(procedure.price), qty: 1 }];
            });
        }
    };

    const addPharmacyItem = (itemId: string) => {
        const item = pharmacyItems?.find(p => p.id === itemId);
        if (item) {
            if (item.quantity <= 0) {
                toast({ variant: 'destructive', title: 'Out of Stock', description: `${item.name} is currently out of stock.` });
                return;
            }

            setBillItems(prev => {
                const existing = prev.find(i => i.id === item.id);
                if (existing) {
                    if (existing.qty >= item.quantity) {
                        toast({ variant: 'destructive', title: 'Insufficient Stock', description: `Only ${item.quantity} units of ${item.name} are available.` });
                        return prev;
                    }
                    return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
                }
                return [...prev, { id: item.id, name: item.name, type: 'pharmacy', price: Number(item.sellingPrice) || 0, qty: 1 }];
            });
        }
    };

    const addCustomItem = () => {
        if (!customName || !customPrice) return;
        const price = parseFloat(customPrice);
        if (isNaN(price)) return;

        setBillItems(prev => [...prev, {
            id: `custom-${Date.now()}`,
            name: customName,
            type: 'custom',
            price: price,
            qty: 1
        }]);
        setCustomName('');
        setCustomPrice('');
    };

    const removeItem = (id: string) => {
        setBillItems(prev => prev.filter(i => i.id !== id));
    };

    const updateQty = (id: string, delta: number) => {
        setBillItems(prev => {
            const itemToUpdate = prev.find(i => i.id === id);
            if (!itemToUpdate) return prev;

            let newQty = Math.max(1, itemToUpdate.qty + delta);

            // Stock Validation for Pharmacy items
            if (itemToUpdate.type === 'pharmacy') {
                const inventoryItem = pharmacyItems?.find(p => p.id === itemToUpdate.id);
                if (inventoryItem && newQty > inventoryItem.quantity) {
                    toast({ variant: 'destructive', title: 'Insufficient Stock', description: `Only ${inventoryItem.quantity} units of ${inventoryItem.name} are available in inventory.` });
                    newQty = inventoryItem.quantity; // Cap at max available
                }
            }

            return prev.map(i => {
                if (i.id === id) {
                    return { ...i, qty: newQty };
                }
                return i;
            });
        });
    };

    const addReimbursement = () => {
        if (!reimbursementName || !reimbursementAmount) return;
        const amount = parseFloat(reimbursementAmount);
        if (isNaN(amount)) return;

        setReimbursements(prev => [...prev, {
            id: `reimb-${Date.now()}`,
            description: reimbursementName,
            amount: amount
        }]);
        setReimbursementName('');
        setReimbursementAmount('');
    };

    const removeReimbursement = (id: string) => {
        setReimbursements(prev => prev.filter(r => r.id !== id));
    };

    const addProcedureReturn = (procId: string) => {
        const procedure = dynamicProcedures?.find(p => p.id === procId) || COMMON_PROCEDURES.find(p => p.id === procId);
        if (procedure) {
            setReimbursements(prev => [...prev, {
                id: `reimb-proc-${Date.now()}`,
                description: procedure.name,
                amount: Number(procedure.price)
            }]);
        }
    };

    const addPharmacyReturn = (itemId: string) => {
        const item = pharmacyItems?.find(p => p.id === itemId);
        if (item) {
            setReimbursements(prev => [...prev, {
                id: `reimb-pharm-${Date.now()}`,
                description: item.name,
                amount: Number(item.sellingPrice) || 0
            }]);
        }
    };

    // Calculations
    const subTotal = billItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountAmount = discountType === 'percentage' ? (subTotal * (discountValue / 100)) : discountValue;
    const reimbursementTotal = reimbursements.reduce((sum, r) => sum + r.amount, 0);
    const taxableAmount = Math.max(0, subTotal - discountAmount - reimbursementTotal);
    const taxRate = paymentMethod === 'Cash' ? 0.18 : (paymentMethod === 'Card' || paymentMethod === 'Online') ? 0.05 : 0;
    // Note: paymentMethod === 'Nill' or '' will result in taxRate 0
    const taxAmount = taxableAmount * taxRate;
    const grandTotal = Math.max(0, taxableAmount + taxAmount);

    const handlePrint = () => {
        if (billItems.length === 0) {
            toast({ variant: 'destructive', title: 'No Items', description: 'Please add at least one item to the bill before printing.' });
            return;
        }

        if (!paymentMethod) {
            toast({ variant: 'destructive', title: 'Payment Method Required', description: 'Please select a payment method before printing.' });
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast({ variant: 'destructive', title: 'Popup Blocked', description: 'Please allow popups for this site to print bills.' });
            return;
        }

        const itemsRows = billItems.map(item => `
            <tr>
                <td style="padding:10px 8px; border-bottom:1px solid #eee;">
                    <div style="font-weight:600;">${item.name}</div>
                    <div style="font-size:10px;color:#888;text-transform:uppercase;">${item.type}</div>
                </td>
                <td style="padding:10px 8px; border-bottom:1px solid #eee; text-align:center;">${item.qty}</td>
                <td style="padding:10px 8px; border-bottom:1px solid #eee; text-align:right;">${(item.price * item.qty).toLocaleString()} Rs</td>
            </tr>
        `).join('');

        const reimbursementRows = reimbursements.map(r => `
            <tr style="color: #c00;">
                <td style="padding:10px 8px; border-bottom:1px solid #eee;">
                    <div style="font-weight:600;">RETURN: ${r.description}</div>
                    <div style="font-size:10px;text-transform:uppercase;">Reimbursement</div>
                </td>
                <td style="padding:10px 8px; border-bottom:1px solid #eee; text-align:center;">1</td>
                <td style="padding:10px 8px; border-bottom:1px solid #eee; text-align:right;">- ${r.amount.toLocaleString()} Rs</td>
            </tr>
        `).join('');

        const receiptHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>Receipt - ${selectedPatient?.name || 'Guest'}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; font-size: 13px; color: #222; background: #fff; padding: 32px; max-width: 600px; margin: 0 auto; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 16px; margin-bottom: 20px; }
                    .header h1 { font-size: 22px; font-weight: bold; }
                    .header p { color: #555; font-size: 12px; margin-top: 4px; }
                    .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f9f9f9; border: 1px solid #eee; border-radius: 6px; padding: 14px; margin-bottom: 20px; }
                    .patient-grid .label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.05em; }
                    .patient-grid .value { font-weight: 600; margin-top: 2px; }
                    .patient-grid .right { text-align: right; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
                    thead tr { border-bottom: 2px solid #333; }
                    thead th { font-size: 11px; text-transform: uppercase; color: #555; padding: 8px; text-align: left; font-weight: 600; }
                    thead th:nth-child(2) { text-align: center; }
                    thead th:nth-child(3) { text-align: right; }
                    .totals { border-top: 2px solid #333; padding-top: 12px; }
                    .totals .row { display: flex; justify-content: space-between; padding: 4px 0; color: #555; }
                    .totals .grand { display: flex; justify-content: space-between; padding-top: 12px; border-top: 1px solid #ccc; margin-top: 8px; font-size: 16px; font-weight: bold; color: #111; }
                    .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 16px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>SkinSmith Clinic</h1>
                    <p>Payment Receipt</p>
                    <p style="margin-top:6px;">Date: ${new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div class="patient-grid">
                    <div>
                        <div class="label">Patient Name</div>
                        <div class="value">${selectedPatient?.name || '—'}</div>
                    </div>
                    <div class="right">
                        <div class="label">Mobile Number</div>
                        <div class="value">${selectedPatient?.mobileNumber || '—'}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th style="text-align:center;">Qty</th>
                            <th style="text-align:right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                        ${reimbursementRows}
                    </tbody>
                </table>

                <div class="totals">
                    <div class="row"><span>Subtotal</span><span>${subTotal.toLocaleString()} Rs</span></div>
                    ${discountValue > 0 ? `<div class="row"><span>Discount ${discountType === 'percentage' ? `(${discountValue}%)` : ''}</span><span>- ${discountAmount.toLocaleString()} Rs</span></div>` : ''}
                    ${reimbursementTotal > 0 ? `<div class="row" style="color: #c00;"><span>Reimbursements</span><span>- ${reimbursementTotal.toLocaleString()} Rs</span></div>` : ''}
                    <div class="row"><span>Tax (${paymentMethod} - ${(taxRate * 100).toFixed(0)}%)</span><span>${taxAmount.toLocaleString()} Rs</span></div>
                    <div class="grand"><span>Total Amount</span><span>${grandTotal.toLocaleString()} Rs</span></div>
                </div>

                <div class="footer">
                    <p style="font-weight: 600; color: #333; margin-bottom: 4px;">SkinSmith Clinic</p>
                    <p>1st Floor, Lord Trade Centre, 06, F-11 Markaz Islamabad</p>
                    <p>Mobile: +92333 0477704 | Landline: 0518748123</p>
                    <p style="margin-top: 12px; font-weight: bold; color: #333; text-transform: uppercase; letter-spacing: 1px;">No Refund and Exchange Policy</p>
                    <p style="margin-top: 12px; font-style: italic; color: #888;">Thank you for your trust in our services.</p>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(receiptHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const handleSaveBill = () => {
        if (!firestore || !selectedPatient || billItems.length === 0) return;

        if (!paymentMethod) {
            toast({ variant: 'destructive', title: 'Payment Method Required', description: 'Please select a payment method before saving.' });
            return;
        }

        // Create a comprehensive bill record in a new 'billingRecords' collection
        const billData = {
            patientId: selectedPatient.id,
            patientName: selectedPatient.name,
            patientMobile: selectedPatient.mobileNumber,
            items: billItems,
            reimbursements,
            subTotal,
            discountType,
            discountValue,
            discountAmount,
            reimbursementTotal,
            taxRate,
            taxAmount,
            grandTotal,
            paymentMethod,
            timestamp: new Date().toISOString(),
            status: 'Paid'
        };

        // Deduct stock for pharmacy items
        billItems.forEach(item => {
            if (item.type === 'pharmacy') {
                const inventoryItem = pharmacyItems?.find(p => p.id === item.id);
                if (inventoryItem) {
                    const newQuantity = Math.max(0, inventoryItem.quantity - item.qty);
                    updateDocumentNonBlocking(doc(firestore, 'pharmacy', inventoryItem.id), { quantity: newQuantity });
                }
            }
        });

        addDocumentNonBlocking(collection(firestore, 'billingRecords'), billData);

        toast({
            title: 'Bill Saved',
            description: 'The bill has been successfully saved to the records.',
        });
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 h-full p-4 print:p-0">

            {/* LEFT COLUMN: CONTROLS (Hidden when printing) */}
            <div className="w-full md:w-1/2 lg:w-[45%] flex flex-col gap-6 print:hidden space-y-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Billing & Invoicing</h2>
                    <p className="text-muted-foreground">Search patient and add items to generate a bill.</p>
                </div>

                {/* Patient Selection */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2"><Search className="h-4 w-4" /> Patient Selection</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedPatient ? (
                            <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                <div>
                                    <p className="font-semibold">{selectedPatient.name}</p>
                                    <p className="text-xs text-muted-foreground">{selectedPatient.mobileNumber}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>Change</Button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or number..."
                                    className="pl-9"
                                    value={patientSearch}
                                    onChange={(e) => setPatientSearch(e.target.value)}
                                />
                                {patientSearch && filteredPatients.length > 0 && (
                                    <div className="absolute top-11 left-0 right-0 bg-background border rounded-md shadow-lg z-10 max-h-[200px] overflow-y-auto">
                                        {filteredPatients.map(p => (
                                            <div
                                                key={p.id}
                                                className="p-3 hover:bg-muted cursor-pointer border-b last:border-0"
                                                onClick={() => {
                                                    setSelectedPatient(p);
                                                    setPatientSearch('');
                                                }}
                                            >
                                                <p className="font-semibold text-sm">{p.name}</p>
                                                <p className="text-xs text-muted-foreground">{p.mobileNumber}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Item Addition — locked until patient is selected */}
                <Card className="flex-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Add Items
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        {/* Lock Banner */}
                        {!selectedPatient && (
                            <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3 mb-2">
                                <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                                    <Search className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Patient Required</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-400">Please search and select a patient above before adding items to the bill.</p>
                                </div>
                            </div>
                        )}

                        <div className={`space - y - 4 transition - opacity duration - 200 ${!selectedPatient ? 'opacity-40 pointer-events-none select-none' : ''} `}>

                            <div className="space-y-1.5">
                                <Label>Payment Method</Label>
                                <Select onValueChange={(value: any) => setPaymentMethod(value)} value={paymentMethod} disabled={!selectedPatient}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select payment method..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Cash">Cash (18% Tax)</SelectItem>
                                        <SelectItem value="Card">Card (5% Tax)</SelectItem>
                                        <SelectItem value="Online">Online Transfer (5% Tax)</SelectItem>
                                        <SelectItem value="Nill">Nill (0% Tax)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator className="my-2" />

                            <div className="space-y-1.5">
                                <Label>Procedures</Label>
                                <Select onValueChange={addProcedure} value="" disabled={!selectedPatient}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a procedure..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* Render dynamic procedures first */}
                                        {dynamicProcedures && dynamicProcedures.length > 0 ? (
                                            dynamicProcedures.map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name} - {p.price} Rs
                                                </SelectItem>
                                            ))
                                        ) : (
                                            /* Fallback to common if empty */
                                            COMMON_PROCEDURES.map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name} - {p.price} Rs
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Pharmacy Items</Label>
                                <Select onValueChange={addPharmacyItem} value="" disabled={!selectedPatient}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select pharmacy item..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pharmacyItems?.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.rack ? `[Rack ${p.rack}]` : ''}{p.name} - {p.sellingPrice} Rs (Stock: {p.quantity})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-1.5">
                                <Label>Custom Item</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Description"
                                        className="flex-1"
                                        value={customName}
                                        onChange={e => setCustomName(e.target.value)}
                                        disabled={!selectedPatient}
                                    />
                                    <Input
                                        placeholder="Price (Rs)"
                                        type="number"
                                        className="w-24"
                                        value={customPrice}
                                        onChange={e => setCustomPrice(e.target.value)}
                                        disabled={!selectedPatient}
                                    />
                                    <Button variant="secondary" onClick={addCustomItem} disabled={!selectedPatient}>Add</Button>
                                </div>
                            </div>

                            {/* Flexible Discount Selector */}
                            <div className="space-y-1.5 pt-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <CircleDollarSign className="h-3 w-3" /> Set Bill Discount
                                </Label>
                                <Tabs defaultValue="percentage" value={discountType} onValueChange={(v: any) => {
                                    setDiscountType(v);
                                    setDiscountValue(0);
                                }}>
                                    <TabsList className="grid w-full grid-cols-2 h-8">
                                        <TabsTrigger value="percentage" className="text-[10px]">Percentage %</TabsTrigger>
                                        <TabsTrigger value="fixed" className="text-[10px]">Fixed Rs</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="percentage" className="mt-1.5">
                                        <div className="flex items-center justify-between p-2 border border-dashed rounded-md bg-muted/30">
                                            <div className="text-[10px] text-muted-foreground">Apply % discount</div>
                                            <div className="flex items-center gap-1">
                                                <Input
                                                    type="number"
                                                    className="h-7 w-16 text-right text-xs font-bold"
                                                    value={discountValue || ''}
                                                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                                                    placeholder="0"
                                                    disabled={!selectedPatient}
                                                    min="0"
                                                    max="100"
                                                />
                                                <span className="font-bold text-sm text-muted-foreground">%</span>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="fixed" className="mt-1.5">
                                        <div className="flex items-center justify-between p-2 border border-dashed rounded-md bg-muted/30">
                                            <div className="text-[10px] text-muted-foreground">Apply flat discount (Rs)</div>
                                            <div className="flex items-center gap-1">
                                                <Input
                                                    type="number"
                                                    className="h-7 w-20 text-right text-xs font-bold"
                                                    value={discountValue || ''}
                                                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                                                    placeholder="0"
                                                    disabled={!selectedPatient}
                                                    min="0"
                                                />
                                                <span className="font-bold text-[10px] text-muted-foreground">Rs</span>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>

                            <Separator className="my-2" />

                            {/* Bill Reimbursement Section */}
                            <div className="space-y-2 pt-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-red-600 flex items-center gap-2">
                                    <Trash2 className="h-3 w-3" /> Bill Reimbursement / Returns
                                </Label>
                                <div className="space-y-2 bg-red-50/50 dark:bg-red-950/10 p-3 rounded-md border border-red-100 dark:border-red-900/30">
                                    <p className="text-[10px] text-muted-foreground mb-2">Select existing items or enter manually to add a return.</p>

                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-red-700">Return Procedure</Label>
                                            <Select onValueChange={addProcedureReturn} value="" disabled={!selectedPatient}>
                                                <SelectTrigger className="h-8 text-xs border-red-100 bg-white/50">
                                                    <SelectValue placeholder="Select procedure..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {dynamicProcedures && dynamicProcedures.length > 0 ? (
                                                        dynamicProcedures.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                        ))
                                                    ) : (
                                                        COMMON_PROCEDURES.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-red-700">Return Product</Label>
                                            <Select onValueChange={addPharmacyReturn} value="" disabled={!selectedPatient}>
                                                <SelectTrigger className="h-8 text-xs border-red-100 bg-white/50">
                                                    <SelectValue placeholder="Select product..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {pharmacyItems?.map(p => (
                                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 border-t border-red-100 pt-3">
                                        <Input
                                            placeholder="Return reason..."
                                            className="flex-1 h-8 text-xs"
                                            value={reimbursementName}
                                            onChange={e => setReimbursementName(e.target.value)}
                                            disabled={!selectedPatient}
                                        />
                                        <Input
                                            placeholder="Amount"
                                            type="number"
                                            className="w-20 h-8 text-xs"
                                            value={reimbursementAmount}
                                            onChange={e => setReimbursementAmount(e.target.value)}
                                            disabled={!selectedPatient}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-[10px] border-red-200 text-red-600 hover:bg-red-50"
                                            onClick={addReimbursement}
                                            disabled={!selectedPatient}
                                        >
                                            Add Return
                                        </Button>
                                    </div>

                                    {reimbursements.length > 0 && (
                                        <div className="mt-3 space-y-1">
                                            {reimbursements.map(r => (
                                                <div key={r.id} className="flex items-center justify-between text-xs p-1.5 bg-background rounded border border-red-100">
                                                    <span className="font-medium truncate flex-1 mr-2">{r.description}</span>
                                                    <span className="text-red-600 font-bold mr-2">-{r.amount} Rs</span>
                                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-red-500" onClick={() => removeReimbursement(r.id)}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>

            {/* RIGHT COLUMN: RECEIPT PREVIEW (This replaces the entire screen when printing) */}
            <div className="w-full md:w-1/2 lg:w-[55%] flex flex-col h-full print:w-full print:block">
                <Card className="flex-1 flex flex-col shadow-none border-dashed bg-muted/10 print:bg-white print:border-none print:shadow-none min-h-[600px]">
                    <CardHeader className="text-center border-b pb-6 print:pb-4">
                        <div className="flex justify-center mb-2">
                            <div className="h-12 w-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                                <CircleDollarSign className="h-6 w-6" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">SkinSmith Clinic</CardTitle>
                        <CardDescription>Payment Receipt</CardDescription>
                        <p className="text-xs text-muted-foreground mt-1">Date: {new Date().toLocaleDateString()}</p>
                    </CardHeader>

                    <CardContent className="flex-1 pt-6 print:pt-4 flex flex-col overflow-y-auto">
                        {/* Patient Info */}
                        <div className="mb-6 grid grid-cols-2 text-sm bg-background p-4 rounded-lg border print:border-none print:p-0 print:bg-transparent">
                            <div>
                                <p className="text-muted-foreground text-xs">Patient Name</p>
                                <p className="font-medium">{selectedPatient?.name || '---'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-muted-foreground text-xs">Mobile Number</p>
                                <p className="font-medium">{selectedPatient?.mobileNumber || '---'}</p>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="flex-1">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left pb-2 font-medium">Description</th>
                                        <th className="text-center pb-2 font-medium w-16">Qty</th>
                                        <th className="text-right pb-2 font-medium w-24">Amount</th>
                                        <th className="w-8 print:hidden"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {billItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-8 text-muted-foreground text-xs italic">
                                                No items added to the bill yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        billItems.map(item => (
                                            <tr key={item.id} className="border-b last:border-0 group">
                                                <td className="py-3">
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase">{item.type}</p>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button variant="outline" size="icon" className="h-5 w-5 print:hidden" onClick={() => updateQty(item.id, -1)}>-</Button>
                                                        <span>{item.qty}</span>
                                                        <Button variant="outline" size="icon" className="h-5 w-5 print:hidden" onClick={() => updateQty(item.id, 1)}>+</Button>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-right">{(item.price * item.qty).toLocaleString()} Rs</td>
                                                <td className="py-3 text-right print:hidden">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeItem(item.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}

                                    {reimbursements.map(r => (
                                        <tr key={r.id} className="border-b last:border-0 group bg-red-50/20 print:bg-transparent">
                                            <td className="py-3">
                                                <p className="font-medium text-red-600">RETURN: {r.description}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">REIMBURSEMENT</p>
                                            </td>
                                            <td className="py-3 text-center">1</td>
                                            <td className="py-3 text-right text-red-600">-{r.amount.toLocaleString()} Rs</td>
                                            <td className="py-3 text-right print:hidden">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeReimbursement(r.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="mt-8 pt-4 border-t space-y-2 pb-4">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Subtotal</span>
                                <span>{subTotal.toLocaleString()} Rs</span>
                            </div>

                            {discountValue > 0 && (
                                <div className="flex justify-between text-sm text-green-600 font-medium">
                                    <span>Discount {discountType === 'percentage' ? `(${discountValue}%)` : ''}</span>
                                    <span>- {discountAmount.toLocaleString()} Rs</span>
                                </div>
                            )}

                            {reimbursements.length > 0 && (
                                <div className="flex justify-between text-sm text-red-600 font-medium">
                                    <span>Reimbursements / Returns</span>
                                    <span>- {reimbursementTotal.toLocaleString()} Rs</span>
                                </div>
                            )}

                            {paymentMethod && (
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Tax ({paymentMethod} - {(taxRate * 100).toFixed(0)}%)</span>
                                    <span>{taxAmount.toLocaleString()} Rs</span>
                                </div>
                            )}

                            <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                                <span>Total Amount</span>
                                <span>{grandTotal.toLocaleString()} Rs</span>
                            </div>

                            <div className="mt-6 pt-4 border-t border-dashed text-center text-[10px] text-muted-foreground space-y-1">
                                <p className="font-bold text-foreground">SkinSmith Clinic</p>
                                <p>1st Floor, Lord Trade Centre, 06, F-11 Markaz Islamabad</p>
                                <p>Mobile: +92 333 0477704 | Landline: 051-8748123</p>
                                <p className="font-bold text-foreground pt-2 uppercase tracking-wider text-[9px]">No Refund and Exchange Policy</p>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="bg-muted/30 pt-4 print:hidden flex justify-between">
                        <Button variant="outline" onClick={handleSaveBill} disabled={!selectedPatient || !paymentMethod || billItems.length === 0}><CheckCircle2 className="mr-2 h-4 w-4" /> Save Record</Button>
                        <Button onClick={handlePrint} disabled={!paymentMethod || billItems.length === 0} className="w-32"><Printer className="mr-2 h-4 w-4" /> Print Bill</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
