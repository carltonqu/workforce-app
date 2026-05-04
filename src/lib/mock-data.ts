// Mock Data for ClockRoster Role-Based Testing

export const ROLES = {
  ADMIN: ["MANAGER", "HR"] as const,
  SUPERVISOR: ["MANAGER", "HR", "SUPERVISOR"] as const,
  EMPLOYEE: ["EMPLOYEE"] as const,
  ALL: ["MANAGER", "HR", "SUPERVISOR", "EMPLOYEE"] as const,
};

export type Role = (typeof ROLES.ALL)[number];

// User roles with descriptions
export const ROLE_DESCRIPTIONS: Record<Role, { label: string; description: string; color: string }> = {
  MANAGER: {
    label: "Manager",
    description: "Full system access - can manage all aspects of the workforce system",
    color: "blue",
  },
  HR: {
    label: "HR",
    description: "Full system access - focused on HR functions and employee management",
    color: "blue",
  },
  SUPERVISOR: {
    label: "Supervisor",
    description: "Team management access - can manage their team members and assignments",
    color: "purple",
  },
  EMPLOYEE: {
    label: "Employee",
    description: "Personal access - can only view and manage their own data",
    color: "emerald",
  },
};

// Mock users for testing different roles
export const MOCK_USERS = [
  {
    id: "admin-1",
    name: "Admin User",
    email: "admin@clockroster.com",
    role: "MANAGER" as Role,
    tier: "PRO",
    orgId: "org-1",
  },
  {
    id: "hr-1",
    name: "HR Manager",
    email: "hr@clockroster.com",
    role: "HR" as Role,
    tier: "PRO",
    orgId: "org-1",
  },
  {
    id: "supervisor-1",
    name: "Team Supervisor",
    email: "supervisor@clockroster.com",
    role: "SUPERVISOR" as Role,
    tier: "PRO",
    orgId: "org-1",
    teamSize: 8,
  },
  {
    id: "employee-1",
    name: "John Employee",
    email: "john@clockroster.com",
    role: "EMPLOYEE" as Role,
    tier: "FREE",
    orgId: "org-1",
    department: "Engineering",
    position: "Developer",
  },
  {
    id: "employee-2",
    name: "Jane Worker",
    email: "jane@clockroster.com",
    role: "EMPLOYEE" as Role,
    tier: "FREE",
    orgId: "org-1",
    department: "Design",
    position: "Designer",
  },
];

// Dashboard access rules
export const DASHBOARD_ACCESS = {
  ADMIN: {
    path: "/dashboard/admin",
    allowedRoles: ["MANAGER", "HR"],
    features: [
      "system_overview",
      "user_management",
      "system_settings",
      "all_reports",
      "payroll_admin",
      "company_config",
      "integrations",
      "backups",
    ],
  },
  SUPERVISOR: {
    path: "/dashboard/supervisor",
    allowedRoles: ["MANAGER", "HR", "SUPERVISOR"],
    features: [
      "team_overview",
      "task_management",
      "employee_monitoring",
      "team_attendance",
      "leave_approvals",
      "team_reports",
      "announcements",
    ],
    excludedFeatures: [
      "system_settings",
      "full_user_management",
      "payroll_admin",
      "company_wide_config",
    ],
  },
  EMPLOYEE: {
    path: "/dashboard/employee",
    allowedRoles: ["EMPLOYEE"],
    features: [
      "personal_dashboard",
      "my_schedule",
      "my_tasks",
      "my_attendance",
      "clock_in_out",
      "request_leave",
      "view_payslips",
      "view_announcements",
      "profile_management",
    ],
    excludedFeatures: [
      "other_employees_data",
      "team_management",
      "reports",
      "admin_functions",
    ],
  },
};

// Mock stats for admin dashboard
export const MOCK_ADMIN_STATS = {
  totalEmployees: 42,
  activeEmployees: 38,
  inactiveEmployees: 4,
  onLeaveEmployees: 3,
  clockedInNow: 28,
  lateToday: 2,
  absentToday: 5,
  pendingApprovals: 7,
  payrollAlerts: 1,
  systemHealth: {
    status: "healthy" as const,
    uptime: "99.9%",
    lastBackup: "2 hours ago",
    storageUsed: "45%",
  },
  todayAttendance: [
    { id: "1", employeeName: "Alice Johnson", department: "Engineering", status: "Clocked In", actualIn: "08:30:00", actualOut: null },
    { id: "2", employeeName: "Bob Smith", department: "Design", status: "Clocked In", actualIn: "09:00:00", actualOut: null },
    { id: "3", employeeName: "Carol White", department: "Engineering", status: "Late", actualIn: "09:30:00", actualOut: null },
    { id: "4", employeeName: "David Brown", department: "Product", status: "On Leave", actualIn: null, actualOut: null },
    { id: "5", employeeName: "Emma Davis", department: "Engineering", status: "Absent", actualIn: null, actualOut: null },
  ],
  pendingApprovalsList: [
    { id: "1", employeeName: "Alice Johnson", requestType: "Vacation Leave", createdAt: "2024-04-20T10:00:00Z" },
    { id: "2", employeeName: "Bob Smith", requestType: "Sick Leave", createdAt: "2024-04-23T08:00:00Z" },
    { id: "3", employeeName: "Carol White", requestType: "Asset Request", createdAt: "2024-04-22T14:00:00Z" },
  ],
  recentActivity: [
    { id: "1", employeeName: "Alice Johnson", action: "Clocked in", time: "8:30 AM" },
    { id: "2", employeeName: "Bob Smith", action: "Submitted leave request", time: "9:00 AM" },
    { id: "3", employeeName: "HR Manager", action: "Approved payroll", time: "10:15 AM" },
    { id: "4", employeeName: "Carol White", action: "Updated profile", time: "11:00 AM" },
  ],
  financialSummary: {
    month: "April 2024",
    totalGross: 1250000,
    totalNet: 987500,
    totalDeductions: 262500,
    totalReleased: 750000,
    totalApproved: 237500,
    expectedTotal: 1250000,
    entryCount: 38,
    draftCount: 2,
    approvedCount: 10,
    releasedCount: 26,
  },
};

// Mock stats for supervisor dashboard
export const MOCK_SUPERVISOR_STATS = {
  teamStats: {
    totalMembers: 8,
    activeNow: 6,
    onLeave: 1,
    absentToday: 1,
    pendingTasks: 5,
    pendingLeaveRequests: 2,
  },
  teamMembers: [
    { id: "1", name: "Alice Johnson", position: "Developer", department: "Engineering", status: "active" as const, clockedIn: true, lastClockIn: "08:30 AM" },
    { id: "2", name: "Bob Smith", position: "Designer", department: "Design", status: "active" as const, clockedIn: true, lastClockIn: "09:00 AM" },
    { id: "3", name: "Carol White", position: "QA Engineer", department: "Engineering", status: "active" as const, clockedIn: false },
    { id: "4", name: "David Brown", position: "Product Manager", department: "Product", status: "on_leave" as const, clockedIn: false },
    { id: "5", name: "Emma Davis", position: "Developer", department: "Engineering", status: "absent" as const, clockedIn: false },
    { id: "6", name: "Frank Miller", position: "DevOps", department: "Engineering", status: "active" as const, clockedIn: true, lastClockIn: "08:45 AM" },
    { id: "7", name: "Grace Lee", position: "Designer", department: "Design", status: "active" as const, clockedIn: true, lastClockIn: "09:15 AM" },
    { id: "8", name: "Henry Wilson", position: "Developer", department: "Engineering", status: "active" as const, clockedIn: true, lastClockIn: "08:50 AM" },
  ],
  tasks: [
    { id: "1", title: "Complete Q3 Report", assignedTo: "Alice Johnson", dueDate: "2024-04-25", status: "in_progress" as const, priority: "high" as const },
    { id: "2", title: "Review Design Mockups", assignedTo: "Bob Smith", dueDate: "2024-04-26", status: "pending" as const, priority: "medium" as const },
    { id: "3", title: "Fix Bug #1234", assignedTo: "Henry Wilson", dueDate: "2024-04-24", status: "completed" as const, priority: "high" as const },
    { id: "4", title: "Update Documentation", assignedTo: "Frank Miller", dueDate: "2024-04-28", status: "pending" as const, priority: "low" as const },
    { id: "5", title: "Team Meeting Prep", assignedTo: "Grace Lee", dueDate: "2024-04-25", status: "in_progress" as const, priority: "medium" as const },
  ],
  leaveRequests: [
    { id: "1", employeeName: "David Brown", leaveType: "Vacation", startDate: "2024-04-24", endDate: "2024-04-26", status: "pending" as const, createdAt: "2024-04-20T10:00:00Z" },
    { id: "2", employeeName: "Emma Davis", leaveType: "Sick Leave", startDate: "2024-04-24", endDate: "2024-04-24", status: "pending" as const, createdAt: "2024-04-23T08:00:00Z" },
  ],
};

// Mock stats for employee dashboard
export const MOCK_EMPLOYEE_STATS = {
  personalStats: {
    hoursThisWeek: 32.5,
    hoursThisMonth: 128.0,
    overtimeHours: 8.5,
    pendingTasks: 3,
    unreadNotifications: 2,
  },
  todayShift: {
    id: "1",
    date: new Date().toISOString().slice(0, 10),
    shiftStart: "09:00",
    shiftEnd: "18:00",
    shiftName: "Regular Shift",
    location: "Main Office",
  },
  leaveBalances: [
    { leaveType: "Vacation", totalDays: 15, usedDays: 5, remainingDays: 10 },
    { leaveType: "Sick Leave", totalDays: 10, usedDays: 2, remainingDays: 8 },
    { leaveType: "Personal", totalDays: 5, usedDays: 1, remainingDays: 4 },
  ],
  tasks: [
    { id: "1", title: "Complete project documentation", description: "Update API docs", dueDate: "2024-04-25", status: "in_progress" as const, priority: "medium" as const },
    { id: "2", title: "Code review for sprint", description: "Review team PRs", dueDate: "2024-04-24", status: "pending" as const, priority: "high" as const },
    { id: "3", title: "Weekly team update", description: "Prepare slides", dueDate: "2024-04-26", status: "pending" as const, priority: "low" as const },
  ],
  recentRequests: [
    { id: "1", requestType: "Vacation Leave", status: "Approved", createdAt: "2024-04-15T10:00:00Z" },
    { id: "2", requestType: "Asset Request", status: "Pending", createdAt: "2024-04-22T14:00:00Z" },
  ],
  payslips: [
    { id: "1", periodStart: "2024-04-01", periodEnd: "2024-04-15", totalPay: 25000, status: "released" as const },
    { id: "2", periodStart: "2024-03-16", periodEnd: "2024-03-31", totalPay: 25000, status: "released" as const },
  ],
  announcements: [
    { id: "1", title: "Company Offsite", content: "Join us for the annual company offsite next month!", createdAt: "2024-04-23T10:00:00Z", author: "HR Team" },
    { id: "2", title: "New Benefits Program", content: "We've updated our benefits package. Check the details.", createdAt: "2024-04-22T14:00:00Z", author: "Management" },
  ],
};

// Navigation permissions by role
export const NAVIGATION_PERMISSIONS = {
  MANAGER: {
    dashboard: "/dashboard/admin",
    canAccess: ["*"], // All routes
    sections: ["Overview", "People", "Operations", "Finance", "Administration"],
  },
  HR: {
    dashboard: "/dashboard/admin",
    canAccess: ["*"], // All routes
    sections: ["Overview", "People", "Operations", "Finance", "Administration"],
  },
  SUPERVISOR: {
    dashboard: "/dashboard/supervisor",
    canAccess: [
      "/dashboard/supervisor",
      "/employees",
      "/attendance",
      "/performance",
      "/leave",
      "/supervisor-assignments",
      "/announcements",
      "/settings",
    ],
    sections: ["Overview", "My Team", "Reports", "System"],
  },
  EMPLOYEE: {
    dashboard: "/dashboard/employee",
    canAccess: [
      "/dashboard/employee",
      "/clock",
      "/my-assets",
      "/my-requests",
      "/my-schedule",
      "/my-payslips",
      "/my-profile",
      "/settings",
      "/notifications",
      "/announcements",
    ],
    sections: ["My Workspace", "Requests", "Personal"],
  },
};

// Helper function to check if a user can access a route
export function canAccessRoute(role: Role, path: string): boolean {
  const permissions = NAVIGATION_PERMISSIONS[role];
  if (!permissions) return false;
  
  if (permissions.canAccess.includes("*")) return true;
  
  return permissions.canAccess.some(allowedPath => 
    path === allowedPath || path.startsWith(allowedPath + "/")
  );
}

// Helper function to get dashboard path for role
export function getDashboardPath(role: Role): string {
  return NAVIGATION_PERMISSIONS[role]?.dashboard || "/dashboard";
}
