'use client';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { DailyReport, User } from '@/lib/types';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

export default function EmployeeReportsPage() {
    const firestore = useFirestore();
    const { user: currentUser } = useUser();
    const [selectedUser, setSelectedUser] = React.useState<string>('all');
    const [searchTerm, setSearchTerm] = React.useState('');

    const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const reportsQuery = useMemoFirebase(() =>
        firestore ? query(collection(firestore, 'dailyReports'), orderBy('reportDate', 'desc')) : null,
        [firestore]
    );

    const { data: users, isLoading: usersLoading } = useCollection<User>(usersQuery);
    const { data: reports, isLoading: reportsLoading } = useCollection<DailyReport>(reportsQuery);

    const isMainAdmin = currentUser?.email === 'admin1@skinsmith.com' || currentUser?.isMainAdmin;

    const usersMap = React.useMemo(() => {
        if (!users) return new Map();
        return new Map(users.map(u => [u.id, u]));
    }, [users]);

    const filteredReports = React.useMemo(() => {
        if (!reports) return [];
        let result = reports;

        if (selectedUser !== 'all') {
            result = result.filter(r => r.userId === selectedUser);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(r => {
                const user = usersMap.get(r.userId);
                return (
                    user?.name.toLowerCase().includes(term) ||
                    r.summary.toLowerCase().includes(term) ||
                    r.plans.toLowerCase().includes(term)
                );
            });
        }

        return result;
    }, [reports, selectedUser, searchTerm, usersMap]);

    if (!isMainAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <h1 className="text-2xl font-bold text-destructive">Unauthorized Access</h1>
                <p>Only the Main Admin can view employee reports.</p>
            </div>
        );
    }

    if (usersLoading || reportsLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Employee Daily Reports</CardTitle>
                    <CardDescription>Monitor daily updates and performance across your team.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search reports or employees..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-[200px]">
                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Employees" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Employees</SelectItem>
                                    {users?.map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Summary</TableHead>
                                <TableHead>Plans for Tomorrow</TableHead>
                                <TableHead>Tasks Completed</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReports.map(report => {
                                const reporter = usersMap.get(report.userId);
                                return (
                                    <TableRow key={report.id}>
                                        <TableCell>
                                            <div className="font-medium">{reporter?.name || 'Unknown'}</div>
                                            <div className="text-xs text-muted-foreground">{reporter?.role}</div>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {format(new Date(report.reportDate), 'MMM dd, yyyy')}
                                        </TableCell>
                                        <TableCell className="max-w-[300px]">
                                            <p className="text-sm line-clamp-2" title={report.summary}>{report.summary}</p>
                                        </TableCell>
                                        <TableCell className="max-w-[200px]">
                                            <p className="text-sm line-clamp-2" title={report.plans}>{report.plans}</p>
                                        </TableCell>
                                        <TableCell className="max-w-[200px]">
                                            <p className="text-sm line-clamp-2" title={report.completingTasks || 'None'}>
                                                {report.completingTasks || '-'}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filteredReports.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No reports found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
