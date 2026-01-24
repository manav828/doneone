
export type Role = 'Admin' | 'DeptHead' | 'Manager' | 'Lead' | 'Resource';

export interface Company {
  id: string;
  name: string;
  joinCode: string;
  ownerId: string;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  currency: string;
  region?: string;

  // Pricing (snake_case - primary)
  price_monthly: number;
  price_yearly: number;
  price_per_seat_monthly: number;
  price_per_seat_yearly: number;

  // Limits (snake_case - primary)
  max_projects: number;
  max_members_per_project: number;
  max_leads_per_project: number;
  max_upload_size_mb?: number;
  max_images_per_task: number;
  history_retention_days: number | null;

  // Features (snake_case - primary)
  can_invite_members: boolean;
  can_upload_images: boolean;
  can_set_reminders: boolean;
  can_use_notifications: boolean;
  can_export_data: boolean;
  can_view_history: boolean;

  // Legacy camelCase (optional for backward compatibility)
  priceMonthly?: number;
  priceYearly?: number;
  maxProjects?: number;
  maxMembersPerProject?: number;
  maxLeadsPerProject?: number;
  maxUploadSizeMb?: number;
  maxUploadsPerTaskLimit?: number;
  canInviteMembers?: boolean;
  canUploadImages?: boolean;
  canSetReminders?: boolean;
  canUseNotifications?: boolean;
  canExportData?: boolean;
  canViewHistory?: boolean;
  historyRetentionDays?: number | null;
}

export interface CustomPlanData {
  billingInterval?: 'monthly' | 'yearly';
  baseCost?: number;
  seatCost?: number;
  extraSeats?: number;
  maxProjects?: number;
  maxLeads?: number;
  maxResources?: number;
  maxAttachments?: number;
  reminders?: boolean;
  notifications?: boolean;
  timeTracking?: boolean;
  imageUpload?: boolean;
  historyRetentionDays?: number;
  canExport?: boolean;
  canInvite?: boolean;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  email?: string;
  avatar?: string;
  companyId?: string;

  // NEW: Plan Subscription System
  planId?: string; // UUID linking to plans table
  billingInterval?: 'monthly' | 'yearly'; // For standard plans
  isCustomPlan?: boolean; // If true, use customPlanData
  customPlanData?: CustomPlanData; // JSONB for custom plan users
  premiumUntil?: number; // Timestamp - subscription expiry
  renewalDate?: number; // Timestamp
  createdAt?: number; // Timestamp

  // DEPRECATED: These will be removed after migration
  // Kept for backward compatibility during transition
  isPremium?: boolean;
  planBaseCost?: number;
  perSeatCost?: number;
  extraSeats?: number;
  maxProjects?: number;
  maxLeads?: number;
  maxResources?: number;
  notificationsEnabled?: boolean;
  remindersEnabled: boolean;
  timeTrackingEnabled: boolean;
  imageUploadEnabled: boolean;
  maxAttachmentsPerTask: number;
  autoArchiveDays?: number;
  historyRetentionDays?: number | null;
  canInvite?: boolean;
  canExport?: boolean;
  allowMultipleInProgress?: boolean;
  onboardingCompleted?: boolean;
  currency: 'USD' | 'INR';
  soundEnabled?: boolean; // Default: true - controls audio feedback for actions
}

export type CurrencyType = 'USD' | 'INR';

export interface EnterpriseInquiry {
  id: string;
  userId?: string;
  email: string;
  phone?: string;
  country?: string;
  companyName?: string;
  teamSize?: string;
  requiredFeatures?: string[];
  requirements?: string;
  status: 'pending' | 'contacted' | 'converted' | 'dismissed';
  adminNotes?: string;
  createdAt: number;
  updatedAt: number;
  // Computed
  userName?: string;
}

export interface Tag {
  id: string;
  projectId?: string; // Linked to specific project
  name: string;
  color: string; // Hex code
  type: 'Priority' | 'Type' | 'Custom';
}

export interface Task {
  id: string;
  columnId: string;
  projectId: string;
  title: string;
  description?: string;
  assigneeId?: string; // UUID
  creatorId: string; // UUID
  tagIds: string[];
  createdAt: number;
  updatedAt: number;
  orderIndex: number;
  reminderAt?: number;
  reminderUserIds?: string[]; // Array of user IDs for multi-user reminders
  timeTracked?: number;
  estimatedTime?: number;
  timerStartedAt?: number;
  startedAt?: number;
  completedAt?: number;
  attachments?: string[];
  capturedUrl?: string;
  capturedText?: string;
  capturedScreenshot?: string;
  isHighlighted?: boolean;
  isReminderDismissed?: boolean;
  priority?: 'high' | 'medium' | 'low'; // Task priority level
  // Discussion Task Fields
  isDiscussion?: boolean;
  discussionUserIds?: string[];
  discussionEnded?: boolean;
  // Recurring Task Fields
  recurrence?: RecurrenceConfig | null;
  subtasks?: Subtask[];
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
  orderIndex: number;
}

export interface RecurrenceConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number; // e.g. 1 for "Every 1 week"
  daysOfWeek?: number[]; // 0=Sun, 1=Mon, etc.
  endsAt?: number | null; // Timestamp or null for "Never"
  nextTriggerAt: number; // Timestamp of next creation
  lastGeneratedAt?: number;
}

// ============================================================
// TEAM-BASED ARCHITECTURE TYPES
// ============================================================

export interface Team {
  id: string;
  ownerId: string;
  name: string;
  joinCode: string;
  createdAt: number;
  companyId?: string; // Links to companies table
  managerIds?: string[]; // Team Heads (Department Heads)
  // Computed/Joined
  owner?: User;
  memberCount?: number;
  effectiveLimit?: number; // plan.maxMembers + extraSeats
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  roleId?: string;
  status: 'active' | 'pending' | 'rejected';
  joinedAt: number;
  // Computed/Joined
  user?: User;
  role?: TeamRole;
}

export interface TeamRole {
  id: string;
  teamId: string;
  name: string;
  color?: string;
  createdAt?: number;
}

export interface Department {
  id: string;
  teamId: string;
  name: string;
  color?: string;
  createdAt?: number;
  managerIds?: string[]; // Department Heads
  // Computed
  memberCount?: number;
}

export interface DepartmentMember {
  departmentId: string;
  userId: string;
  user?: User;
}

// ============================================================

export interface Column {
  id: string;
  projectId: string;
  title: string;
  orderIndex: number;
  color?: string;
  isArchiveEnabled?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  code?: string; // DEPRECATED: Join codes now at team level (kept for backward compat)
  teamId?: string; // NEW: Link to team (null for personal/free projects)
  departmentId?: string; // NEW: Link to department
  ownerId: string; // The Creator
  managerIds?: string[]; // NEW: Delegated Project Managers
  leadIds: string[]; // Derived from project_members
  resourceIds: string[]; // Derived from project_members
  pendingJoinRequests: string[]; // Derived from project_members where status = pending
  reportsTo: Record<string, string>; // Map: resourceUserId -> leadUserId
  // themeColor removed for Unified Design System
  autoMoveEnabled: boolean; // Enable auto-move from Pending to In Progress (default: true)
  viewAllReportsEnabled?: boolean; // If true, all members can see all reports (default: false)
  owner?: User & { hasPremiumAccess?: boolean }; // Full owner details including premium status
  logo?: string; // URL to project logo image
  // Computed
  team?: Team;
}

export interface Activity {
  id: string;
  projectId: string;
  userId: string;
  description: string;
  timestamp: number;
}

export interface Notification {
  id: string;
  recipientId: string;
  projectId: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'info' | 'alert';
}

// Permission map
export const PERMISSIONS = {
  Admin: {
    createProject: true,
    deleteProject: true,
    manageTeam: true,
    editSettings: true,
    manageColumns: true,
    manageTasks: true,
    manageTags: true,
    assignProjectManager: true,
    assignLead: true,
    viewAllDepartments: true,
    viewAllProjects: true,
    manageBilling: true,
    viewAuditLogs: true,
  },
  DeptHead: {
    createProject: true,
    deleteProject: true,
    manageTeam: true, // Can only assign/remove within their Dept
    editSettings: true,
    manageColumns: true,
    manageTasks: true,
    manageTags: true,
    assignProjectManager: true,
    assignLead: true,
  },
  Manager: {
    createProject: false, // RESTRICTED
    deleteProject: false,
    manageTeam: false,    // RESTRICTED (Cannot invite/remove)
    editSettings: true,
    manageColumns: true,
    manageTasks: true,
    manageTags: true,
    assignProjectManager: false,
    assignLead: true,     // Can assign Leads within their Project
  },
  Lead: {
    createProject: false, // RESTRICTED
    deleteProject: false,
    manageTeam: false,    // RESTRICTED
    editSettings: false,
    manageColumns: true,
    manageTasks: true,
    manageTags: true,
    assignProjectManager: false,
    assignLead: false,
  },
  Resource: {
    createProject: false, // RESTRICTED
    deleteProject: false,
    manageTeam: false,
    editSettings: false,
    manageColumns: true,
    manageTasks: true,
    manageTags: true,
    assignProjectManager: false,
    assignLead: false,
  },
};

export interface AppState {
  toggleTaskTimer: (taskId: string) => Promise<void>;

  // Billing
  addSeat: (seats: number) => Promise<void>;

  // Transactions
  transactions: Transaction[];
  fetchTransactions: () => Promise<void>;

  // Local State
  activeProjectId: string | null;
  taskData: Task;
  statusAtArchive: string;
  timeTaken: number;
  archivedAt: number;
  archivedBy?: string;
}

export interface TaskHistory {
  id: string;
  taskId: string;
  projectId: string;
  taskData: Task;
  statusAtArchive: string;
  timeTaken: number;
  archivedAt: number;
  archivedBy?: string;
}

export interface ArchiveSettings {
  userId: string;
  autoArchiveDays: number;
  historyRetentionDays?: number | null;
  createdAt?: number;
  updatedAt: number;
}

declare var chrome: any;

// Helper to sync data to Chrome Storage for content script access
export const syncToChromeStorage = (key: string, data: any) => {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ [key]: data });
  }
};



export interface StorageStats {
  totalBytes: number;
  fileCount: number;
  databaseBytes?: number; // Optional for backward compatibility
}

export interface AdminRetentionSettings {
  id: number;
  retentionDays: number | null;
  createdAt?: number;
  updatedAt: number;
}

export interface HistoryFilter {
  projectId?: string;
  dateStart?: string | null;
  dateEnd?: string | null;
  assigneeIds?: string[];
  tagIds?: string[];
  statusAtArchive?: string;
  timeTakenMin?: number;
  timeTakenMax?: number;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  status: string; // 'open' | 'resolved' | 'dismissed'
  createdAt: number;
  userName?: string; // Computed
  userEmail?: string; // Computed
  resolution_note?: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'completed' | 'failed' | 'refunded';
  description: string;
  created_at: string;
}

// ============================================================
// ANALYTICS & REPORTING TYPES
// ============================================================

export type ReportScope = 'personal' | 'team' | 'project' | 'department' | 'workspace' | 'member';

export interface UserMetrics {
  userId: string;
  userName: string;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksPending: number;
  tasksOverdue: number;
  totalTimeTracked: number; // seconds
  avgCompletionTime: number; // seconds
  productivityTrend: number[]; // last 7 days task counts
  velocityScore: number; // 0-100
}

export interface ProjectMetrics {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  totalTimeTracked: number;
  healthScore: number; // 0-100
  onTimeRate: number; // percentage
  avgCycleTime: number; // seconds
  bottleneckColumn?: string;
  memberMetrics: UserMetrics[];
}

export interface DepartmentMetrics {
  departmentId: string;
  departmentName: string;
  totalProjects: number;
  activeMembers: number;
  totalTasks: number;
  completedTasks: number;
  totalTimeTracked: number;
  avgHealthScore: number;
  projectMetrics: ProjectMetrics[];
}

export interface WorkspaceMetrics {
  workspaceId: string;
  workspaceName: string;
  totalDepartments: number;
  totalProjects: number;
  totalMembers: number;
  totalTasks: number;
  completedTasks: number;
  totalTimeTracked: number;
  avgHealthScore: number;
  departmentMetrics: DepartmentMetrics[];
}
