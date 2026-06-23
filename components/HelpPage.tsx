import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import {
  ArrowLeft, Search, BookOpen, Zap, Users, BarChart2,
  Key, Crown, Keyboard, HelpCircle, ChevronRight, ExternalLink,
  Clock, Tag, FolderKanban, Bell, Shield, Terminal
} from 'lucide-react';

interface HelpSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  premiumOnly?: boolean;
  articles: HelpArticle[];
}

interface HelpArticle {
  id: string;
  title: string;
  content: React.ReactNode;
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'getting-started',
    icon: <Zap size={18} />,
    title: 'Getting Started',
    articles: [
      {
        id: 'what-is-doneone',
        title: 'What is DoneOne?',
        content: (
          <div className="space-y-3">
            <p>DoneOne is a premium browser-based project management tool. It lets you manage tasks, teams, and projects without leaving your browser.</p>
            <p>You can open it anytime with <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">Ctrl+Shift+F</kbd> from any webpage.</p>
            <h4 className="font-semibold text-slate-800 dark:text-white mt-4">Key capabilities:</h4>
            <ul className="space-y-2 list-none">
              {['Kanban, List, Calendar and Timeline views', 'Real-time team collaboration', 'Built-in time tracking', 'AI tool integration via MCP (Premium)', 'Task reminders and notifications'].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />{item}</li>
              ))}
            </ul>
          </div>
        )
      },
      {
        id: 'quick-add',
        title: 'Quick Add a Task from Any Webpage',
        content: (
          <div className="space-y-3">
            <p>DoneOne lets you capture tasks instantly from any webpage without losing your focus.</p>
            <div className="space-y-3">
              {[
                { method: 'Keyboard Shortcut', desc: 'Press Ctrl+Shift+F anywhere to open the quick-add modal', icon: '⌨️' },
                { method: 'Browser Extension Icon', desc: 'Click the DoneOne icon in your browser toolbar', icon: '🧩' },
                { method: 'Right Click Menu', desc: 'Select text on any page → right click → "Add to DoneOne"', icon: '🖱️' },
              ].map(m => (
                <div key={m.method} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{m.method}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'tasks',
    icon: <FolderKanban size={18} />,
    title: 'Task Management',
    articles: [
      {
        id: 'create-task',
        title: 'Creating Tasks',
        content: (
          <div className="space-y-3">
            <p>Create tasks using the <strong>+ Add Task</strong> button at the bottom of any column, or use the Quick Add shortcut.</p>
            <h4 className="font-semibold text-slate-800 dark:text-white">Task fields:</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Title', 'Required — the task name'],
                ['Description', 'Rich text notes'],
                ['Assignee', 'Who is responsible'],
                ['Priority', 'High / Medium / Low'],
                ['Due Date', 'When it is needed by'],
                ['Estimated Time', 'How long it should take'],
                ['Tags', 'Labels for categorization'],
                ['Reminder', 'Get notified at a set time'],
              ].map(([field, desc]) => (
                <div key={field} className="p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{field}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'time-tracking',
        title: 'Time Tracking',
        content: (
          <div className="space-y-3">
            <p>Every task has a built-in timer. Click the timer button on a task card to start/stop tracking.</p>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">💡 Tip</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">You can also log time manually if you forgot to start the timer. Open a task and click "Log Time".</p>
            </div>
            <h4 className="font-semibold text-slate-800 dark:text-white">Viewing time data:</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Go to <strong>Reports</strong> to see time tracked per task, user, and project over any date range.</p>
          </div>
        )
      },
      {
        id: 'subtasks',
        title: 'Subtasks & Checklists',
        content: (
          <div className="space-y-3">
            <p>Break large tasks into smaller steps using Subtasks. Open a task and click <strong>"Add Subtask"</strong>.</p>
            <p>Each subtask can be independently checked off. The task card shows completion progress (e.g. 3/5 subtasks done).</p>
          </div>
        )
      }
    ]
  },
  {
    id: 'teams',
    icon: <Users size={18} />,
    title: 'Projects & Teams',
    articles: [
      {
        id: 'roles',
        title: 'Understanding Roles',
        content: (
          <div className="space-y-3">
            <p>DoneOne uses a role-based permission system. Here's what each role can do:</p>
            <div className="space-y-2">
              {[
                { role: 'Admin', color: 'bg-red-100 text-red-700', perms: 'Full access — manage users, billing, all projects, all teams' },
                { role: 'DeptHead', color: 'bg-purple-100 text-purple-700', perms: 'Create/delete projects, manage department members, approve joins' },
                { role: 'Manager', color: 'bg-blue-100 text-blue-700', perms: 'Edit settings, manage columns & tasks, assign Leads — cannot invite team members' },
                { role: 'Lead', color: 'bg-green-100 text-green-700', perms: 'Manage tasks, columns, tags — cannot change settings' },
                { role: 'Resource', color: 'bg-slate-100 text-slate-700', perms: 'View and update tasks assigned to them only' },
              ].map(r => (
                <div key={r.role} className="flex gap-3 items-start p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md flex-shrink-0 ${r.color}`}>{r.role}</span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 pt-0.5">{r.perms}</p>
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'invite-members',
        title: 'Inviting Team Members',
        content: (
          <div className="space-y-3">
            <p>Share your team's <strong>Join Code</strong> with new members. They enter it in the app to request access.</p>
            <p>Admins and DeptHeads can approve or reject join requests from the Workspace Settings page.</p>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <p className="text-xs text-amber-700 dark:text-amber-400">Personal projects (not linked to a team) do not support inviting members.</p>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'mcp',
    icon: <Terminal size={18} />,
    title: 'MCP Integration (AI Tools)',
    premiumOnly: true,
    articles: [
      {
        id: 'what-is-mcp',
        title: 'What is MCP Integration?',
        content: (
          <div className="space-y-3">
            <p>MCP (Model Context Protocol) lets AI coding tools like <strong>Cursor</strong>, <strong>Cline</strong>, and <strong>Claude Desktop</strong> connect directly to DoneOne.</p>
            <p>Once connected, you can manage your entire workspace through natural language inside your AI tool:</p>
            <div className="space-y-2">
              {[
                '"Show me all tasks assigned to me that are overdue"',
                '"Create a task called Fix login bug in the Backend project, assign to Rahul"',
                '"Move the task to Done"',
                '"Show me the time report for this week"'
              ].map(example => (
                <div key={example} className="flex gap-2 items-start p-3 bg-slate-900 dark:bg-slate-950 rounded-lg">
                  <span className="text-green-400 flex-shrink-0 mt-0.5">›</span>
                  <code className="text-green-400 text-xs font-mono">{example}</code>
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'setup-mcp',
        title: 'How to Set Up MCP',
        content: (
          <div className="space-y-4">
            <div className="space-y-3">
              {[
                { step: '1', title: 'Generate an API Key', desc: 'Go to Settings → API Keys → Generate Key. Copy the key shown — it appears only once.' },
                { step: '2', title: 'Open your AI tool config', desc: 'In Cursor: File → Preferences → Cursor Settings → MCP. In Claude Desktop: Edit claude_desktop_config.json.' },
                { step: '3', title: 'Add DoneOne server', desc: 'Paste the config below, replacing YOUR_API_KEY with your key.' },
                { step: '4', title: 'Restart your AI tool', desc: 'The DoneOne tools will appear in your AI assistant\'s tool list.' }
              ].map(s => (
                <div key={s.step} className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">{s.step}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{s.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-4 border border-slate-700">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Config to paste</p>
              <pre className="text-xs text-green-400 font-mono whitespace-pre overflow-x-auto">{`{
  "mcpServers": {
    "doneone": {
      "type": "http",
      "url": "https://mcp.doneone.app",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}`}</pre>
            </div>
          </div>
        )
      },
      {
        id: 'mcp-rate-limits',
        title: 'Rate Limits',
        content: (
          <div className="space-y-3">
            <p>To ensure fair usage and service stability, the MCP server enforces rate limits:</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { window: 'Per Minute', limit: '60 requests' },
                { window: 'Per Hour', limit: '500 requests' },
                { window: 'Per Day', limit: '2,000 requests' }
              ].map(l => (
                <div key={l.window} className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{l.limit}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{l.window}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">If you exceed a limit, you'll get a <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-xs">RATE_LIMIT_EXCEEDED</code> error with a <em>retry-after</em> time. Simply wait and try again.</p>
          </div>
        )
      },
      {
        id: 'mcp-rbac',
        title: 'Role-Based Access in MCP',
        content: (
          <div className="space-y-3">
            <p>Your MCP API key carries your account's role. The same permissions that apply inside DoneOne apply through MCP:</p>
            <div className="space-y-2">
              {[
                { action: 'List tasks, start timer, set reminder', roles: 'All users' },
                { action: 'Create tasks, manage columns, add tags', roles: 'Lead+' },
                { action: 'Update project, remove members', roles: 'Manager+' },
                { action: 'Create projects, approve joins', roles: 'DeptHead+' },
                { action: 'List all users, grant premium', roles: 'Admin only' },
              ].map(r => (
                <div key={r.action} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <p className="text-xs text-slate-700 dark:text-slate-300">{r.action}</p>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md flex-shrink-0 ml-3">{r.roles}</span>
                </div>
              ))}
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'reports',
    icon: <BarChart2 size={18} />,
    title: 'Reports & Analytics',
    articles: [
      {
        id: 'view-reports',
        title: 'Viewing Reports',
        content: (
          <div className="space-y-3">
            <p>Navigate to the <strong>Reports</strong> page from the sidebar. You can view:</p>
            <ul className="space-y-2">
              {[
                'Task completion rates per project',
                'Workload distribution across team members',
                'Time tracked per person and project',
                'Health scores and bottleneck detection',
                'Historical productivity trends'
              ].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />{item}
                </li>
              ))}
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: 'shortcuts',
    icon: <Keyboard size={18} />,
    title: 'Keyboard Shortcuts',
    articles: [
      {
        id: 'all-shortcuts',
        title: 'All Keyboard Shortcuts',
        content: (
          <div className="space-y-2">
            {[
              ['Ctrl+Shift+F', 'Open quick-add modal from any page'],
              ['Enter', 'Save task / confirm action'],
              ['Escape', 'Close modal / cancel'],
              ['D', 'Toggle dark mode'],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <span className="text-sm text-slate-600 dark:text-slate-400">{desc}</span>
                <kbd className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 shadow-sm">{key}</kbd>
              </div>
            ))}
          </div>
        )
      }
    ]
  },
  {
    id: 'faq',
    icon: <HelpCircle size={18} />,
    title: 'FAQ',
    articles: [
      {
        id: 'premium-trial',
        title: 'What is the 30-day free trial?',
        content: <p>All new accounts get 30 days of full Premium access automatically. No credit card required. After 30 days, you'll be moved to the free plan unless you subscribe.</p>
      },
      {
        id: 'data-export',
        title: 'Can I export my data?',
        content: <p>Yes! Premium users can export tasks to CSV or JSON. Go to a project → click the Data icon in the top bar → Export.</p>
      },
      {
        id: 'personal-vs-team',
        title: 'Personal projects vs Team projects — what is the difference?',
        content: (
          <div className="space-y-2">
            <p><strong>Personal projects</strong> — owned by you alone. No members can be invited. Great for personal task lists.</p>
            <p><strong>Team projects</strong> — linked to a workspace team. Multiple members with different roles can collaborate in real time.</p>
          </div>
        )
      }
    ]
  }
];

export const HelpPage: React.FC = () => {
  const navigate = useNavigate();
  const { canAccessPremium } = useStore();
  const isPremium = canAccessPremium();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState(HELP_SECTIONS[0].id);
  const [activeArticle, setActiveArticle] = useState(HELP_SECTIONS[0].articles[0].id);

  const currentSection = HELP_SECTIONS.find(s => s.id === activeSection)!;
  const currentArticle = currentSection?.articles.find(a => a.id === activeArticle);

  // Search filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { sectionTitle: string; article: HelpArticle }[] = [];
    HELP_SECTIONS.forEach(section => {
      section.articles.forEach(article => {
        if (article.title.toLowerCase().includes(q)) {
          results.push({ sectionTitle: section.title, article });
        }
      });
    });
    return results;
  }, [searchQuery]);

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <BookOpen size={20} className="text-primary" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Help & Documentation</h1>
          </div>
          {/* Search */}
          <div className="relative w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search documentation…"
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="w-60 flex-shrink-0">
          <nav className="space-y-1 sticky top-8">
            {HELP_SECTIONS.map(section => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setActiveArticle(section.articles[0].id);
                  setSearchQuery('');
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                  ${activeSection === section.id
                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                {section.icon}
                {section.title}
                {section.premiumOnly && (
                  <Crown size={10} className={`ml-auto ${isPremium ? 'text-yellow-500' : 'text-slate-400'}`} />
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {searchQuery ? (
            /* Search Results */
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                <h2 className="font-semibold text-slate-900 dark:text-white">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"</h2>
              </div>
              {searchResults.length === 0 ? (
                <div className="p-12 text-center">
                  <Search size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-500">No results found. Try a different keyword.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {searchResults.map(({ sectionTitle, article }) => (
                    <button
                      key={article.id}
                      onClick={() => {
                        const section = HELP_SECTIONS.find(s => s.articles.some(a => a.id === article.id));
                        if (section) { setActiveSection(section.id); setActiveArticle(article.id); setSearchQuery(''); }
                      }}
                      className="w-full text-left px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">{sectionTitle}</p>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{article.title}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-5">
              {/* Article list */}
              <div className="w-52 flex-shrink-0">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {currentSection?.articles.map(article => (
                    <button
                      key={article.id}
                      onClick={() => setActiveArticle(article.id)}
                      className={`w-full text-left px-4 py-3 text-sm border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors
                        ${activeArticle === article.id
                          ? 'bg-primary/5 text-primary font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                    >
                      {article.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Article content */}
              {currentArticle && (
                <div className="flex-1 min-w-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    {currentSection?.premiumOnly && (
                      <Crown size={14} className={isPremium ? 'text-yellow-500' : 'text-slate-400'} />
                    )}
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">{currentArticle.title}</h2>
                  </div>
                  <div className="p-6 prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed">
                    {currentArticle.content}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
