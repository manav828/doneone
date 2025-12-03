
export type Role = 'Manager' | 'Lead' | 'Resource';

export interface User {
  id: string;
  name: string;
  role: Role;
  email?: string;
  avatar?: string;
  // Admin/Premium Settings
  isPremium?: boolean;
  maxProjects?: number;
  maxLeads?: number;
  maxResources?: number;
  notificationsEnabled?: boolean; // notificationsEnabled: boolean;
  remindersEnabled: boolean;
  timeTrackingEnabled: boolean;
  imageUploadEnabled: boolean;
  maxAttachmentsPerTask: number;
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
  reminderAt?: number; // Timestamp
  timeTracked?: number; // Total seconds tracked
  estimatedTime?: number; // Estimated time in seconds
  timerStartedAt?: number; // Timestamp when timer started, or null if stopped
  attachments?: string[]; // Array of image URLs
  // Browser capture features (Phase 1)
  capturedUrl?: string; // URL of webpage where task was created
  capturedText?: string; // Selected text from webpage
  capturedScreenshot?: string; // Screenshot URL (Phase 3)
  // Auto-move features
  isHighlighted?: boolean; // Visual highlight for auto-moved tasks
}

export interface Column {
  id: string;
  projectId: string;
  title: string;
  orderIndex: number;
  color?: string;
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
