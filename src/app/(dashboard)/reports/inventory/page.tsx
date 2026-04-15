'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    File, 
    Search, 
    Download, 
    Printer, 
    Boxes, 
    AlertTriangle, 
    PackageOpen, 
    History, 
    BarChart3, 
    Zap,
    ArrowUpRight,
    Loader2
} from 'lucide-react';
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import { 
    Select, 
    SelectTrigger, 
    SelectValue, 
    SelectContent, 
    SelectItem 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Supplier } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DateRange } from 'react-day-picker';
import { startOfMonth } from 'date-fns';

export default function InventoryReportPage() {
    const firestore = useFirestore();
    const suppliersRef = useMemoFirebase(() => firestore ? collection(firestore, 'suppliers') : null, [firestore]);
    const { data: suppliers, isLoading } = useCollection<Supplier>(suppliersRef);

    const [selectedRange, setSelectedRange] = React.useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: new Date(),
    });

    const inventoryItems = React.useMemo(() => {
        if (!suppliers) return [];
        const items: any[] = [];
        suppliers.forEach(s => {
            s.products?.forEach(p => {
                items.push({ ...p, supplierName: s.name, supplierId: s.id });
            });
        });
        return items;
    }, [suppliers]);

    const lowStockItems = React.useMemo(() => {
        return inventoryItems.filter(item => Number(item.quantity) <= (item.minThreshold || 0));
    }, [inventoryItems]);

    const stockMetrics = React.useMemo(() => {
        const totalValue = inventoryItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0);
        const outOfStock = inventoryItems.filter(item => Number(item.quantity) <= 0).length;
        return {
            totalItems: inventoryItems.length,
            totalValue,
            lowStockCount: lowStockItems.length,
            outOfStock
        };
    }, [inventoryItems, lowStockItems]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-slate-500 font-bold animate-pulse uppercase tracking-[0.2em] text-[10px]">Analyzing Stock Levels...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        Inventory <span className="text-emerald-600">&</span> Stocks
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Real-time valuation and replenishment tracking.</p>
                </div>
                <div className="flex gap-3">
                    <DatePickerWithRange date={selectedRange} onDateChange={setSelectedRange} />
                    <Button variant="outline" className="rounded-xl border-slate-200 font-bold">Export CSV</Button>
                    <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-500/20">Sync Inventory</Button>
                </div>
            </div>

            {/* Premium Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="relative overflow-hidden border-none bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-500/20">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Boxes className="h-24 w-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-emerald-100 font-black uppercase tracking-widest text-[10px]">Total Stock Value</CardDescription>
                        <CardTitle className="text-3xl font-black">Rs {stockMetrics.totalValue.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-3 py-1 rounded-full">
                            <Zap className="h-3 w-3" /> Asset Valuation
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/40 backdrop-blur-md border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Active SKUs</CardDescription>
                        <CardTitle className="text-3xl font-black flex items-center gap-2">
                            {stockMetrics.totalItems} <span className="text-sm font-medium text-slate-400">Items</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 w-fit px-3 py-1 rounded-full">
                            <BarChart3 className="h-3 w-3" /> Catalogue Strength
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/40 backdrop-blur-md border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Low Stock Alert</CardDescription>
                        <CardTitle className={cn(
                            "text-3xl font-black",
                            stockMetrics.lowStockCount > 0 ? "text-amber-600" : "text-emerald-600"
                        )}>
                            {stockMetrics.lowStockCount}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn(
                            "flex items-center gap-2 text-xs font-bold w-fit px-3 py-1 rounded-full",
                            stockMetrics.lowStockCount > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                            <AlertTriangle className="h-3 w-3" /> Replenish Soon
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/40 backdrop-blur-md border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Out of Stock</CardDescription>
                        <CardTitle className={cn(
                            "text-3xl font-black",
                            stockMetrics.outOfStock > 0 ? "text-red-600" : "text-emerald-600"
                        )}>
                            {stockMetrics.outOfStock}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn(
                            "flex items-center gap-2 text-xs font-bold w-fit px-3 py-1 rounded-full",
                            stockMetrics.outOfStock > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                            <History className="h-3 w-3" /> Urgent Attention
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for Reports */}
            <Tabs defaultValue="low-stocks" className="w-full">
                <TabsList className="bg-slate-100/50 p-1 rounded-2xl h-auto mb-8 border border-slate-200">
                    <TabsTrigger value="low-stocks" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Critical Inventory</TabsTrigger>
                    <TabsTrigger value="consumptions" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Consumptions</TabsTrigger>
                    <TabsTrigger value="purchase" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Purchase Ledger</TabsTrigger>
                    <TabsTrigger value="expiry" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Expiry Tracker</TabsTrigger>
                </TabsList>

                {/* Critical Inventory Tab */}
                <TabsContent value="low-stocks" className="mt-0 outline-none">
                    <Card className="border-none bg-white shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-black text-slate-900">Replenishment Priority</CardTitle>
                                <CardDescription>Showing all items currently below or near their minimum threshold.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="rounded-xl font-bold"><Printer className="h-4 w-4 mr-2" /> Print List</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {lowStockItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                    <div className="bg-emerald-50 p-6 rounded-full">
                                        <PackageOpen className="h-12 w-12 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-slate-900">Inventory Levels Healthy</p>
                                        <p className="text-sm text-slate-500">All SKUs are currently above their safety thresholds.</p>
                                    </div>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <TableRow className="border-none hover:bg-transparent">
                                            <TableHead className="pl-8 py-4">Item & Supplier</TableHead>
                                            <TableHead className="text-center py-4">Current Qty</TableHead>
                                            <TableHead className="text-center py-4">Min Thresh</TableHead>
                                            <TableHead className="text-center py-4">Location</TableHead>
                                            <TableHead className="text-center py-4">Status</TableHead>
                                            <TableHead className="text-right pr-8 py-4">Reorder</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {lowStockItems.map((item) => (
                                            <TableRow key={`${item.supplierId}_${item.id}`} className="group hover:bg-slate-50/80 transition-colors border-slate-50">
                                                <TableCell className="pl-8 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900">{item.name}</span>
                                                        <span className="text-[10px] font-bold text-emerald-600/60 uppercase">{item.supplierName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={cn(
                                                        "text-lg font-black",
                                                        Number(item.quantity) <= 0 ? "text-red-600" : "text-amber-600"
                                                    )}>
                                                        {item.quantity}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-sm font-bold text-slate-400">{item.minThreshold || 0}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="rounded-lg text-[10px] font-black bg-slate-50 border-slate-200">RACK {item.rack || '?'}</Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex justify-center">
                                                        <Badge className={cn(
                                                            "rounded-full px-3 py-0.5 text-[10px] font-black uppercase border-none",
                                                            Number(item.quantity) <= 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700 font-black"
                                                        )}>
                                                            {Number(item.quantity) <= 0 ? "Out of Stock" : "Low Stock"}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-8">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-50 hover:text-emerald-600">
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Other Tabs with Premium Empty States */}
                {['consumptions', 'purchase', 'expiry'].map((tab) => (
                    <TabsContent key={tab} value={tab} className="mt-0 outline-none">
                        <Card className="border-none bg-white shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden py-20">
                            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                                <div className="bg-slate-50 p-6 rounded-full animate-pulse">
                                    <BarChart3 className="h-12 w-12 text-slate-300" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-slate-900 uppercase tracking-widest">Compiling {tab} Data</p>
                                    <p className="text-sm text-slate-400 max-w-xs mx-auto">Detailed historical reporting for {tab} is currently being synchronized with the main ledger.</p>
                                </div>
                                <Button variant="outline" className="rounded-xl font-bold mt-4">Refresh Records</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>

            {/* Bottom Footer Info */}
            <div className="flex items-center justify-center py-10 opacity-30">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-6">
                    <span className="h-px w-20 bg-slate-400"></span>
                    Master Stock Ledger v2.0
                    <span className="h-px w-20 bg-slate-400"></span>
                </p>
            </div>
        </div>
    );
}
