'use client';

import * as React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    useCollection,
    useFirestore,
    useMemoFirebase
} from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import {
    Calendar,
    Users,
    Activity,
    CreditCard,
    DollarSign,
    Printer,
    FileText,
    TrendingUp,
    PieChart,
    Loader2
} from 'lucide-react';
import { format, isToday, startOfDay, endOfDay } from 'date-fns';

interface BillItem {
    id: string;
    name: string;
    type: 'procedure' | 'pharmacy' | 'custom';
    price: number;
    qty: number;
}

interface BillingRecord {
    id: string;
    patientId: string;
    patientName: string;
    patientMobile: string;
    items: BillItem[];
    grandTotal: number;
    paymentMethod: string;
    timestamp: string; // ISO String
}

export default function TodaySummaryPage() {
    const firestore = useFirestore();

    const billingQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Fetch all recent records and filter in JS for simplicity with dates if needed, 
        // or use a query if Firestore indexes allow.
        return query(collection(firestore, 'billingRecords'), orderBy('timestamp', 'desc'));
    }, [firestore]);

    const { data: allRecords, isLoading } = useCollection<BillingRecord>(billingQuery);

    const todayRecords = React.useMemo(() => {
        if (!allRecords) return [];
        return allRecords.filter(record => isToday(new Date(record.timestamp)));
    }, [allRecords]);

    const stats = React.useMemo(() => {
        const totalRevenue = todayRecords.reduce((sum, r) => sum + (r.grandTotal || 0), 0);
        const uniquePatients = new Set(todayRecords.map(r => r.patientId)).size;

        // Group procedures
        const proceduresMap: { [key: string]: { count: number, revenue: number } } = {};
        const paymentsMap: { [key: string]: { count: number, amount: number } } = {};

        todayRecords.forEach(record => {
            // Count procedures
            record.items?.forEach(item => {
                if (item.type === 'procedure') {
                    if (!proceduresMap[item.name]) {
                        proceduresMap[item.name] = { count: 0, revenue: 0 };
                    }
                    proceduresMap[item.name].count += item.qty;
                    proceduresMap[item.name].revenue += item.price * item.qty;
                }
            });

            // Count payments
            const method = record.paymentMethod || 'Unknown';
            if (!paymentsMap[method]) {
                paymentsMap[method] = { count: 0, amount: 0 };
            }
            paymentsMap[method].count += 1;
            paymentsMap[method].amount += record.grandTotal || 0;
        });

        return {
            totalRevenue,
            uniquePatients,
            procedures: Object.entries(proceduresMap).map(([name, data]) => ({ name, ...data })),
            payments: Object.entries(paymentsMap).map(([method, data]) => ({ method, ...data })),
            totalTransactions: todayRecords.length
        };
    }, [todayRecords]);

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Calculating today's clinical performance...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <TrendingUp className="h-8 w-8 text-primary" />
                        Today's Clinical Summary
                    </h2>
                    <p className="text-muted-foreground">Detailed breakdown of patients, procedures, and revenue for {format(new Date(), 'PPPP')}.</p>
                </div>
                <Button onClick={handlePrint} variant="outline" className="gap-2">
                    <Printer className="h-4 w-4" /> Print Daily Report
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-primary font-semibold uppercase tracking-wider text-[10px]">Total Revenue</CardDescription>
                        <CardTitle className="text-3xl font-bold">{stats.totalRevenue.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">Rs</span></CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <DollarSign className="h-3 w-3" /> From {stats.totalTransactions} transactions
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="font-semibold uppercase tracking-wider text-[10px]">Total Patients</CardDescription>
                        <CardTitle className="text-3xl font-bold">{stats.uniquePatients}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" /> Unique visitors today
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="font-semibold uppercase tracking-wider text-[10px]">Procedures Done</CardDescription>
                        <CardTitle className="text-3xl font-bold">{stats.procedures.reduce((acc, curr) => acc + curr.count, 0)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Activity className="h-3 w-3" /> Across {stats.procedures.length} categories
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="font-semibold uppercase tracking-wider text-[10px]">Average Bill</CardDescription>
                        <CardTitle className="text-3xl font-bold">
                            {stats.totalTransactions > 0
                                ? Math.round(stats.totalRevenue / stats.totalTransactions).toLocaleString()
                                : 0}
                            <span className="text-sm font-normal text-muted-foreground">Rs</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3" /> Per billing transaction
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Procedures Breakdown */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-indigo-500" />
                            Procedures Performed
                        </CardTitle>
                        <CardDescription>Breakdown of medical services provided today.</CardDescription>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4 flex-1">
                        {stats.procedures.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12">
                                <Activity className="h-12 w-12 opacity-10 mb-2" />
                                <p className="italic">No procedures recorded today.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Procedure</TableHead>
                                        <TableHead className="text-center">Qty</TableHead>
                                        <TableHead className="text-right">Revenue (Rs)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.procedures.map((proc, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{proc.name}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="font-bold">{proc.count}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">{proc.revenue.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Payment Breakdown */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-green-500" />
                            Revenue by Payment Method
                        </CardTitle>
                        <CardDescription>How patients preferred to pay today.</CardDescription>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4 flex-1">
                        {stats.payments.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12">
                                <CreditCard className="h-12 w-12 opacity-10 mb-2" />
                                <p className="italic">No transactions recorded today.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {stats.payments.map((pay, i) => (
                                    <div key={i} className="flex flex-col gap-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-semibold flex items-center gap-2">
                                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                                {pay.method}
                                                <Badge variant="outline" className="text-[10px] ml-1">{pay.count} bills</Badge>
                                            </span>
                                            <span className="font-bold">{pay.amount.toLocaleString()} Rs</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all duration-1000"
                                                style={{ width: `${(pay.amount / stats.totalRevenue) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-4 border-t mt-auto">
                                    <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border border-dashed">
                                        <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Grand Total Today</span>
                                        <span className="text-2xl font-black text-primary">{stats.totalRevenue.toLocaleString()} Rs</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Visit Log */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        Today's Detailed Visit Log
                    </CardTitle>
                    <CardDescription>Individual patient transactions, procedures, and payment details.</CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                    {todayRecords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-muted-foreground py-12">
                            <Users className="h-12 w-12 opacity-10 mb-2" />
                            <p className="italic">No patient visits recorded today.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Patient Name</TableHead>
                                    <TableHead>Procedures / Items</TableHead>
                                    <TableHead>Payment</TableHead>
                                    <TableHead className="text-right">Amount (Rs)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {todayRecords.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {format(new Date(record.timestamp), 'p')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold">{record.patientName}</div>
                                            <div className="text-[10px] text-muted-foreground">{record.patientMobile}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {record.items?.map((item, idx) => (
                                                    <Badge key={idx} variant="outline" className="text-[10px] font-normal py-0">
                                                        {item.qty}x {item.name}
                                                    </Badge>
                                                ))}
                                                {record.items?.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                record.paymentMethod === 'Cash' ? 'default' :
                                                    record.paymentMethod === 'Card' ? 'secondary' :
                                                        'outline'
                                            } className="font-bold">
                                                {record.paymentMethod || 'N/A'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            {record.grandTotal.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Print Only Section */}
            <div className="hidden print:block mt-8">
                <Separator className="my-4" />
                <div className="text-center text-[10px] text-muted-foreground space-y-1">
                    <p className="font-bold text-black">SkinSmith Clinic Daily Summary Report</p>
                    <p>Generated on: {new Date().toLocaleString()}</p>
                    <p>Internal use only • Confidental Financial Data</p>
                </div>
            </div>
        </div>
    );
}
