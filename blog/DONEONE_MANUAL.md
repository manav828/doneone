# ✅ DoneOne Professional User Manual

**Version:** 2.0  
**Last Updated:** February 2026

---

## 📖 Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Core Workflows](#core-workflows)
4. [View Modes](#view-modes)
5. [Task Management Features](#task-management-features)
6. [Productivity & Analytics](#productivity--analytics)
7. [Organization & Workspace Management](#organization--workspace-management)
8. [Billing & Plans](#billing--plans)
9. [Administration & Teams](#administration--teams)
10. [Enterprise Features](#enterprise-features)
11. [UI Customization & Preferences](#ui-customization--preferences)
12. [Troubleshooting](#troubleshooting)

---

## <a id="introduction"></a>1. Introduction

**DoneOne** is a premium, enterprise-grade task management platform designed for professionals and teams who demand high performance, visual clarity, and complete data control. Built with modern web technologies and powered by Supabase, DoneOne combines Kanban-style workflows with advanced productivity tracking, organization management, and enterprise-level security features.

### Key Benefits
- **Seamless Integration**: Capture tasks from any webpage instantly with browser extension
- **Multi-View Flexibility**: Switch between Kanban, List, and Calendar views
- **Enterprise Organization Structure**: Manage workspaces, departments, and teams hierarchically
- **Real-Time Collaboration**: Live sync across all team members
- **Advanced Analytics**: Productivity trends, workload analysis, and comprehensive reporting
- **Complete Data Control**: Self-hosted deployment options and full data export
- **Premium UI/UX**: Modern, aesthetic interface with customizable themes and animations

---

## <a id="getting-started"></a>2. Getting Started

### Account Creation & Login
1. **Sign Up**: Navigate to the landing page and click "Get Started"
2. **Authentication**: Powered by Supabase Auth for secure login/signup
3. **Email Verification**: Confirm your email to activate your account
4. **Welcome Modal**: First-time users see trial information and quick start guide

### Installation (Browser Extension)
1. **Load Extension**: Go to `chrome://extensions/`, enable Developer Mode
2. **Install**: Load the unpacked extension or install from Chrome Web Store
3. **Pin Extension**: Pin the DoneOne icon to your browser toolbar for quick access
4. **Global Shortcut**: Use `Ctrl + Shift + F` to quickly add tasks from any webpage

### Initial Setup
1. **Create Organization** (Optional): Set up your company structure with workspaces and departments
2. **Create Your First Project**: Start with a personal project or team workspace
3. **Invite Team Members**: Share join codes or email invitations
4. **Choose Your Plan**: Start with free trial or upgrade to Pro/Enterprise

---

## <a id="core-workflows"></a>3. Core Workflows

### ⚡ Quick Add Task
Capture tasks instantly without context switching:
- **Keyboard Shortcut**: `Ctrl + Shift + F` from any webpage
- **Extension Icon**: Click toolbar icon for quick task creation
- **Context Menu**: Right-click on any webpage → "Add to DoneOne"
- **Smart Defaults**: Auto-selects recent project and assigns to you
- **From Any Page**: Extract text selections or URLs automatically

### Creating & Managing Tasks

#### Task Creation
- **Add Task Button**: Click "+ Add Task" at the bottom of any column
- **Quick Entry**: Type and press Enter for rapid task creation
- **From Templates**: Use predefined task templates for common workflows
- **Bulk Import**: Import tasks from CSV or other project management tools

#### Task Properties
Each task supports comprehensive metadata:
- **Title & Description**: Rich text descriptions with markdown support
- **Assignee**: Assign to any team member
- **Priority Levels**: High, Medium, Low with visual indicators
  - Custom colors: High (#ffa39c), Medium (#9dc5ff), Low (#ffdc75)
  - Border or gradient priority styles with animations
- **Due Dates**: Set deadlines with calendar picker
- **Reminders**: Set notification reminders for yourself or team members
- **Labels & Tags**: Custom categorization
- **Attachments**: Upload images and files (with permission)
- **Subtasks**: Break down complex tasks into smaller steps
- **Time Tracking**: Manual or automatic time logging
- **Custom Fields**: Additional metadata based on project templates

#### Subtasks Feature
**Timeline-Style Subtask UI** with premium design:
- **Circular Checkboxes**: Visual completion tracking
- **Timeline View**: Vertical timeline with connector lines
- **Secondary Text**: Add notes or details to each subtask
- **Drag & Reorder**: Rearrange subtasks with drag-and-drop
- **Progress Tracking**: Automatic calculation of completion percentage
- **Nested Subtasks**: Multi-level task breakdown
- **Add Button**: Dashed "+ Add Subtask" button for intuitive creation

#### Moving Tasks
- **Drag & Drop**: Move tasks between columns
- **Auto-Timestamps**: 
  - Moving to "In Progress" sets `startedAt` timestamp
  - Moving to "Done" sets `completedAt` timestamp
- **Status Updates**: Automatic status tracking
- **History Logging**: All movements are tracked in task history

### ⏱️ Advanced Time Tracking

#### Automatic Time Tracking
- **Swipe to Start**: Premium swipe button animation with speed lines
  - Idle nudge animation to guide users
  - Accelerating speed lines during swipe
- **Play/Pause**: Simple timer controls on task cards
- **Auto-Stop**: Stops when task is moved to "Done"
- **Session Logging**: All time sessions saved with timestamps

#### Manual Time Entry
- **Forgot to Track?**: Add time manually in the task detail view
- **Actual Time Field**: Enter hours and minutes directly
- **Time Adjustments**: Edit tracked time sessions
- **Bulk Time Entry**: Add time to multiple tasks at once

#### Time Display
- **Compact Cards**: Minimal tracked time display on cards
- **Reduced Spacing**: Optimized card height for better density
- **Time Summary**: Total time per task, project, and user
- **Time Reports**: Detailed breakdowns in Reports section

---

## <a id="view-modes"></a>4. View Modes

DoneOne provides three distinct view modes, each optimized for different workflows:

### 📋 Kanban Board (Default)
**Visual workflow management**
- **Drag & Drop**: Intuitive task movement between columns
- **Custom Columns**: Create unlimited custom workflow stages
- **Column Collapsing**: Hide columns to focus on specific stages
- **Column Reordering**: Reorganize your workflow visually
- **WIP Limits**: Set work-in-progress limits per column
- **Visual Tags**: Color-coded priority and status indicators
- **Compact Card Design**: Minimal, beautiful task cards

### 📝 List View
**Data-dense task management**
- **Sortable Columns**: Sort by any field (priority, assignee, due date)
- **Bulk Actions**: Select and modify multiple tasks
- **Quick Filters**: Filter by status, assignee, priority
- **Compact Rows**: See more tasks at once
- **Inline Editing**: Quick edits without opening modals
- **Export Ready**: Optimized layout for data export

### 📅 Calendar View
**Timeline-based planning**
- **Monthly Overview**: See all tasks with due dates
- **Drag to Reschedule**: Move tasks to different dates visually
- **Today Highlight**: Clear indication of current date
- **Multi-Day Tasks**: Span tasks across multiple days
- **Color Coding**: Tasks colored by project or priority
- **Agenda View**: Daily/weekly task list alongside calendar

**View Switching**: Toggle between views using the top-right view selector without losing your place.

---

## <a id="task-management-features"></a>5. Task Management Features

### 🔍 Search & Filters

#### Global Search
- **Title Search**: Find tasks by name
- **Content Search**: Search within task descriptions
- **Assignee Search**: Find tasks by team member
- **Real-time Results**: Instant search as you type
- **Search Across Projects**: Organization-wide search (Enterprise)

#### Advanced Filtering
- **Filter by Assignee**: See tasks assigned to specific users
- **Filter by Priority**: Focus on high-priority items
- **Filter by Due Date**: Overdue, today, this week, custom ranges
- **Filter by Status**: Active, completed, archived
- **Filter by Labels**: Custom tag filtering
- **Combined Filters**: Apply multiple filters simultaneously
- **Save Filter Presets**: Quick access to frequently used filters

### 🔔 Reminders & Notifications

#### Task Reminders
- **Set Reminders**: Choose date and time for notifications
- **Multiple Recipients**: Remind yourself and team members
- **Browser Notifications**: Desktop notifications when reminders trigger
- **Notification Permission**: Request system notification access
- **Reminder Polling**: Checks every 30 seconds for active reminders
- **Smart Timing**: Reminders trigger within 1-minute window

#### Notification Types
- **Task Assigned**: When you're assigned to a task
- **Due Date Approaching**: Warnings before deadlines
- **Task Completed**: When assigned tasks are completed
- **Comment Mentions**: When someone mentions you
- **Status Changes**: Track important task movements

### 📂 History & Archives

#### Task History
- **Complete Audit Trail**: All task changes logged
- **Who Changed What**: User attribution for all modifications
- **Timestamp Tracking**: Exact time of each change
- **Restore Previous Versions**: Undo unwanted changes
- **Export History**: Download complete audit logs

#### Archive Management
- **Automatic Archiving**: Configure retention policies
- **Manual Archive**: Archive completed projects
- **Restore from Archive**: Bring back archived tasks
- **Archive Search**: Find old tasks easily
- **Storage Optimization**: Keep your workspace clean

### 🎨 Priority Styles & Visual Customization

#### Priority Visual Styles
Choose from multiple priority indication styles:
- **Border Style**: Colored borders around task cards
- **Gradient Style**: Animated gradient backgrounds
- **Static vs Animated**: Toggle subtle animations
- **Custom Colors**: 
  - High Priority: `#ffa39c` (coral red)
  - Medium Priority: `#9dc5ff` (sky blue)
  - Low Priority: `#ffdc75` (warm yellow)

#### Visual Feedback
- **Hover Effects**: Interactive task card animations
- **Completion Sounds**: High-quality audio feedback (Todoist-inspired)
- **Drag Indicators**: Visual guides during drag operations
- **Loading States**: Smooth transitions and skeleton screens

---

## <a id="productivity--analytics"></a>6. Productivity & Analytics

### 📊 Productivity Trend Chart

**Real-time productivity visualization:**
- **Completion Tracking**: Tasks completed over time
- **Automatic Timestamping**: Uses `completedAt` or falls back to `updatedAt`
- **Daily/Weekly/Monthly Views**: Flexible time ranges
- **Done Column Integration**: Automatically tracks tasks in "Done" column
- **Trend Analysis**: Identify productivity patterns
- **Performance Metrics**: Compare against previous periods

### 📈 Reports Page (Organization-Level)

#### Available for All Users
- **Personal Dashboard**: Solo users see personal performance metrics
- **Task Distribution**: Pie charts of status breakdown
- **Time Analytics**: Hours tracked per day/week/month
- **Completion Rates**: Track your productivity trends

#### Manager & Enterprise Reports
- **Organization Overview**: Company-wide analytics
- **Department Performance**: Team-level insights
- **Workspace Analytics**: Project-specific metrics
- **Member-Level Details**: Individual performance tracking
- **Workload Analysis**: Identify overloaded team members
- **Capacity Planning**: Resource allocation insights
- **Time Reports**: Aggregate hours by project, user, or department
- **Export Reports**: Download as CSV or PDF

#### Reports Features (Mobile-Optimized)
- **Responsive Design**: Full functionality on mobile devices
- **Touch-Friendly Charts**: Interactive visualizations
- **Quick Filters**: Swipe to change date ranges
- **Real-time Updates**: Live data synchronization

### 📉 History Page (Multi-Level)

**Role-Specific History Views:**
- **Super Admin**: See entire organization history
- **Organization Admin**: All workspaces and departments
- **Department Manager**: Department-level history
- **Project Lead**: Project-specific history
- **Team Member**: Personal task history

**History Features:**
- **Completed Tasks**: Archive of finished work
- **Activity Timeline**: Chronological event log
- **Filter & Search**: Find historical tasks easily
- **Performance Insights**: Analyze past productivity
- **Export History**: Download historical data

---

## <a id="organization--workspace-management"></a>7. Organization & Workspace Management

### 🏢 Enterprise Organization Structure

DoneOne supports a hierarchical organization model:

```
Organization (Company)
├── Workspace 1 (Department/Division)
│   ├── Team 1 (Project/Group)
│   ├── Team 2
│   └── Team 3
├── Workspace 2
│   ├── Team 1
│   └── Team 2
└── Personal Projects (User-owned)
```

### Creating an Organization

1. **From Personal Projects**: Click the "Move to Organization" icon
2. **Migration Wizard**: Follow step-by-step migration tutorial
3. **Create Workspaces**: Set up departments or divisions
4. **Add Departments**: Organize teams within workspaces
5. **Invite Members**: Add team members to specific departments

### Workspace Settings

**Access**: Navigate to `/workspace` or click Workspace icon in sidebar

#### Workspace Configuration
- **Workspace Name**: Rename departments
- **Description**: Add context for the workspace purpose
- **Member Management**: Add/remove team members
- **Role Assignment**: Set user roles and permissions
- **Join Codes**: Generate invitation links
- **Workspace Icon**: Custom branding (Enterprise)

#### Department Management
- **Create Departments**: Add new teams within workspace
- **Department Settings**: Configure per-department preferences
- **Move Members**: Transfer users between departments
- **Unassigned Users**: Manage pending user assignments
- **Waiting Screen**: Users see holding screen until assigned

### Project Migration

**Solo Project to Organization Migration:**

1. **Identify Personal Projects**: Find projects you want to move
2. **Click Migration Icon**: "Move to Organization" button
3. **Select/Create Organization**: Choose existing or create new
4. **Choose Workspace**: Select department for the project
5. **Confirm Transfer**: Review and confirm migration
6. **Tutorial Available**: In-app guide in Help section

**Migration Features:**
- **Preserve Data**: All tasks, history, and attachments retained
- **Role Conversion**: Creator becomes department manager
- **Member Transfer**: All project members moved to new structure
- **Reversible**: Can move back if needed (contact admin)

### Help Guide & Tutorials

**Searchable Help System:**
- **Search Bar**: Find help articles quickly
- **Migration Tutorial**: Visual, step-by-step project migration guide
- **Feature Guides**: Detailed explanations of all features
- **Video Walkthroughs**: Embedded tutorial videos
- **FAQ Section**: Common questions and answers
- **Contact Support**: Direct link to support channels

---

## <a id="billing--plans"></a>8. Billing & Plans

### Plan Tiers

#### Free Tier
- 1 personal project
- Basic task management
- Kanban, List, Calendar views
- Up to 3 team members
- Community support

#### Pro Plan
**Monthly or Annual billing**
- Unlimited projects
- Unlimited team members
- Advanced analytics
- Priority support
- Custom branding
- API access
- Time tracking
- Subtasks & templates

#### Enterprise Plan
**Custom pricing**
- Everything in Pro, plus:
- **Self-Hosted Deployment**: Host on your own infrastructure
- **Custom Domain with SSL**: Your branded domain
- **24/7 Priority Support**: Dedicated support team
- **Advanced Audit Logs**: Complete compliance tracking
- **SSO & SAML Authentication**: Enterprise security integration
- **Custom Integrations**: API customization
- **Dedicated Account Manager**: Personal onboarding and support
- **SLA Guarantees**: Uptime and performance commitments

### Billing Page

**Access**: Profile dropdown → "Billing & Plans"

#### Features
- **Current Plan Display**: See active subscription details
- **Seat Management**: Add or remove user seats
- **Billing Interval Toggle**: Switch between monthly/annual
- **Sticky Footer**: Shows real-time pricing as you adjust
- **Line Item Breakdown**: Separate display of plan price and seat pricing
- **Upgrade/Downgrade**: Change plans anytime
- **Cancel Subscription**: Self-service cancellation

#### Seat Management
- **Add Seats**: Increase team capacity
- **Remove Seats**: Decrease unused seats
- **Pro-rated Billing**: Automatic cost adjustments
- **Workspace Capacity**: See seat allocation per department
- **Remove "Add Seat" Buttons**: Streamlined from workspace capacity sections

### Checkout Page

**Optimized Checkout Experience:**
- **Plan Summary**: Clear pricing breakdown
- **Annual Toggle**: Switch billing period in checkout
- **Seat Counter**: Adjust team size before purchase
  - **Hidden Arrows**: Clean counter design (no up/down arrows)
- **Payment Methods**: Credit card, PayPal (Stripe integration)
- **Tax Calculation**: Automatic based on location
- **Secure Payment**: PCI-compliant processing
- **Order Confirmation**: Instant email receipt

### Compare Plans Page

**Interactive Plan Comparison:**
- **Side-by-Side View**: All plans in one view
- **Enterprise Perks Section**: Highlighted premium features
  - Self-Hosted Deployment
  - Custom Domain SSL
  - 24/7 Priority Support
  - Advanced Audit Logs
  - SSO & SAML Auth
- **Feature Checklist**: Detailed feature comparison
- **Exclusive Enterprise Features**: Clear indication of Enterprise-only perks
- **Premium Aesthetic**: Beautiful, modern design
- **Call-to-Action**: Direct links to checkout

### Billing History

**Access**: `/billing-history`

**Features:**
- **Invoice List**: All past invoices
- **Download Invoices**: PDF download for accounting
- **Payment Status**: Paid, pending, failed
- **Payment Methods**: View and update card details
- **Refund Requests**: Submit refund inquiries

### Custom Plans

**Enterprise Custom Pricing:**
- **JSONB Storage**: Custom plan data stored in `custom_plan_data` column
- **Dynamic Pricing**: Per-seat pricing or custom rates
- **Snapshot on Modify**: Plan details saved when seats change
- **Fallback Logic**: Uses plans table if custom data is empty
- **Request Custom Quote**: Contact sales for tailored pricing

---

## <a id="administration--teams"></a>9. Administration & Teams

### 👥 User Roles & Permissions

#### Role Hierarchy
1. **Super Admin** (System-wide)
   - Full system access
   - User management
   - Global settings
   - All organization access

2. **Organization Admin**
   - Manage organization settings
   - Create/delete workspaces
   - Assign workspace managers
   - View organization reports

3. **Workspace Manager**
   - Manage workspace/department
   - Create/delete teams (projects)
   - Assign team leads
   - View workspace reports

4. **Team Lead**
   - Manage project settings
   - Add/remove team members
   - Manage tasks and columns
   - Cannot delete project

5. **Team Member (Resource)**
   - View and move tasks
   - Update assigned tasks
   - Limited administrative access

### ⚙️ Super Admin Panel

**Access**: Hardcoded for `manavss828@gmail.com` (Super Admin only)

**Route Protection**: `/admin` route protected with email verification

#### Admin Features
- **User Management**:
  - Approve new users
  - Disable/enable user accounts
  - Delete users (with cascade handling)
  - Reset passwords
  - View all user activity

- **Organization Management**:
  - Create/delete organizations
  - Assign organization admins
  - View all workspaces and teams

- **System Settings**:
  - **Image Upload Permissions**: Toggle globally or per-user
  - **Registration Control**: Open/close new sign-ups
  - **Archive Policies**: Set automatic archiving rules
  - **Data Retention**: Configure history retention
  - **Feature Flags**: Enable/disable features system-wide

- **Monitoring & Logs**:
  - View system activity
  - Monitor user sessions
  - Track API usage
  - Review error logs

### 👨‍👩‍👧‍👦 Team Management

#### Project Members Modal
- **View All Members**: See everyone on the project
- **Role Assignment**: Change user roles
- **Remove Members**: Remove access to project
- **Add Members**: Invite via email or join code
- **Permissions Matrix**: Visual role permission display

#### Join Team Modal
- **Join Code Entry**: Enter 6-digit code to join
- **Workspace Selection**: Choose department (if applicable)
- **Instant Access**: Immediate access upon joining
- **Role Assignment**: Default role based on org structure

#### Manage Member Departments
**Multi-Department Assignment:**
- **View Assignments**: See which departments user belongs to
- **Add to Departments**: Assign to multiple teams
- **Remove from Departments**: Revoke department access
- **Primary Department**: Set default workspace
- **Transfer Users**: Move between departments

### 🔐 User Authentication & Security

#### Supabase Authentication
- **Email/Password**: Standard authentication
- **Email Verification**: Required for account activation
- **Password Reset**: Self-service password recovery
- **Session Management**: Secure token-based sessions
- **Auto-logout**: Configurable timeout periods

#### Security Features
- **Row-Level Security (RLS)**: Database-level access control
- **API Authentication**: Secured API endpoints
- **CORS Protection**: Prevent unauthorized access
- **Rate Limiting**: Prevent abuse
- **Audit Logging**: Track all user actions (Enterprise)

### User Deletion

**Improved Delete Functionality:**
- **Cascade Handling**: Properly removes:
  - User assignments
  - Task ownership
  - Team memberships
  - Manager relationships (fixed `manager_id` column reference)
- **Data Retention**: Option to anonymize instead of delete
- **Confirmation Required**: Prevent accidental deletions

---

## <a id="enterprise-features"></a>10. Enterprise Features

### 🏢 Self-Hosted Deployment

**Host DoneOne on Your Infrastructure:**
- **Complete Control**: Full data sovereignty
- **Custom Infrastructure**: Deploy on AWS, Azure, GCP, or on-premise
- **Docker Support**: Containerized deployment
- **Scalability**: Scale resources as needed
- **Private Network**: No external data transmission
- **Backup Control**: Manage your own backups

**Setup Guide:**
- Detailed deployment documentation
- Docker Compose templates
- Environment configuration
- Database migration scripts
- Load balancer configuration

### 🔒 SSO & SAML Authentication

**Enterprise Identity Integration:**
- **SAML 2.0 Support**: Integrate with enterprise identity providers
- **SSO Providers**: Support for Okta, Azure AD, Google Workspace, OneLogin
- **Automatic Provisioning**: Auto-create users from SSO
- **De-provisioning**: Remove access when users leave
- **Role Mapping**: Map SSO groups to DoneOne roles
- **Multi-Factor Authentication**: Leverage your existing MFA

### 📊 Advanced Audit Logs

**Compliance & Security Tracking:**
- **Complete Activity Log**: Every action logged with timestamp
- **User Attribution**: Who did what and when
- **IP Tracking**: Source IP for all actions
- **Data Changes**: Before/after snapshots of modifications
- **Export Logs**: Download for compliance reporting
- **Retention Policies**: Configurable log retention
- **Search & Filter**: Find specific actions quickly
- **Compliance Reports**: SOC 2, ISO 27001, GDPR ready

### 🌐 Custom Domain with SSL

**Brand Your Installation:**
- **Custom Domain**: Use your company domain (e.g., `tasks.yourcompany.com`)
- **Auto SSL**: Automatic Let's Encrypt certificates
- **HTTPS Enforced**: Secure connections only
- **DNS Configuration**: Simple CNAME setup
- **Email Branding**: Notifications from your domain

### 🎯 24/7 Priority Support

**Dedicated Enterprise Support:**
- **24/7 Availability**: Round-the-clock support team
- **Priority Queue**: Faster response times
- **Dedicated Slack Channel**: Direct line to support team
- **Account Manager**: Personal contact for your organization
- **Onboarding Services**: Guided implementation
- **Training Sessions**: Team training and best practices
- **SLA Guarantees**: Committed response and resolution times

### 🔌 Custom Integrations & API

**Extensibility for Enterprise:**
- **REST API**: Full programmatic access to all features
- **Webhooks**: Real-time event notifications
- **Custom Fields**: Add organization-specific metadata
- **Integrations**: Connect with your existing tools
  - Slack, Microsoft Teams notifications
  - JIRA, Linear bidirectional sync
  - Zapier automation
  - Custom internal systems
- **API Documentation**: Comprehensive developer docs
- **Rate Limits**: Custom limits for enterprise

---

## <a id="ui-customization--preferences"></a>11. UI Customization & Preferences

### 🎨 Visual Customization

#### Logo Customization
- **Logo Toggle**: Switch between logo variants (logo1, logo2)
- **Increased Size**: Logos set to h-16 for better visibility
- **Custom Logos**: Upload your company logo (Enterprise)
- **Dark Mode Variants**: Separate logos for light/dark themes

#### Font Selection
- **Font Toggle**: Choose from multiple premium fonts
- **Google Fonts**: Inter, Roboto, Outfit, and more
- **System Fonts**: Use OS default fonts
- **Readability Optimized**: Fonts chosen for clarity
- **Custom Fonts**: Upload custom fonts (Enterprise)

#### Priority Style Selection
- **Style Toggle**: Switch between border and gradient styles
- **Animation Toggle**: Enable/disable subtle animations
- **Custom Colors**: Configure priority colors per organization
- **Accessibility**: Meet WCAG contrast requirements

### 🌗 Dark Mode

**Premium Dark Theme:**
- **Auto-Detection**: Follows system preference
- **Manual Toggle**: Switch anytime in preferences
- **Persistent**: Saves your choice across sessions
- **Component-Level**: Every component optimized for dark mode
- **Glassmorphism**: Modern translucent effects
- **Contrast Optimized**: Easy on the eyes for long sessions

### 📱 Mobile Experience

#### Responsive Design
- **Mobile-First**: Optimized for all screen sizes
- **Touch Gestures**: Swipe, pinch, drag fully supported
- **Bottom Navigation**: Mobile-optimized nav bar
- **Drawer Menus**: Swipe-out sidebars for mobile
- **Responsive Charts**: Touch-friendly analytics

#### Mobile-Specific Features
- **Filter Bottom Sheet**: Swipe-up filter panel
- **Mobile Search**: Full-screen search experience
- **Task Cards**: Optimized for small screens
- **Quick Actions**: Swipe gestures for common actions

### 🎭 Animations & Effects

**Premium Micro-Interactions:**
- **Swipe to Start Button**: 
  - Idle nudge animation
  - Accelerating speed lines
  - Smooth handle movement
  - Haptic feedback (mobile)

- **Task Completion**:
  - High-quality completion sounds
  - Todoist-inspired audio feedback
  - Celebration animations
  - Confetti effects (optional)

- **Drag & Drop**:
  - Visual drag indicators
  - Drop zone highlighting
  - Smooth animations
  - Spring physics

- **Loading States**:
  - Skeleton screens
  - Progress indicators
  - Smooth transitions
  - No jarring jumps

### ⚙️ User Preferences

**Access**: Profile → Settings

- **Notifications**: Configure notification preferences
- **Language**: Select interface language (i18n ready)
- **Time Zone**: Set for accurate timestamps
- **Date Format**: Choose date display format
- **Start of Week**: Monday or Sunday
- **Default View**: Kanban, List, or Calendar
- **Compact Mode**: Denser information display
- **Sound Effects**: Enable/disable audio feedback

---

## <a id="troubleshooting"></a>12. Troubleshooting

### Common Issues & Solutions

| Issue | Solution |
| :--- | :--- |
| **Extension not opening** | Ensure Developer Mode is enabled in `chrome://extensions/`. Reload the extension. |
| **Sync issues** | Check internet connection. Look for green cloud icon. Try logging out and back in. |
| **Cannot upload images** | Contact your Manager or Admin to enable upload permissions for your account. |
| **Forgot Password** | Use "Forgot Password" link on login page. Check your email for reset link. |
| **Tasks not appearing in productivity chart** | Ensure tasks are in "Done" column. Chart uses `completedAt` or `updatedAt` timestamps. |
| **Calendar view not loading** | Check for React Hooks errors in console. Ensure component structure is consistent between mobile/desktop. |
| **User deletion errors** | Contact Super Admin. Ensure proper cascade handling for related data. |
| **"Waiting for Department" screen** | Contact organization admin to assign you to a workspace/department. |
| **Billing page errors** | Ensure `custom_plan_data` JSONB is properly formatted. Contact support if issues persist. |
| **Migration to organization fails** | Ensure you have permission to create organizations. Check that all project data is valid. |
| **Reminders not triggering** | Grant browser notification permissions. Check reminder time is set correctly. |
| **Charts showing no data** | Verify filter selections. Ensure date range includes completed tasks. |
| **Subtasks not saving** | Check for lint errors. Ensure `isLast` prop is passed to SortableSubtaskItem. |

### Performance Optimization

**If DoneOne feels slow:**
- **Clear Browser Cache**: Remove old cached data
- **Reduce Active Filters**: Too many filters can slow searches
- **Archive Old Projects**: Keep active workspace clean
- **Check Internet Speed**: Minimum 1 Mbps recommended
- **Update Browser**: Use latest Chrome version
- **Disable Unused Extensions**: Other extensions may conflict

### Data Issues

**Missing or incorrect data:**
- **Check Filters**: Ensure no active filters hiding tasks
- **Verify Permissions**: Confirm you have access to the project
- **Sync Status**: Look for sync icon issues
- **Refresh Page**: Force a full data reload
- **Check History**: Look in History page for archived items
- **Contact Admin**: They can verify database state

### Getting Help

#### Self-Service Resources
- **Help Guide**: In-app searchable documentation
- **Video Tutorials**: Step-by-step visual guides
- **FAQ Section**: Common questions answered
- **Migration Tutorials**: Specific workflow guides

#### Support Channels
- **Free/Pro**: Email support (support@doneone.com)
- **Enterprise**: 24/7 priority support, dedicated Slack channel
- **Community**: User forums and discussions
- **Bug Reports**: GitHub issues (for self-hosted deployments)

---

## 📋 Feature Summary

DoneOne includes all of the following features:

### Core Task Management
✅ Quick task creation (Ctrl+Shift+F)  
✅ Drag & drop Kanban boards  
✅ List view with sorting  
✅ Calendar view with scheduling  
✅ Rich text descriptions  
✅ Task assignments  
✅ Priority levels (with custom colors)  
✅ Due dates and reminders  
✅ Labels and tags  
✅ File attachments  
✅ Subtasks with timeline UI  
✅ Task templates  

### Time & Productivity
✅ Time tracking with play/pause  
✅ Swipe-to-start button with animations  
✅ Manual time entry  
✅ Productivity trend charts  
✅ Completion sound effects  
✅ Workload analysis  
✅ Performance metrics  

### Organization & Teams
✅ Hierarchical organization structure  
✅ Workspaces (departments)  
✅ Teams (projects)  
✅ Role-based permissions (5 levels)  
✅ Team member management  
✅ Join codes and invitations  
✅ Project migration tools  
✅ Multi-department assignments  

### Analytics & Reporting
✅ Organization-level reports  
✅ Department performance tracking  
✅ Individual productivity metrics  
✅ Status distribution charts  
✅ Time reports by user/project  
✅ Historical data analysis  
✅ Export to CSV/PDF  

### Billing & Plans
✅ Free, Pro, Enterprise tiers  
✅ Seat-based pricing  
✅ Monthly/Annual billing  
✅ Self-service checkout  
✅ Billing history and invoices  
✅ Plan comparison page  
✅ Custom enterprise pricing  
✅ Seat management UI  

### Enterprise Features
✅ Self-hosted deployment  
✅ Custom domain with SSL  
✅ SSO & SAML authentication  
✅ Advanced audit logs  
✅ 24/7 priority support  
✅ Custom integrations  
✅ API access  
✅ Dedicated account manager  

### UI/UX Features
✅ Dark mode  
✅ Multiple logo variants  
✅ Font customization  
✅ Priority style toggle (border/gradient)  
✅ Micro-animations  
✅ Mobile-responsive design  
✅ Bottom navigation (mobile)  
✅ Filter bottom sheet (mobile)  
✅ Accessible design  
✅ Skeleton loading states  
✅ Sound effects toggle  

### Administration
✅ Super admin panel  
✅ User management (approve/disable/delete)  
✅ Global settings control  
✅ Image upload permissions  
✅ Registration control  
✅ Archive policies  
✅ Data export tools  

### Search & Filters
✅ Global task search  
✅ Searchable help guide  
✅ Filter by assignee  
✅ Filter by priority  
✅ Filter by due date  
✅ Filter by status  
✅ Combined filters  
✅ Saved filter presets  

### Authentication & Security
✅ Supabase authentication  
✅ Email verification  
✅ Password reset  
✅ Row-level security (RLS)  
✅ Session management  
✅ Rate limiting  
✅ CORS protection  

### Integrations & Extensibility
✅ Browser extension  
✅ Context menu integration  
✅ Global keyboard shortcuts  
✅ REST API  
✅ Webhooks  
✅ Custom fields  

---

## 🚀 What's Next?

DoneOne continues to evolve with regular updates and new features. Coming soon:

- **AI Task Suggestions**: Intelligent task creation and prioritization
- **Advanced Automation**: Workflow automation rules
- **More Integrations**: Expanded third-party app support
- **Mobile Apps**: Native iOS and Android applications
- **Voice Commands**: Add tasks via voice
- **Advanced Templates**: Industry-specific workflows
- **Gantt Charts**: Project timeline visualization
- **Resource Planning**: Advanced capacity management

---

**DoneOne** - Professional task management for modern teams.  
*Get Things Done, Without Leaving Where You Are.*

---

**Version 2.0** - February 2026  
© 2026 DoneOne. All rights reserved.  

For support, visit: [support.doneone.com](https://support.doneone.com)  
Enterprise sales: [sales@doneone.com](mailto:sales@doneone.com)
