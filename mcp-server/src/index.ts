import express from 'express';
import cors from 'cors';
import { authenticate, requirePremium, McpAuthError, McpPermissionError, McpRateLimitError } from './auth.js';
import { checkAndLogRateLimit, getRateLimitStatus } from './rateLimiter.js';
import { requirePermission, hasPermission } from './rbac.js';

// Tool handlers
import * as TaskTools from './tools/tasks.js';
import * as ProjectTools from './tools/projects.js';
import * as TeamTools from './tools/teams.js';
import * as ReportTools from './tools/reports.js';
import * as TagTools from './tools/tags.js';

// ============================================================
// MCP Server Setup (HTTP SSE transport)
// ============================================================
const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const PORT = Number(process.env.PORT ?? 3000);

// ============================================================
// Health Check
// ============================================================
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'DoneOne MCP Server', version: '1.0.0' });
});

// ============================================================
// MCP Tool Definitions (sent to AI tools on connection)
// ============================================================
const TOOL_DEFINITIONS = [
  // --- Auth ---
  {
    name: 'get_my_profile',
    description: 'Get the current user profile, role, and premium status',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'get_rate_limit_status',
    description: 'Check how many API calls you have used and how many remain',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  // --- Tasks ---
  {
    name: 'list_tasks',
    description: 'List tasks in a project. Filter by status, assignee, or priority.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'The project ID' },
        assigneeId: { type: 'string', description: 'Filter by assignee user ID' },
        priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Filter by priority' },
        limit: { type: 'number', description: 'Max tasks to return (default: 50)' },
        offset: { type: 'number', description: 'Pagination offset (default: 0)' }
      },
      required: ['projectId']
    }
  },
  {
    name: 'get_task',
    description: 'Get full details of a specific task including subtasks and time tracking',
    inputSchema: {
      type: 'object',
      properties: { taskId: { type: 'string', description: 'The task ID' } },
      required: ['taskId']
    }
  },
  {
    name: 'create_task',
    description: 'Create a new task in a project column. Requires Lead role or higher.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        columnId: { type: 'string', description: 'The column/status to place the task in' },
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description (optional)' },
        assigneeId: { type: 'string', description: 'User ID to assign the task to (optional)' },
        priority: { type: 'string', enum: ['high', 'medium', 'low'] },
        estimatedTime: { type: 'number', description: 'Estimated time in seconds' }
      },
      required: ['projectId', 'columnId', 'title']
    }
  },
  {
    name: 'update_task',
    description: 'Update task title, description, priority, or assignee',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['high', 'medium', 'low'] },
        assigneeId: { type: 'string' },
        estimatedTime: { type: 'number' }
      },
      required: ['taskId']
    }
  },
  {
    name: 'move_task',
    description: 'Move a task to a different column/status',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        columnId: { type: 'string', description: 'Target column ID' }
      },
      required: ['taskId', 'columnId']
    }
  },
  {
    name: 'delete_task',
    description: 'Permanently delete a task. Requires Manager role or higher.',
    inputSchema: {
      type: 'object',
      properties: { taskId: { type: 'string' } },
      required: ['taskId']
    }
  },
  {
    name: 'start_timer',
    description: 'Start the time tracker on a task',
    inputSchema: {
      type: 'object',
      properties: { taskId: { type: 'string' } },
      required: ['taskId']
    }
  },
  {
    name: 'stop_timer',
    description: 'Stop the time tracker on a task and save the elapsed time',
    inputSchema: {
      type: 'object',
      properties: { taskId: { type: 'string' } },
      required: ['taskId']
    }
  },
  {
    name: 'log_time',
    description: 'Manually log time on a task in seconds',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        seconds: { type: 'number', description: 'Number of seconds to log' }
      },
      required: ['taskId', 'seconds']
    }
  },
  {
    name: 'set_task_reminder',
    description: 'Set a reminder for a task at a specific date/time',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        reminderAt: { type: 'string', description: 'ISO 8601 date-time string e.g. "2025-12-31T10:00:00Z"' }
      },
      required: ['taskId', 'reminderAt']
    }
  },
  // --- Projects ---
  {
    name: 'list_projects',
    description: 'List all projects you have access to',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number' } },
      required: []
    }
  },
  {
    name: 'get_project',
    description: 'Get project details, columns, and member list',
    inputSchema: {
      type: 'object',
      properties: { projectId: { type: 'string' } },
      required: ['projectId']
    }
  },
  {
    name: 'create_project',
    description: 'Create a new project. Requires DeptHead role or higher.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        teamId: { type: 'string', description: 'Link to a team (optional)' }
      },
      required: ['name']
    }
  },
  {
    name: 'update_project',
    description: 'Update project name or description. Requires Manager role or higher.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' }
      },
      required: ['projectId']
    }
  },
  {
    name: 'archive_project',
    description: 'Archive (soft-delete) a project. Requires Manager role or higher.',
    inputSchema: {
      type: 'object',
      properties: { projectId: { type: 'string' } },
      required: ['projectId']
    }
  },
  {
    name: 'list_columns',
    description: 'List all columns/statuses in a project',
    inputSchema: {
      type: 'object',
      properties: { projectId: { type: 'string' } },
      required: ['projectId']
    }
  },
  {
    name: 'create_column',
    description: 'Add a new status column to a project. Requires Lead role or higher.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        title: { type: 'string' },
        color: { type: 'string', description: 'Hex color e.g. #FF5733' }
      },
      required: ['projectId', 'title']
    }
  },
  {
    name: 'rename_column',
    description: 'Rename a column. Requires Lead role or higher.',
    inputSchema: {
      type: 'object',
      properties: {
        columnId: { type: 'string' },
        title: { type: 'string' }
      },
      required: ['columnId', 'title']
    }
  },
  {
    name: 'get_project_members',
    description: 'List all members of a project with their roles',
    inputSchema: {
      type: 'object',
      properties: { projectId: { type: 'string' } },
      required: ['projectId']
    }
  },
  {
    name: 'change_member_role',
    description: 'Change a member\'s role in a project. Requires Manager role or higher.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        targetUserId: { type: 'string' },
        newRole: { type: 'string', enum: ['Lead', 'Resource'] }
      },
      required: ['projectId', 'targetUserId', 'newRole']
    }
  },
  {
    name: 'remove_member',
    description: 'Remove a member from a project. Requires Manager role or higher.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        targetUserId: { type: 'string' }
      },
      required: ['projectId', 'targetUserId']
    }
  },
  // --- Teams ---
  {
    name: 'get_my_team',
    description: 'Get your current team information',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'list_team_members',
    description: 'List all members of a team. Requires Manager role or higher.',
    inputSchema: {
      type: 'object',
      properties: {
        teamId: { type: 'string' },
        status: { type: 'string', enum: ['active', 'pending', 'rejected'] }
      },
      required: ['teamId']
    }
  },
  {
    name: 'approve_join_request',
    description: 'Approve a pending join request. Requires DeptHead role or higher.',
    inputSchema: {
      type: 'object',
      properties: { teamId: { type: 'string' }, targetUserId: { type: 'string' } },
      required: ['teamId', 'targetUserId']
    }
  },
  {
    name: 'reject_join_request',
    description: 'Reject a pending join request. Requires DeptHead role or higher.',
    inputSchema: {
      type: 'object',
      properties: { teamId: { type: 'string' }, targetUserId: { type: 'string' } },
      required: ['teamId', 'targetUserId']
    }
  },
  {
    name: 'remove_team_member',
    description: 'Remove a member from the team. Requires Admin role.',
    inputSchema: {
      type: 'object',
      properties: { teamId: { type: 'string' }, targetUserId: { type: 'string' } },
      required: ['teamId', 'targetUserId']
    }
  },
  {
    name: 'list_departments',
    description: 'List all departments. Requires Manager role or higher.',
    inputSchema: {
      type: 'object',
      properties: { teamId: { type: 'string' } },
      required: ['teamId']
    }
  },
  {
    name: 'create_department',
    description: 'Create a new department. Requires DeptHead role or higher.',
    inputSchema: {
      type: 'object',
      properties: {
        teamId: { type: 'string' },
        name: { type: 'string' },
        color: { type: 'string' }
      },
      required: ['teamId', 'name']
    }
  },
  {
    name: 'get_team_activity',
    description: 'Get recent activity feed for your team. Requires Manager role or higher.',
    inputSchema: {
      type: 'object',
      properties: {
        teamId: { type: 'string' },
        limit: { type: 'number' }
      },
      required: ['teamId']
    }
  },
  // --- Reports ---
  {
    name: 'get_project_report',
    description: 'Get task completion stats and health metrics for a project. Requires Manager role or higher.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        dateStart: { type: 'string' },
        dateEnd: { type: 'string' }
      },
      required: ['projectId']
    }
  },
  {
    name: 'get_member_report',
    description: 'Get productivity stats for a team member. Requires Manager role (or own data).',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID (use your own to see self-report)' },
        projectId: { type: 'string' }
      },
      required: ['userId']
    }
  },
  {
    name: 'get_time_report',
    description: 'Get time tracking summary for a date range',
    inputSchema: {
      type: 'object',
      properties: {
        dateStart: { type: 'string', description: 'ISO date e.g. 2025-01-01' },
        dateEnd: { type: 'string', description: 'ISO date e.g. 2025-01-31' },
        projectId: { type: 'string' },
        userId: { type: 'string' }
      },
      required: ['dateStart', 'dateEnd']
    }
  },
  {
    name: 'list_task_history',
    description: 'View archived/completed task history',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        limit: { type: 'number' }
      },
      required: []
    }
  },
  // --- Tags ---
  {
    name: 'list_tags',
    description: 'List all tags for a project',
    inputSchema: {
      type: 'object',
      properties: { projectId: { type: 'string' } },
      required: ['projectId']
    }
  },
  {
    name: 'create_tag',
    description: 'Create a new tag. Requires Lead role or higher.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        name: { type: 'string' },
        color: { type: 'string', description: 'Hex color e.g. #FF5733' },
        type: { type: 'string', enum: ['Priority', 'Type', 'Custom'] }
      },
      required: ['projectId', 'name', 'color', 'type']
    }
  },
  {
    name: 'add_tag_to_task',
    description: 'Apply a tag to a task. Requires Lead role or higher.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        tagId: { type: 'string' }
      },
      required: ['taskId', 'tagId']
    }
  },
  {
    name: 'remove_tag_from_task',
    description: 'Remove a tag from a task. Requires Lead role or higher.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        tagId: { type: 'string' }
      },
      required: ['taskId', 'tagId']
    }
  }
];

// ============================================================
// MCP Endpoint - List Tools
// ============================================================
app.get('/mcp/tools', (_req, res) => {
  res.json({ tools: TOOL_DEFINITIONS });
});

// ============================================================
// MCP Endpoint - Call Tool
// ============================================================
app.post('/mcp/call', async (req, res) => {
  const { tool, params } = req.body;
  const rawApiKey = req.headers.authorization?.replace('Bearer ', '') ?? '';
  const ip = req.ip ?? req.socket.remoteAddress;

  try {
    // 1. Authenticate
    const user = await authenticate(rawApiKey);

    // 2. Require Premium for ALL tools
    requirePremium(user);

    // 3. Rate Limit
    await checkAndLogRateLimit(user.apiKeyId, user.userId, tool, ip);

    // 4. Dispatch to tool handler
    let result: unknown;

    switch (tool) {
      // Auth
      case 'get_my_profile':
        result = { userId: user.userId, name: user.name, email: user.email, role: user.role, isPremium: user.isPremium };
        break;
      case 'get_rate_limit_status':
        result = await getRateLimitStatus(user.apiKeyId, user.userId);
        break;

      // Tasks
      case 'list_tasks':       result = await TaskTools.listTasks(user, params); break;
      case 'get_task':         result = await TaskTools.getTask(user, params); break;
      case 'create_task':      result = await TaskTools.createTask(user, params); break;
      case 'update_task':      result = await TaskTools.updateTask(user, params); break;
      case 'move_task':        result = await TaskTools.moveTask(user, params); break;
      case 'delete_task':      result = await TaskTools.deleteTask(user, params); break;
      case 'start_timer':      result = await TaskTools.startTimer(user, params); break;
      case 'stop_timer':       result = await TaskTools.stopTimer(user, params); break;
      case 'log_time':         result = await TaskTools.logTime(user, params); break;
      case 'set_task_reminder': result = await TaskTools.setTaskReminder(user, params); break;

      // Projects
      case 'list_projects':      result = await ProjectTools.listProjects(user, params ?? {}); break;
      case 'get_project':        result = await ProjectTools.getProject(user, params); break;
      case 'create_project':     result = await ProjectTools.createProject(user, params); break;
      case 'update_project':     result = await ProjectTools.updateProject(user, params); break;
      case 'archive_project':    result = await ProjectTools.archiveProject(user, params); break;
      case 'list_columns':       result = await ProjectTools.listColumns(user, params); break;
      case 'create_column':      result = await ProjectTools.createColumn(user, params); break;
      case 'rename_column':      result = await ProjectTools.renameColumn(user, params); break;
      case 'get_project_members': result = await ProjectTools.getProjectMembers(user, params); break;
      case 'change_member_role': result = await ProjectTools.changeMemberRole(user, params); break;
      case 'remove_member':      result = await ProjectTools.removeMember(user, params); break;

      // Teams
      case 'get_my_team':          result = await TeamTools.getMyTeam(user); break;
      case 'list_team_members':    result = await TeamTools.listTeamMembers(user, params); break;
      case 'approve_join_request': result = await TeamTools.approveJoinRequest(user, params); break;
      case 'reject_join_request':  result = await TeamTools.rejectJoinRequest(user, params); break;
      case 'remove_team_member':   result = await TeamTools.removeTeamMember(user, params); break;
      case 'list_departments':     result = await TeamTools.listDepartments(user, params); break;
      case 'create_department':    result = await TeamTools.createDepartment(user, params); break;
      case 'get_team_activity':    result = await TeamTools.getTeamActivity(user, params); break;

      // Reports
      case 'get_project_report': result = await ReportTools.getProjectReport(user, params); break;
      case 'get_member_report':  result = await ReportTools.getMemberReport(user, params); break;
      case 'get_time_report':    result = await ReportTools.getTimeReport(user, params); break;
      case 'list_task_history':  result = await ReportTools.listTaskHistory(user, params ?? {}); break;

      // Tags
      case 'list_tags':           result = await TagTools.listTags(user, params); break;
      case 'create_tag':          result = await TagTools.createTag(user, params); break;
      case 'add_tag_to_task':     result = await TagTools.addTagToTask(user, params); break;
      case 'remove_tag_from_task': result = await TagTools.removeTagFromTask(user, params); break;

      default:
        return res.status(404).json({ error: 'TOOL_NOT_FOUND', message: `Unknown tool: "${tool}"` });
    }

    return res.json({ success: true, data: result });

  } catch (err: unknown) {
    const error = err as Error;

    if (error.name === 'McpAuthError') {
      return res.status(401).json({ error: 'AUTHENTICATION_FAILED', message: error.message });
    }
    if (error.name === 'McpPermissionError') {
      return res.status(403).json({ error: 'PERMISSION_DENIED', message: error.message });
    }
    if (error.name === 'McpRateLimitError') {
      const rateLimitErr = err as import('./auth.js').McpRateLimitError;
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: error.message,
        retryAfterSeconds: rateLimitErr.retryAfterSeconds
      });
    }

    console.error(`[MCP Error] tool=${tool}`, error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
});

// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
  console.log(`✅ DoneOne MCP Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Tools:  http://localhost:${PORT}/mcp/tools`);
  console.log(`   Call:   POST http://localhost:${PORT}/mcp/call`);
});
