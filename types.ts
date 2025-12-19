
export type Role = 'Manager' | 'Lead' | 'Resource';

export interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  maxProjects: number;
  maxMembersPerProject: number;
  maxUploadSizeMb: number;
  maxUploadsPerTaskLimit: number;
  canInviteMembers: boolean;
  canUploadImages: boolean;
  canSetReminders: boolean;
  canUseNotifications: boolean;
  canExportData: boolean;
  canViewHistory: boolean;
  historyRetentionDays: number | null;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  email?: string;
  avatar?: string;
  // Admin/Premium Settings
  createdAt?: number; // Timestamp
  premiumUntil?: number; // Timestamp or null
  isPremium?: boolean; // Explicit premium flag from database

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
}

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
  code: string; // 6-char join code
  managerId: string; // The Creator
  leadIds: string[]; // Derived from project_members
  resourceIds: string[]; // Derived from project_members
  pendingJoinRequests: string[]; // Derived from project_members where status = pending
  reportsTo: Record<string, string>; // Map: resourceUserId -> leadUserId
  themeColor: string; // Hex for primary color
  autoMoveEnabled: boolean; // Enable auto-move from Pending to In Progress (default: true)
  viewAllReportsEnabled?: boolean; // If true, all members can see all reports (default: false)
  manager?: User & { hasPremiumAccess?: boolean }; // Full manager details including premium status
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
  Manager: {
    createProject: true,
    deleteProject: true,
    manageTeam: true,
    editSettings: true,
    manageColumns: true,
    manageTasks: true,
    manageTags: true,
  },
  Lead: {
    createProject: true,
    deleteProject: false,
    manageTeam: true,
    editSettings: false,
    manageColumns: true,
    manageTasks: true,
    manageTags: true,
  },
  Resource: {
    createProject: true,
    deleteProject: false,
    manageTeam: false,
    editSettings: false,
    manageColumns: true,
    manageTasks: true,
    manageTags: true,
  },
};

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
