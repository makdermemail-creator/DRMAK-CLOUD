'use client';
import * as React from 'react';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from '@/components/ui/card';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { 
    CircleDollarSign, 
    TrendingUp, 
    Calendar, 
    Users, 
    ArrowUpRight, 
    ArrowDownRight,
    Wallet,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Mock data for premium demonstration
const MOCK_SALARIES = [
    { id: 1, name: 'Dr. Sarah Ahmed', role: 'Senior Dermatologist', base: 150000, bonus: 25000, status: 'Paid', date: '2026-04-01' },
    { id: 2, name: 'John Doe', role: 'Clinic Manager', base: 85000, bonus: 5000, status: 'Processing', date: '2026-04-05' },
    { id: 3, name: 'Amna Khan', role: 'Front Desk', base: 45000, bonus: 2000, status: 'Paid', date: '2026-04-01' },
    { id: 4, name: 'Zaid Sheikh', role: 'Pharmacy Asst.', base: 55000, bonus: 0, status: 'Pending', date: '2026-04-10' },
    { id: 5, name: 'Maria V.', role: 'Nurse', base: 65000, bonus: 8000, status: 'Paid', date: '2026-04-01' },
];

export default function EmployeeSalaryPage() {
    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        Payroll <span className="text-indigo-600">&</span> Salaries
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Manage team compensation and payout schedules.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl border-slate-200 font-bold">Download TDS</Button>
                    <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200">Generate Payouts</Button>
                </div>
            </div>

            {/* Premium Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="relative overflow-hidden border-none bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-200">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Wallet className="h-24 w-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-indigo-100 font-black uppercase tracking-widest text-[10px]">Monthly Disbursement</CardDescription>
                        <CardTitle className="text-3xl font-black">Rs 842,500</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-3 py-1 rounded-full">
                            <ArrowUpRight className="h-3 w-3" /> 4.2% from last month
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/40 backdrop-blur-md border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Total Headcount</CardDescription>
                        <CardTitle className="text-3xl font-black flex items-center gap-2">
                            24 <span className="text-sm font-medium text-slate-400">Staff</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 w-fit px-3 py-1 rounded-full">
                            <Users className="h-3 w-3" /> Full-time Active
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/40 backdrop-blur-md border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Average Bonus</CardDescription>
                        <CardTitle className="text-3xl font-black">
                            Rs 8,200
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 w-fit px-3 py-1 rounded-full">
                            <TrendingUp className="h-3 w-3" /> Performance Based
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/40 backdrop-blur-md border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Next Payout</CardDescription>
                        <CardTitle className="text-3xl font-black">
                            May 01
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 w-fit px-3 py-1 rounded-full">
                            <Calendar className="h-3 w-3" /> 16 Days Remaining
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Salary Tracking Table */}
            <Card className="border-none bg-white shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
                <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black text-slate-900">Payroll Status Tracking</CardTitle>
                        <CardDescription>Real-time disbursement status for the current cycle.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-none">
                                <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest pl-8">Employee</TableHead>
                                <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-center">Base Amount</TableHead>
                                <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-center">Incentive</TableHead>
                                <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-center">Payout Date</TableHead>
                                <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                                <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-right pr-8">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {MOCK_SALARIES.map((salary) => (
                                <TableRow key={salary.id} className="group hover:bg-slate-50/80 transition-colors border-slate-50">
                                    <TableCell className="py-5 pl-8">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{salary.name}</span>
                                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{salary.role}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 text-center">
                                        <span className="font-bold text-slate-800">Rs {salary.base.toLocaleString()}</span>
                                    </TableCell>
                                    <TableCell className="py-5 text-center">
                                        <span className={salary.bonus > 0 ? "text-emerald-600 font-bold" : "text-slate-300 font-bold"}>
                                            {salary.bonus > 0 ? `+ Rs ${salary.bonus.toLocaleString()}` : '—'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-5 text-center">
                                        <span className="text-xs font-semibold text-slate-500">{salary.date}</span>
                                    </TableCell>
                                    <TableCell className="py-5 text-center">
                                        <div className="flex justify-center">
                                            <Badge className={cn(
                                                "rounded-full px-3 py-0.5 text-[10px] font-black uppercase border-none",
                                                salary.status === 'Paid' ? "bg-emerald-100 text-emerald-700" :
                                                salary.status === 'Processing' ? "bg-indigo-100 text-indigo-700" :
                                                "bg-amber-100 text-amber-700"
                                            )}>
                                                {salary.status}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 text-right pr-8">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-200">
                                            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Empty State / Bottom Info */}
            <div className="flex items-center justify-center py-10 opacity-50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-4">
                    <span className="h-px w-12 bg-slate-300"></span>
                    End of Ledger
                    <span className="h-px w-12 bg-slate-300"></span>
                </p>
            </div>
        </div>
    );
}
