export const availableFeatures = [
    // General & Admin
    { id: 'trainings_hub', label: 'Training', href: '/trainings' },
    { id: 'leadAssignment', label: 'Lead Assignment', href: '/leads/assignment' },
    { id: 'dashboard', label: 'Dashboard Access', href: '/' },
    { id: 'appointments', label: 'Appointments Management', href: '/appointments' },
    { id: 'patients', label: 'Patient Management', href: '/patients' },
    { id: 'doctors', label: 'Doctor Management', href: '/doctors' },
    { id: 'userManagement', label: 'User Management', href: '/user-creation' },
    { id: 'featureControl', label: 'Feature Access Control', href: '/features' },
    { id: 'aiTools', label: 'AI Recommendations', href: '/recommendations' },

    // Pharmacy
    { id: 'pharmacy.full', label: 'Pharmacy (Full Access)', href: '/pharmacy/items' },
    { id: 'pharmacy.pos', label: 'Pharmacy (POS Only)', href: '/pharmacy/pos' },

    // Reports
    { id: 'reports.full', label: 'Reports (Full Access)', href: '/reports/appointments' },
    { id: 'reports.financial', label: 'Financial Reports', href: '/reports/financial' },
    { id: 'reports.inventory', label: 'Inventory Reports', href: '/reports/inventory' },

    // Doctor Specific
    { id: 'healthRecords', label: 'Health Records (Doctor)', href: '/health-records' },
    { id: 'ePrescription', label: 'E-Prescription (Doctor)', href: '/e-prescription' },

    // Sales Specific
    { id: 'salesDashboard', label: 'Sales Dashboard', href: '/sales-dashboard' },
    { id: 'leads', label: 'Leads Management (Sales)', href: '/leads' },
    { id: 'dailyReporting', label: 'Daily Reporting (Sales)', href: '/daily-reporting' },
    { id: 'dailyPosting', label: 'Daily Posting (Sales)', href: '/daily-posting' },
    { id: 'dailyTasks', label: 'Daily Tasks (Sales)', href: '/daily-tasks' },
    { id: 'dailyProgress', label: 'Daily Progress (Sales)', href: '/daily-progress' },


    // Social Media Specific
    { id: 'socialReporting', label: 'Social Media Reporting', href: '/social-reporting' },
    { id: 'contentPlanner', label: 'Content Planner', href: '/content-planner' },
    { id: 'analytics', label: 'Social Analytics', href: '/analytics' },
    { id: 'reachTracker', label: 'Social Reach Tracker', href: '/analytics/reach' },
    { id: 'socialInbox', label: 'Social Inbox', href: '/social-inbox' },

    // Designer Specific
    { id: 'designerWork', label: 'Designer Workstation', href: '/designer-dashboard' },
    { id: 'creativeBriefs', label: 'Creative Briefs', href: '/daily-tasks' },

    // Admin Specific Overrides/New
    { id: 'employeeReports', label: 'Employee Reports (Admin)', href: '/employee-reports' },
    { id: 'taskManagement', label: 'Manage Tasks (Admin)', href: '/admin/manage-tasks' },
    { id: 'admin_trainings', label: 'Manage Trainings (Admin)', href: '/admin/trainings' },
];
