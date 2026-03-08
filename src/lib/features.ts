export type FeatureCategory = 'Operations' | 'Sales' | 'Social Media' | 'Clinic' | 'Pharmacy' | 'Reports' | 'Intelligence' | 'General';

export interface Feature {
    id: string;
    label: string;
    href: string;
    category: FeatureCategory;
}

export const availableFeatures: Feature[] = [
    // General & Admin
    { id: 'dashboard', label: 'Dashboard Access', href: '/', category: 'General' },
    { id: 'aiTools', label: 'AI Recommendations', href: '/recommendations', category: 'Intelligence' },
    { id: 'userManagement', label: 'User Management', href: '/user-creation', category: 'Operations' },
    { id: 'featureControl', label: 'Feature Access Control', href: '/features', category: 'Operations' },
    { id: 'taskManagement', label: 'Manage Tasks (Admin)', href: '/admin/manage-tasks', category: 'Operations' },
    { id: 'admin_trainings', label: 'Manage Trainings (Admin)', href: '/admin/trainings', category: 'Operations' },
    { id: 'employeeReports', label: 'Employee Reports (Admin)', href: '/employee-reports', category: 'Reports' },

    // Workstation Management (Full Access Overrides)
    { id: 'mgmt_clinic', label: 'Manage Clinic (Full Access)', href: '/', category: 'Clinic' },
    { id: 'mgmt_organization', label: 'Manage Organization (Full Access)', href: '/', category: 'Operations' },
    { id: 'mgmt_reports', label: 'Reports & Analytics (Full Access)', href: '/', category: 'Intelligence' },

    // Clinic Operations
    { id: 'appointments', label: 'Appointments Management', href: '/appointments', category: 'Clinic' },
    { id: 'patients', label: 'Patient Management', href: '/patients', category: 'Clinic' },
    { id: 'doctors', label: 'Doctor Management', href: '/doctors', category: 'Clinic' },
    { id: 'procedures', label: 'Procedures Management', href: '/procedures', category: 'Clinic' },
    { id: 'billing', label: 'Billing & Invoicing', href: '/billing', category: 'Clinic' },
    { id: 'inventory', label: 'Inventory Management', href: '/inventory', category: 'Clinic' },
    { id: 'supplier', label: 'Supplier Management', href: '/supplier', category: 'Clinic' },

    // Pharmacy
    { id: 'pharmacy.full', label: 'Pharmacy (Full Access)', href: '/pharmacy/items', category: 'Pharmacy' },
    { id: 'pharmacy.pos', label: 'Pharmacy (POS Only)', href: '/pharmacy/pos', category: 'Pharmacy' },

    // Reports
    { id: 'reports.full', label: 'Reports (Full Access)', href: '/reports/appointments', category: 'Reports' },
    { id: 'reports.financial', label: 'Financial Reports', href: '/reports/financial', category: 'Reports' },
    { id: 'reports.inventory', label: 'Inventory Reports', href: '/reports/inventory', category: 'Reports' },

    // Sales Specific
    { id: 'salesDashboard', label: 'Sales Dashboard', href: '/sales-dashboard', category: 'Sales' },
    { id: 'leads', label: 'Leads Management (Sales)', href: '/leads', category: 'Sales' },
    { id: 'leadAssignment', label: 'Lead Assignment', href: '/leads/assignment', category: 'Sales' },
    { id: 'dailyReporting', label: 'Daily Reporting (Sales)', href: '/daily-reporting', category: 'Sales' },
    { id: 'dailyPosting', label: 'Daily Posting (Sales)', href: '/daily-posting', category: 'Sales' },
    { id: 'dailyTasks', label: 'Daily Tasks (Sales)', href: '/daily-tasks', category: 'Sales' },
    { id: 'dailyProgress', label: 'Daily Progress (Sales)', href: '/daily-progress', category: 'Sales' },
    { id: 'trainings_hub', label: 'Training Hub', href: '/trainings', category: 'Sales' },

    // Social Media Specific
    { id: 'socialReporting', label: 'Social Media Reporting', href: '/social-reporting', category: 'Social Media' },
    { id: 'contentPlanner', label: 'Content Planner', href: '/content-planner', category: 'Social Media' },
    { id: 'analytics', label: 'Social Analytics', href: '/analytics', category: 'Social Media' },
    { id: 'reachTracker', label: 'Social Reach Tracker', href: '/analytics/reach', category: 'Social Media' },
    { id: 'socialInbox', label: 'Social Inbox', href: '/social-inbox', category: 'Social Media' },

    // Designer Specific
    { id: 'designerWork', label: 'Designer Workstation', href: '/designer-dashboard', category: 'Operations' },
    { id: 'creativeBriefs', label: 'Creative Briefs', href: '/daily-tasks', category: 'Operations' },

    // Doctor Specific
    { id: 'healthRecords', label: 'Health Records (Doctor)', href: '/health-records', category: 'Clinic' },
    { id: 'ePrescription', label: 'E-Prescription (Doctor)', href: '/e-prescription', category: 'Clinic' },
];
