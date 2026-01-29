'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    useSidebar,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from '@/components/ui/sidebar';
import Icon from '@/components/Icon';
import {
    LayoutDashboard,
    Calendar,
    Users,
    Stethoscope,
    Boxes,
    LineChart,
    Sparkles,
    LogOut,
    Settings,
    ChevronDown,
    MoreHorizontal,
    UserCog,
    FileBarChart,
    FileText,
    ListTodo,
    TrendingUp,
    HeartPulse,
    Share2,
    Video,
    CalendarCheck,
    GraduationCap,
    Hospital,
    Building2,
    Briefcase,
    Shield,
    Users2,
    Gamepad2,
    PieChart,
    BarChart3,
    Compass,
    Mail,
    Network
} from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { useViewMode } from '@/context/ViewModeContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { signOut } from 'firebase/auth';
import { Skeleton } from './ui/skeleton';


const allMenuItems = [
    // General
    { id: 'dashboard', href: '/', label: 'Dashboard', icon: LayoutDashboard },

    // Designer Specific
    { id: 'designerWork', href: '/designer-dashboard', label: 'Workstation', icon: LayoutDashboard },
    { id: 'creativeBriefs', href: '/daily-tasks', label: 'Creative Briefs', icon: ListTodo },

    { id: 'appointments', href: '/appointments', label: 'Appointments', icon: Calendar },
    { id: 'patients', href: '/patients', label: 'Patients', icon: Users },
    { id: 'doctors', href: '/doctors', label: 'Doctors', icon: Stethoscope },

    // Pharmacy Sub-menu
    {
        id: 'pharmacy.full', href: '/pharmacy', label: 'Pharmacy', icon: Boxes, isMenu: true,
        subItems: [
            { id: 'pharmacy.full', href: '/pharmacy/items', label: 'Items' }, // Assuming pharmacy.full grants access to all sub-items
            { id: 'pharmacy.full', href: '/pharmacy/item-categories', label: 'Item Categories' },
            { id: 'pharmacy.full', href: '/pharmacy/manufacturers', label: 'Manufacturers' },
            { id: 'pharmacy.full', href: '/pharmacy/manage-stock', label: 'Manage Stock' },
            { id: 'pharmacy.full', href: '/pharmacy/consume-stocks', label: 'Consume Stocks' },
            { id: 'pharmacy.full', href: '/pharmacy/racks', label: 'Racks' },
            { id: 'pharmacy.full', href: '/pharmacy/store-closing', label: 'Store Closing' },
            { id: 'pharmacy.full', href: '/pharmacy/stock-adjustment', label: 'Stock Adjustment' },
            { id: 'pharmacy.full', href: '/pharmacy/stock-suppliers', label: 'Stock Suppliers' },
            { id: 'pharmacy.pos', href: '/pharmacy/pos', label: 'POS' },
            { id: 'pharmacy.full', href: '/pharmacy/open-sale-return', label: 'Open Sale Return' },
            { id: 'pharmacy.full', href: '/pharmacy/invoice-return', label: 'Invoice Return' },
            { id: 'pharmacy.full', href: '/pharmacy/item-data-update', label: 'Item data Update' },
            { id: 'pharmacy.full', href: '/pharmacy/accounts', label: 'Accounts' },
            { id: 'pharmacy.full', href: '/pharmacy/donations', label: 'Donations' },
        ]
    },

    // Reports Sub-menu
    {
        id: 'reports.full', href: '/reports', label: 'Reports', icon: LineChart, isMenu: true,
        subItems: [
            { id: 'reports.full', href: '/reports/appointments', label: 'Appointments' },
            { id: 'reports.full', href: '/reports/opd', label: 'OPD' },
            { id: 'reports.full', href: '/reports/patients', label: 'Patients' },
            { id: 'reports.inventory', href: '/reports/inventory', label: 'Inventory' },
            { id: 'reports.financial', href: '/reports/financial', label: 'Financial' },
            { id: 'reports.full', href: '/reports/ipd', label: 'IPD' },
            { id: 'reports.full', href: '/reports/pharmacy', label: 'Pharmacy' },
            { id: 'reports.full', href: '/reports/laboratory', label: 'Laboratory' },
        ]
    },

    // More Sub-menu - We will treat these as individual features
    { id: 'healthRecords', href: '/health-records', label: 'Health Records', icon: HeartPulse, isMore: true },

    // AI Tools
    { id: 'aiTools', href: '/recommendations', label: 'AI Tools', icon: Sparkles },

    // Admin Specific
    { id: 'userManagement', href: '/user-creation', label: 'User Management', icon: UserCog }, // Corrected ID from features page
    { id: 'featureControl', href: '/features', label: 'Features', icon: Settings }, // Corrected ID from features page
    { id: 'employeeReports', href: '/employee-reports', label: 'Employee Reports', icon: FileBarChart },
    { id: 'taskManagement', href: '/admin/manage-tasks', label: 'Manage Tasks', icon: ListTodo },
    { id: 'admin_trainings', href: '/admin/trainings', label: 'Manage Trainings', icon: GraduationCap },

    // Sales Specific
    { id: 'salesDashboard', href: '/sales-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', href: '/leads', label: 'Leads', icon: FileBarChart },
    { id: 'leadAssignment', href: '/leads/assignment', label: 'Lead Assignment', icon: Users },
    { id: 'dailyReporting', href: '/daily-reporting', label: 'Daily Reporting', icon: FileText },
    { id: 'dailyPosting', href: '/daily-posting', label: 'Log Posting', icon: Video },
    { id: 'dailyTasks', href: '/daily-tasks', label: 'Daily Tasks', icon: ListTodo },
    { id: 'dailyProgress', href: '/daily-progress', label: 'Daily Progress', icon: TrendingUp },
    { id: 'trainings_hub', href: '/trainings', label: 'Trainings', icon: GraduationCap },


    // Doctor Specific (already included in 'more')
    { id: 'ePrescription', href: '/e-prescription', label: 'E-Prescription', icon: FileText, isMore: true },


    // Social Media Specific
    { id: 'socialReporting', href: '/social-reporting', label: 'Reports', icon: FileText },
    { id: 'contentPlanner', href: '/content-planner', label: 'Planner', icon: CalendarCheck },
    { id: 'analytics', href: '/analytics', label: 'Analytics', icon: LineChart },
    { id: 'socialInbox', href: '/social-inbox', label: 'Inbox', icon: Share2 },
    { id: 'reachTracker', href: '/analytics/reach', label: 'Reach Tracker', icon: TrendingUp },
];

const clinicGroups = [
    {
        label: "Main",
        ids: ["dashboard"]
    },
    {
        label: "Core Operations",
        ids: ["appointments", "patients", "doctors"]
    },
    {
        label: "Medical & Pharmacy",
        ids: ["pharmacy.full", "healthRecords", "ePrescription"]
    },
    {
        label: "Intelligence & Reports",
        ids: ["reports.full", "aiTools"]
    }
];

const organizationGroups = [
    {
        label: "Main",
        ids: ["dashboard"]
    },
    {
        label: "Administrative",
        ids: ["userManagement", "featureControl"]
    },
    {
        label: "Team Management",
        ids: ["employeeReports", "taskManagement", "admin_trainings", "designerWork", "creativeBriefs"]
    },
    {
        label: "Sales & Leads",
        ids: ["salesDashboard", "leads", "leadAssignment", "dailyReporting"]
    },
    {
        label: "Social & Growth",
        ids: ["dailyPosting", "dailyTasks", "dailyProgress", "trainings_hub", "socialReporting", "contentPlanner", "analytics", "socialInbox", "reachTracker"]
    }
];

const SidebarMenuSkeleton = ({ showIcon }: { showIcon?: boolean }) => {
    // Random width between 50 to 90%.
    const width = React.useMemo(() => {
        return `${Math.floor(Math.random() * 40) + 50}%`
    }, [])

    return (
        <div
            data-sidebar="menu-skeleton"
            className={cn("rounded-md h-8 flex gap-2 px-2 items-center")}
        >
            {showIcon && (
                <Skeleton
                    className="size-4 rounded-md"
                    data-sidebar="menu-skeleton-icon"
                />
            )}
            <Skeleton
                className="h-4 flex-1 max-w-[--skeleton-width]"
                data-sidebar="menu-skeleton-text"
                style={
                    {
                        "--skeleton-width": width,
                    } as React.CSSProperties
                }
            />
        </div>
    )
}


const NavContent = () => {
    const pathname = usePathname();
    const { state } = useSidebar();
    const { user: userProfile, isUserLoading } = useUser();
    const { viewMode, setViewMode } = useViewMode();

    const isMainAdmin = React.useMemo(() =>
        userProfile?.email === 'admin1@skinsmith.com' || userProfile?.isMainAdmin || userProfile?.role === 'Admin' || userProfile?.isAdmin || userProfile?.role === 'Operations Manager',
        [userProfile]);

    const filteredNavItems = React.useMemo(() => {
        if (isUserLoading) return [];

        if (isMainAdmin) {
            // Main admin sees everything, but we filter based on viewMode if requested
            // In this specific task, we want to group them.
            return allMenuItems;
        }

        // 1. Check for per-user Feature Access Overrides
        if (userProfile?.featureAccess) {
            return allMenuItems.filter(item => {
                if (userProfile.featureAccess?.[item.id]) return true;
                if (userProfile.featureAccess?.['trainings']) {
                    if (item.id === 'admin_trainings' && userProfile.role === 'Admin') return true;
                    if (item.id === 'trainings_hub' && userProfile.role !== 'Admin') return true;
                }
                if (item.subItems) {
                    return item.subItems.some(sub => userProfile.featureAccess?.[sub.id]);
                }
                return false;
            });
        }

        // 2. Fallback to Role-based defaults
        if (userProfile?.role === 'Admin') {
            return allMenuItems.filter(item => item.id !== 'userManagement' && item.id !== 'featureControl');
        }

        if (userProfile?.role === 'Social Media Manager') {
            const socialAccess = ['dashboard', 'socialReporting', 'contentPlanner', 'analytics', 'socialInbox', 'reachTracker', 'leadAssignment', 'dailyPosting'];
            return allMenuItems.filter(item => socialAccess.includes(item.id));
        }

        if (userProfile?.role === 'Designer') {
            const designerAccess = ['dashboard', 'designerWork', 'creativeBriefs', 'socialInbox', 'dailyReporting', 'dailyTasks'];
            return allMenuItems.filter(item => designerAccess.includes(item.id));
        }

        if (userProfile?.role === 'Sales') {
            const salesAccess = ['dashboard', 'salesDashboard', 'leads', 'leadAssignment', 'dailyReporting', 'dailyPosting', 'dailyTasks', 'dailyProgress', 'trainings_hub'];
            return allMenuItems.filter(item => salesAccess.includes(item.id));
        }

        if (userProfile) {
            // Default restricted access for users with no assigned role
            const defaultAccess = ['dashboard', 'settings'];
            return allMenuItems.filter(item => defaultAccess.includes(item.id));
        }

        return [];
    }, [userProfile, isUserLoading, isMainAdmin]);

    if (isUserLoading) {
        return (
            <div className="p-2 space-y-2">
                {[...Array(8)].map((_, i) => <SidebarMenuSkeleton key={i} showIcon />)}
            </div>
        )
    }

    // Hide sidebar completely for Main Admin if no viewMode is selected
    if (isMainAdmin && viewMode === 'none') {
        return null;
    }

    // Main Admin View Logic
    if (isMainAdmin) {
        const activeGroups = viewMode === 'clinic' ? clinicGroups : organizationGroups;

        return (
            <div className="space-y-4">
                {activeGroups.map((group) => {
                    const groupItems = allMenuItems.filter(item => group.ids.includes(item.id));
                    if (groupItems.length === 0) return null;

                    return (
                        <SidebarGroup key={group.label} className="px-0">
                            <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-4 mb-1">
                                {group.label}
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {groupItems.map((item) => (
                                        item.isMenu ? (
                                            <DropdownMenu key={item.id}>
                                                <SidebarMenuItem>
                                                    <Link href={item.href}>
                                                        <DropdownMenuTrigger asChild>
                                                            <SidebarMenuButton
                                                                isActive={pathname.startsWith(item.href)}
                                                                tooltip={item.label}
                                                                className="w-full justify-between"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    {item.icon && <item.icon />}
                                                                    <span>{item.label}</span>
                                                                </div>
                                                                {state === 'expanded' && <ChevronDown className="h-4 w-4" />}
                                                            </SidebarMenuButton>
                                                        </DropdownMenuTrigger>
                                                    </Link>
                                                </SidebarMenuItem>
                                                <DropdownMenuContent side="right" align="start" className={cn(state === 'collapsed' ? "ml-1" : "ml-8")}>
                                                    {item.subItems?.map(subItem => (
                                                        <DropdownMenuItem key={subItem.href} asChild>
                                                            <Link href={subItem.href} className={cn(pathname === subItem.href && 'bg-accent')}>{subItem.label}</Link>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            <SidebarMenuItem key={item.id}>
                                                <Link href={item.href}>
                                                    <SidebarMenuButton
                                                        isActive={pathname === item.href}
                                                        tooltip={item.label}
                                                    >
                                                        {item.icon && <item.icon />}
                                                        <span>{item.label}</span>
                                                    </SidebarMenuButton>
                                                </Link>
                                            </SidebarMenuItem>
                                        )
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    );
                })}
            </div>
        );
    }

    // Role-based rendering for non-admins (preserving Social Media Manager custom layout if any)
    const moreMenuItems = filteredNavItems.filter(item => item.isMore);
    const mainMenuItems = filteredNavItems.filter(item => !item.isMore);

    if (userProfile?.role === 'Social Media Manager') {
        const overviewIds = ['dashboard'];
        const toolIds = ['contentPlanner', 'dailyPosting', 'socialInbox'];
        const insightIds = ['socialReporting', 'analytics', 'reachTracker', 'leadAssignment'];

        const overviewItems = allMenuItems.filter(item => overviewIds.includes(item.id));
        const toolItems = allMenuItems.filter(item => toolIds.includes(item.id));
        const insightItems = allMenuItems.filter(item => insightIds.includes(item.id));

        return (
            <div className="space-y-4">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Main</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {overviewItems.map((item) => (
                                <SidebarMenuItem key={item.id}>
                                    <Link href={item.href}>
                                        <SidebarMenuButton isActive={pathname === item.href} tooltip={item.label}>
                                            {item.icon && <item.icon />}
                                            <span>{item.label}</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-indigo-500 px-4">Quick Tools</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {toolItems.map((item) => (
                                <SidebarMenuItem key={item.id}>
                                    <Link href={item.href}>
                                        <SidebarMenuButton isActive={pathname === item.href} tooltip={item.label}>
                                            {item.icon && <item.icon className="text-indigo-600" />}
                                            <span className="font-bold text-slate-700">{item.label}</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Insights & Assignment</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {insightItems.map((item) => (
                                <SidebarMenuItem key={item.id}>
                                    <Link href={item.href}>
                                        <SidebarMenuButton isActive={pathname === item.href} tooltip={item.label}>
                                            {item.icon && <item.icon />}
                                            <span>{item.label}</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </div>
        );
    }

    return (
        <SidebarMenu>
            {mainMenuItems.map((item) =>
                item.isMenu ? (
                    <DropdownMenu key={item.id}>
                        <SidebarMenuItem>
                            <Link href={item.href}>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton
                                        isActive={pathname.startsWith(item.href)}
                                        tooltip={item.label}
                                        className="w-full justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            {item.icon && <item.icon />}
                                            <span>{item.label}</span>
                                        </div>
                                        {state === 'expanded' && <ChevronDown className="h-4 w-4" />}
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                            </Link>
                        </SidebarMenuItem>
                        <DropdownMenuContent side="right" align="start" className={cn(state === 'collapsed' ? "ml-1" : "ml-8")}>
                            {item.subItems?.map(subItem => (
                                <DropdownMenuItem key={subItem.href} asChild>
                                    <Link href={subItem.href} className={cn(pathname === subItem.href && 'bg-accent')}>{subItem.label}</Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <SidebarMenuItem key={item.id}>
                        <Link href={item.href}>
                            <SidebarMenuButton
                                isActive={pathname === item.href}
                                tooltip={item.label}
                            >
                                {item.icon && <item.icon />}
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                )
            )}

            {moreMenuItems.length > 0 && (
                <DropdownMenu>
                    <SidebarMenuItem>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                isActive={pathname.startsWith('/more')}
                                tooltip="More"
                                className="w-full justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <MoreHorizontal />
                                    <span>More</span>
                                </div>
                                {state === 'expanded' && <ChevronDown className="h-4 w-4" />}
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                    </SidebarMenuItem>
                    <DropdownMenuContent side="right" align="start" className={cn(state === 'collapsed' ? "ml-1" : "ml-8")}>
                        {moreMenuItems.map(item => (
                            <DropdownMenuItem key={item.href} asChild>
                                <Link href={item.href} className={cn(pathname === item.href && 'bg-accent')}>{item.label}</Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </SidebarMenu>
    )
}

export default function Nav() {
    const { state } = useSidebar();
    const auth = useAuth();

    const handleLogout = () => {
        signOut(auth);
    };

    return (
        <>
            <SidebarHeader>
                <div className="flex items-center gap-2 p-2">
                    <Icon className="w-8 h-8 text-primary" />
                    {state === 'expanded' && (
                        <h1 className="font-bold text-lg font-headline">SkinSmith</h1>
                    )}
                </div>
            </SidebarHeader>

            <SidebarContent className="p-2">
                <NavContent />
            </SidebarContent>

            <SidebarFooter className="p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Link href="/settings">
                            <SidebarMenuButton tooltip="Settings">
                                <Settings />
                                <span>Settings</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Logout" onClick={handleLogout}>
                            <LogOut />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </>
    );
}
