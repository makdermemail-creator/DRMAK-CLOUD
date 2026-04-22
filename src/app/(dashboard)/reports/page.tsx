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
  TrendingUp,
  Boxes,
  CircleDollarSign,
  ArrowUpRight,
  Zap,
  Users,
  Wallet,
  Receipt,
  ArrowRight,
  PieChart as PieChartIcon,
  Activity,
  CalendarCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { BillingRecord, Supplier, DailyTask } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function ReportsBirdsEyePage() {
    const firestore = useFirestore();
    
    // Data fetching for overview
    const billingRef = useMemoFirebase(() => firestore ? collection(firestore, 'billingRecords') : null, [firestore]);
    const suppliersRef = useMemoFirebase(() => firestore ? collection(firestore, 'suppliers') : null, [firestore]);
    const tasksRef = useMemoFirebase(() => firestore ? collection(firestore, 'dailyTasks') : null, [firestore]);

    const { data: billing } = useCollection<BillingRecord>(billingRef);
    const { data: suppliers } = useCollection<Supplier>(suppliersRef);
    const { data: tasks } = useCollection<DailyTask>(tasksRef);

    const metrics = React.useMemo(() => {
        // Finance Summary
        const totalRevenue = billing?.reduce((acc, b) => acc + (b.grandTotal || b.totalAmount || 0), 0) || 0;
        
        // Inventory Summary
        let stockValue = 0;
        let lowStockCount = 0;
        suppliers?.forEach(s => {
            s.products?.forEach(p => {
                stockValue += (Number(p.price) * Number(p.quantity));
                if (Number(p.quantity) <= (p.minThreshold || 0)) lowStockCount++;
            });
        });

        // Performance Summary
        const completedTasks = tasks?.filter(t => t.status === 'Completed').length || 0;
        const totalTasks = tasks?.length || 0;
        const taskSuccessRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
            totalRevenue,
            stockValue,
            lowStockCount,
            taskSuccessRate,
            totalTasks,
            completedTasks
        };
    }, [billing, suppliers, tasks]);

    const navigationCards = [
        { title: 'Finance', href: '/reports/financial', icon: CircleDollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Revenue, P&L, Ledger' },
        { title: 'Inventory', href: '/reports/inventory', icon: Boxes, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Real-time stock level audit' },
        { title: 'Team Performance', href: '/employee-reports', icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50', desc: 'Efficiency & KPI Tracking' },
        { title: 'Expenses', href: '/daily-expenses', icon: Receipt, color: 'text-rose-600', bg: 'bg-rose-50', desc: 'Daily outflows & Vouchers' },
        { title: 'Employee Salary', href: '/reports/salaries', icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Payroll & Compensation' },
    ];

    return (
        <div className="p-6 space-y-10 max-w-7xl mx-auto">
            {/* Executive Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-slate-900">
                        Executive <span className="text-indigo-600">Overview</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-2 text-lg">Your clinic's vital statistics at a glance.</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="rounded-2xl border-slate-200 h-12 px-6 font-bold">Today's Snapshot</Button>
                    <Button className="rounded-2xl bg-slate-900 hover:bg-slate-800 h-12 px-6 font-bold shadow-xl shadow-slate-200">Generate Master Report</Button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Revenue Card */}
                <Card className="relative overflow-hidden border-none bg-indigo-600 text-white shadow-2xl shadow-indigo-200 rounded-[2.5rem] p-4">
                    <div className="absolute top--10 right--10 opacity-10">
                        <CircleDollarSign className="h-48 w-48" />
                    </div>
                    <CardHeader>
                        <CardDescription className="text-indigo-100 font-black uppercase tracking-widest text-[11px]">Gross Revenue Ledger</CardDescription>
                        <CardTitle className="text-4xl font-black mt-2">Rs {metrics.totalRevenue.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent className="mt-4">
                        <div className="flex items-center gap-2 text-sm font-bold bg-white/20 w-fit px-4 py-1.5 rounded-full">
                            <ArrowUpRight className="h-4 w-4" /> Strong Growth
                        </div>
                    </CardContent>
                </Card>

                {/* Stock Valuation Card */}
                <Card className="relative overflow-hidden border-none bg-emerald-600 text-white shadow-2xl shadow-emerald-200 rounded-[2.5rem] p-4">
                    <div className="absolute top--10 right--10 opacity-10">
                        <Boxes className="h-48 w-48" />
                    </div>
                    <CardHeader>
                        <CardDescription className="text-emerald-100 font-black uppercase tracking-widest text-[11px]">Asset Net Value</CardDescription>
                        <CardTitle className="text-4xl font-black mt-2">Rs {metrics.stockValue.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent className="mt-4">
                        <div className="flex items-center gap-2 text-sm font-bold bg-white/20 w-fit px-4 py-1.5 rounded-full">
                            <Zap className="h-4 w-4" /> {metrics.lowStockCount} Low SKU Alerts
                        </div>
                    </CardContent>
                </Card>

                {/* Team Success Card */}
                <Card className="relative overflow-hidden border-none bg-violet-600 text-white shadow-2xl shadow-violet-200 rounded-[2.5rem] p-4">
                    <div className="absolute top--10 right--10 opacity-10">
                        <TrendingUp className="h-48 w-48" />
                    </div>
                    <CardHeader>
                        <CardDescription className="text-violet-100 font-black uppercase tracking-widest text-[11px]">Operational Efficiency</CardDescription>
                        <CardTitle className="text-4xl font-black mt-2">{metrics.taskSuccessRate}%</CardTitle>
                    </CardHeader>
                    <CardContent className="mt-4">
                        <div className="flex items-center gap-2 text-sm font-bold bg-white/20 w-fit px-4 py-1.5 rounded-full">
                            <CalendarCheck className="h-4 w-4" /> {metrics.completedTasks}/{metrics.totalTasks} Tasks Done
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Strategic Navigation Section */}
            <div className="space-y-6">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Intelligence Access</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {navigationCards.map((card) => (
                        <Link key={card.title} href={card.href} className="group">
                            <Card className="border-slate-100 hover:border-indigo-100 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-50 rounded-3xl h-full flex flex-col justify-between p-2">
                                <CardHeader className="pb-2">
                                    <div className={cn("p-3 rounded-2xl w-fit mb-3 transition-transform group-hover:scale-110", card.bg, card.color)}>
                                        <card.icon className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-lg font-black group-hover:text-indigo-600 transition-colors">{card.title}</CardTitle>
                                    <CardDescription className="text-[11px] font-medium leading-relaxed">{card.desc}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 group-hover:text-indigo-600 transition-colors">
                                        Open Report <ArrowRight className="h-3 w-3" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* AI Insights Placeholder */}
            <Card className="border-none bg-slate-900 text-white rounded-[3rem] overflow-hidden p-8 relative">
                <div className="absolute top-0 right-0 p-10 opacity-20">
                    <PieChartIcon className="h-40 w-40" />
                </div>
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="bg-indigo-500/20 p-6 rounded-3xl backdrop-blur-md border border-white/10">
                        <Activity className="h-12 w-12 text-indigo-400" />
                    </div>
                    <div className="space-y-2 text-center md:text-left">
                        <h4 className="text-2xl font-black">Strategic Performance Audit</h4>
                        <p className="text-slate-400 max-w-2xl font-medium">Your current revenue-to-expense ratio is optimized at 3.2x. Monitor 14 high-movement inventory items reported in the Inventory Ledger to ensure consistent stock availability.</p>
                    </div>
                    <Button className="ml-auto bg-white text-slate-900 hover:bg-slate-100 rounded-2xl px-8 font-black">Refine Trends</Button>
                </div>
            </Card>
        </div>
    );
}
