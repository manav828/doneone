# DoneOne MCP Server

Connect AI coding tools (Cursor, Cline, Claude Desktop) to your DoneOne workspace.

## Prerequisites
- DoneOne Premium subscription
- Supabase project credentials
- Node.js 18+

## Environment Variables

Create a `.env` file in the `mcp-server/` directory:

```env
# Supabase (required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server (optional)
PORT=3000
ALLOWED_ORIGINS=https://yourapp.com,http://localhost:3000
```

> ⚠️ **Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.** The service role key bypasses Row Level Security — keep it server-side only.

## Development

```bash
npm install
npm run dev
```

## Production Deployment

### Railway (Recommended)
1. Create a new project on [Railway](https://railway.app)
2. Connect this repository (or just the `mcp-server/` folder)
3. Set environment variables in Railway's Settings tab
4. Deploy — Railway will auto-detect the Node.js app

### Other platforms
- **Render**: Works identically to Railway
- **Fly.io**: Use the provided `Dockerfile` (create one if needed)
- **Vercel**: Not recommended (serverless; SSE connections won't work correctly)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/mcp/tools` | List all available tools |
| POST | `/mcp/call` | Execute a tool call |

### Authentication

Every request must include your API key:

```
Authorization: Bearer do_live_your_api_key_here
```

Generate your API key in the DoneOne app: **Profile → Settings → API Keys**

## Rate Limits

| Window | Limit |
|--------|-------|
| Per minute | 60 requests |
| Per hour | 500 requests |
| Per day | 2,000 requests |

## Available Tools (38 total)

### Auth & Info
- `get_my_profile` - Get your user profile, role, and premium status
- `get_rate_limit_status` - Check remaining API quota

### Tasks (10 tools)
- `list_tasks` - List tasks with filters
- `get_task` - Get full task details
- `create_task` - Create a new task *(Lead+)*
- `update_task` - Update task fields *(Lead+)*
- `move_task` - Move to a different column
- `delete_task` - Delete a task *(Manager+)*
- `start_timer` - Start time tracking
- `stop_timer` - Stop timer and save time
- `log_time` - Manually log time in seconds
- `set_task_reminder` - Set a date/time reminder

### Projects & Columns (11 tools)
- `list_projects` - List accessible projects
- `get_project` - Get project with columns and members
- `create_project` - Create a project *(DeptHead+)*
- `update_project` - Update name/description *(Manager+)*
- `archive_project` - Archive a project *(Manager+)*
- `list_columns` - List columns/statuses
- `create_column` - Add a new column *(Lead+)*
- `rename_column` - Rename a column *(Lead+)*
- `get_project_members` - List members with roles
- `change_member_role` - Change a member's role *(Manager+)*
- `remove_member` - Remove a member *(Manager+)*

### Teams & Organizations (8 tools)
- `get_my_team` - Get your team info
- `list_team_members` - List members *(Manager+)*
- `approve_join_request` - Approve a pending member *(DeptHead+)*
- `reject_join_request` - Reject a pending member *(DeptHead+)*
- `remove_team_member` - Remove a member *(Admin)*
- `list_departments` - List departments *(Manager+)*
- `create_department` - Create a department *(DeptHead+)*
- `get_team_activity` - Get activity feed *(Manager+)*

### Reports & Analytics (4 tools)
- `get_project_report` - Task stats and completion rate *(Manager+)*
- `get_member_report` - Member productivity stats
- `get_time_report` - Time tracking summary
- `list_task_history` - View archived tasks

### Tags (4 tools)
- `list_tags` - List all tags for a project
- `create_tag` - Create a new tag *(Lead+)*
- `add_tag_to_task` - Apply a tag *(Lead+)*
- `remove_tag_from_task` - Remove a tag *(Lead+)*

## Role Permissions Summary

| Action | Resource | Lead | Manager | DeptHead | Admin |
|--------|----------|------|---------|----------|-------|
| View tasks | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create/edit tasks | ❌ | ✅ | ✅ | ✅ | ✅ |
| Delete tasks | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage columns | ❌ | ✅ | ✅ | ✅ | ✅ |
| Update projects | ❌ | ❌ | ✅ | ✅ | ✅ |
| Create projects | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage team | ❌ | ❌ | ❌ | ❌ | ✅ |

## AI Tool Configuration

### Cursor

1. Open `File → Preferences → Cursor Settings`
2. Navigate to the **MCP** tab
3. Add a new server:

```json
{
  "name": "DoneOne",
  "type": "http",
  "url": "https://your-mcp-server.railway.app",
  "headers": {
    "Authorization": "Bearer do_live_your_key"
  }
}
```

### Claude Desktop

Edit `~/.config/claude/claude_desktop_config.json` (macOS/Linux) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "doneone": {
      "type": "http",
      "url": "https://your-mcp-server.railway.app",
      "headers": {
        "Authorization": "Bearer do_live_your_key"
      }
    }
  }
}
```

### Cline (VS Code)

In the Cline settings panel, add a custom MCP server with the same URL and authorization header.

## Security Notes

1. **Never share your API key** — treat it like a password
2. **Keys are hashed** — the server stores only SHA-256 hashes; the plaintext is shown only once on generation
3. **Revoke immediately** if you suspect a key is compromised (Settings → API Keys → Revoke)
4. **RBAC enforced** — the key inherits your account's role; you cannot bypass role restrictions via MCP
