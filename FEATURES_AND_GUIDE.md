# 🌟 DoneOne: Comprehensive Features & Guide

This document serves as the master guide for all functionality in DoneOne, including recent updates.

## 🚀 Getting Started

### Installation
1.  Load the extension in Chrome Developer Mode.
2.  Pin the extension for easy access.
3.  Log in or Sign up.

### Core Concepts
-   **Projects**: Workspaces for your teams.
-   **Columns**: Stages of work (e.g., Pending, In Progress, Done).
-   **Tasks**: Individual items of work.
-   **Roles**: Manager (Creator), Lead (Team Lead), Resource (Member).

---

## 🛠️ Key Features

### 1. Task Management (Kanban)
-   **Drag & Drop**: Move tasks between columns.
-   **Auto-Move**: Tasks moved to "In Progress" automatically get a `startedAt` timestamp. Tasks moved to "Done" get a `completedAt` timestamp.
-   **Quick Add**: Use `Ctrl+Shift+F` or Right-Click on any webpage to add a task instantly.
-   **Timers**: Track time spent on tasks with the Play/Pause button.

### 2. History & Archiving
-   **Task History**: View archived tasks in the **History** tab.
-   **Filters**: Filter history by Date Range, Assignee, or Search query.
-   **Export**: Export history to CSV (All, Filtered, or Selected).
-   **Retention**: Admins can set retention policies to auto-delete old history.

### 3. Reports & Analytics (NEW)
-   **Dashboard**: Access via the **Reports** sidebar link.
-   **Charts**:
    -   **Status Distribution**: Pie chart showing tasks per column.
    -   **Assignee Workload**: Bar chart showing tasks per user.
-   **Detailed Table**: View task details including "Started" and "Completed" dates.
-   **Filters**: Analyze data by Date Range and Assignee.

### 4. Admin Panel
-   **User Management**: View all users, manage roles.
-   **System Settings**:
    -   Toggle Registration (Open/Closed).
    -   Toggle Image Uploads (Global/Per User).
    -   Set History Retention policies.

### 5. Collaboration
-   **Real-time Sync**: Updates appear instantly for all team members.
-   **Notifications**: Get notified when tasks are moved or assigned to you.
-   **Team Roles**: Granular permissions for Managers, Leads, and Resources.

---

## ⌨️ Shortcuts

| Action | Shortcut |
| :--- | :--- |
| Quick Add Task | `Ctrl + Shift + F` |
| Close Modal | `Esc` |
| Save Task | `Enter` |

---

## 🔧 Technical Details (For Developers)

### Database Schema
-   **Tables**: `profiles`, `projects`, `tasks`, `columns`, `project_members`, `activities`, `notifications`, `tags`, `system_settings`, `task_history`.
-   **Realtime**: Enabled for `tasks`, `columns`, `projects`, `project_members`, `notifications`.

### Optimization
-   **Smart Fetching**: The app only fetches data for tables that have changed, reducing network load.
-   **Parallel Loading**: Initial data load fetches all resources in parallel for speed.
-   **Idempotency**: Prevents duplicate listeners and multiple initializations.

---

## 📂 File Structure Overview
-   `manifest.json`: Extension configuration.
-   `background.ts`: Service worker for context menus and notifications.
-   `content.ts`: Script for Quick Add modal on webpages.
-   `store.ts`: Central state management (Zustand) and Supabase logic.
-   `App.tsx`: Main React application component.
-   `components/`: UI components (Board, History, Reports, etc.).
-   `complete_schema.sql`: **Master SQL file** for database setup.
