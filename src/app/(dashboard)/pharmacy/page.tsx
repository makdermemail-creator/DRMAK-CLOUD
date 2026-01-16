'use client';
import * as React from 'react';
import {
    Activity,
    ArrowUpRight,
    Boxes,
    PackagePlus,
    FileText,
    Truck,
    ShoppingCart,
    Archive,
    PackageX,
    ClipboardList,
    Users,
    Loader2
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { PharmacyItem } from '@/lib/types';
import { collection } from 'firebase/firestore';
import { isAfter, parseISO } from 'date-fns';

const quickActions = [
    { label: "Add New Product", icon: PackagePlus, href: "/pharmacy/items" },
    { label: "Create Purchase Order", icon: ShoppingCart, href: "#" },
    { label: "Return Medicine", icon: Archive, href: "#" },
    { label: "View Sales Report", icon: FileText, href: "/reports" },
]

export default function PharmacyDashboard() {
    const firestore = useFirestore();
    const pharmacyQuery = useMemoFirebase(() => firestore ? collection(firestore, 'pharmacyItems') : null, [firestore]);
    const { data: pharmacyItems, isLoading } = useCollection<PharmacyItem>(pharmacyQuery);

    const stats = React.useMemo(() => {
        if (!pharmacyItems) {
            return { totalProducts: 0, lowStock: 0, expiredStock: 0, totalSuppliers: 0 };
        }
        const today = new Date();
        const lowStockThreshold = 10;
        const uniqueSuppliers = new Set(pharmacyItems.map(item => item.supplier));

        return {
            totalProducts: pharmacyItems.length,
            lowStock: pharmacyItems.filter(item => item.quantity < lowStockThreshold).length,
            expiredStock: pharmacyItems.filter(item => isAfter(today, parseISO(item.expiryDate))).length,
            totalSuppliers: uniqueSuppliers.size,
        };
    }, [pharmacyItems]);

    const stockByCategory = React.useMemo(() => {
        if (!pharmacyItems) return [];
        const categoryMap: { [key: string]: number } = {};
        pharmacyItems.forEach(item => {
            if (categoryMap[item.category]) {
                categoryMap[item.category] += item.quantity;
            } else {
                categoryMap[item.category] = item.quantity;
            }
        });
        return Object.entries(categoryMap).map(([name, total]) => ({ name, total }));
    }, [pharmacyItems]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    const chartConfig = {
      total: {
        label: "Stock",
        color: "hsl(var(--chart-1))",
      },
    } satisfies React.ComponentProps<typeof ChartContainer>["config"];

    return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalProducts}</div>
                        <p className="text-xs text-muted-foreground">Unique items in inventory</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                        <PackageX className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.lowStock}</div>
                        <p className="text-xs text-muted-foreground">Items needing reorder</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expired Stock</CardTitle>
                        <Archive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.expiredStock}</div>
                        <p className="text-xs text-muted-foreground">Items past expiry date</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
                        <p className="text-xs text-muted-foreground">Active suppliers</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-3">
                 <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        {quickActions.map(action => (
                            <Button key={action.label} variant="outline" className="flex flex-col h-24 items-center justify-center gap-2 text-center" asChild>
                                <Link href={action.href}>
                                    <action.icon className="h-6 w-6" />
                                    <span className="text-sm">{action.label}</span>
                                </Link>
                            </Button>
                        ))}
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Stock Level by Category</CardTitle>
                        <CardDescription>Total quantity of items per category.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                          <BarChart accessibilityLayer data={stockByCategory}>
                             <XAxis
                              dataKey="name"
                              stroke="hsl(var(--muted-foreground))"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              stroke="hsl(var(--muted-foreground))"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => `${value}`}
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                            <Bar dataKey="total" fill="hsl(var(--chart-1))" radius={4} />
                          </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Stock Activity</CardTitle>
                     <CardDescription>Latest updates to pharmacy inventory.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Last Updated</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pharmacyItems?.slice(0, 5).map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell>{item.supplier}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>{new Date().toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
