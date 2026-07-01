import React, { useState } from 'react';
import {
  Shield, ShieldAlert, User, FolderKanban, Bell, Filter, LayoutList, Calendar,
  Archive, Settings, Crown, Clock, Download, Zap, MousePointerClick,
  Users, Lock, BarChart, X, Check, ToggleLeft, ToggleRight, Layout, Quote, Star,
  ArrowRight, HelpCircle, ChevronDown, ChevronUp, Building2, Search, Cpu, Terminal
} from 'lucide-react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

// --- Shared Data ---
const FEATURES_DATA = [
  {
    icon: FolderKanban,
    title: "Kanban Board",
    description: "Visual project management at its finest. Drag and drop tasks across columns to track progress instantly.",
    benefits: ["Visualize your workflow clearly", "Drag-and-drop simplicity", "Customizable columns"],
    color: "bg-blue-500 text-blue-500",
    image: '/guide/board-view.png',
    isPremium: false
  },
  {
    icon: LayoutList,
    title: "List View",
    description: "A powerful spreadsheet-style view for managing massive backlogs without the visual clutter.",
    benefits: ["Sort by any field (Date, Priority)", "Scan hundreds of tasks in seconds", "Compact data density"],
    color: "bg-emerald-500 text-emerald-500",
    image: '/guide/list-view.png',
    isPremium: true
  },
  {
    icon: Calendar,
    title: "Calendar View",
    description: "Map your tasks onto a monthly calendar. Perfect for deadline-driven projects and planning ahead.",
    benefits: ["Never miss a deadline", "Plan your month effectively", "Visual timeline of deliverables"],
    color: "bg-orange-500 text-orange-500",
    image: '/guide/calendar-view.png',
    isPremium: true
  },
  {
    icon: Clock,
    title: "Timeline View",
    description: "Visualize dependencies and project duration with a Gantt-style timeline.",
    benefits: ["Gantt chart visualization", "Dependency tracking", "Long-term planning"],
    color: "bg-pink-500 text-pink-500",
    image: '/guide/timeline-view.png',
    isPremium: true
  },
  {
    icon: Archive,
    title: "Unlimited History and Analytics",
    description: "Keep a permanent record of every completed task. Search, filter, and reference past work forever.",
    benefits: ["Audit trails for compliance", "Learn from past projects", "Never lose a completed task"],
    color: "bg-rose-500 text-rose-500",
    image: '/guide/reports-view.png',
    isPremium: true
  },
  {
    icon: Clock,
    title: "Smart Time Tracking",
    description: "Track time on tasks with a single click. Includes intelligent sleep detection to pause timers when you step away.",
    benefits: ["Accurate billing & productivity stats", "Auto-pause when system sleeps", "Detailed time logs"],
    color: "bg-indigo-500 text-indigo-500",
    isPremium: false
  },
  {
    icon: Download,
    title: "Data Export (CSV)",
    description: "Take your data with you. Export project history and task lists to CSV for Excel or external analysis.",
    benefits: ["Create custom reports in Excel", "Backup your project data", "Share data with stakeholders"],
    color: "bg-purple-500 text-purple-500",
    isPremium: true
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Invite members to your projects. Assign tasks, share updates, and work together in real-time.",
    benefits: ["Real-time sync", "Role-based permissions (Manager/Lead)", "Effective delegation"],
    color: "bg-cyan-500 text-cyan-500",
    isPremium: false
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Stay in the loop without the noise. Get alerts for deadlines, assignments, and sleep timer adjustments.",
    benefits: ["Instant updates", "Browser-native alerts", "Interactive action buttons"],
    color: "bg-teal-500 text-teal-500",
    isPremium: false
  },
  {
    icon: Building2,
    title: "Project Migration",
    description: "Scale your work by moving personal projects into a Company or Workspace structure.",
    benefits: ["Centralize project management", "Enable Team Heads oversight", "Graduate from solo to team"],
    color: "bg-amber-500 text-amber-500",
    isPremium: false
  }
];

const FAQ_DATA = [
  {
    question: "How do I upgrade to Premium?",
    answer: "Click the 'Upgrade' button in the top navigation bar or access it through your profile settings. You can restart your plan at any time."
  },
  {
    question: "Can I invite free users to my premium project?",
    answer: "Yes! You can invite anyone to your project. However, some premium features (like Timeline View) might be view-only for free users depending on your settings."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use industry-standard encryption for all data storage and transfer. Your project details are private and only accessible to you and your invited team members."
  },
  {
    question: "How does the sleep timer work?",
    answer: "The extension detects system idle time. If you leave your computer without pausing a task, we'll ask if you want to discard that idle time when you return, keeping your logs accurate."
  },
  {
    question: "How do I move a personal project to an Organization?",
    answer: "Follow these exact steps:\n1. CREATE WORKSPACE: Click '+' next to Teams/Workspaces in the sidebar to create your Company.\n2. ADD DEPARTMENTS: Open 'Workspace Settings' and create departments like 'Marketing' or 'Dev'.\n3. LOCATE PROJECT: Find your project in the 'Personal Projects' list in the sidebar.\n4. START MOVE: Click the Building Icon (Move to Organization) that appears when you hover the project.\n5. CONFIGURE: Select your New Workspace and the Department you created.\n6. CONFIRM: Click 'Move to Organization' and your project will instantly migrate and appear under your Company header."
  }
];

const MIGRATION_STEPS = [
  {
    title: "1. Create Your Company",
    desc: "Look for the 'Teams/Workspaces' section in your sidebar. Click the '+' button to initialize your Company/Organization. This is the foundation for all professional features.",
    icon: Building2,
    color: "bg-blue-500"
  },
  {
    title: "2. Set Up Departments",
    desc: "Navigate to 'Workspace Settings' from your sidebar. Add your first department (e.g., 'Internal', 'Client Work', 'Engineering'). Projects must belong to a team context once migrated.",
    icon: Layout,
    color: "bg-purple-500"
  },
  {
    title: "3. Locate & Trigger",
    desc: "Find your solo project under 'Personal Projects'. Hover over it to reveal the 'Move to Organization' (Building icon). Click it to open the migration wizard.",
    icon: MousePointerClick,
    color: "bg-orange-500"
  },
  {
    title: "4. Target & Finalize",
    desc: "Select your new Company and the specific Department from the dropdowns. Click 'Move to Organization'. Your project will instantly relocate to the organizational workspace.",
    icon: Zap,
    color: "bg-green-500"
  }
];

const MigrationTutorial: React.FC = () => (
  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="text-center space-y-4">
      <h2 className="text-4xl font-bold text-slate-900 dark:text-white">Migration Masterclass</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
        Graduate your solo work to a professional enterprise structure in four simple steps.
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-8">
      {MIGRATION_STEPS.map((step, idx) => (
        <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
          <div className="flex items-start gap-6 relative z-10">
            <div className={`w-14 h-14 rounded-2xl ${step.color} text-white flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
              <step.icon size={28} />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm lg:text-base">
                {step.desc}
              </p>
            </div>
          </div>
          {/* Decorative Number */}
          <span className="absolute -bottom-10 -right-4 text-[10rem] font-black text-slate-50 dark:text-slate-900/50 pointer-events-none group-hover:text-primary/5 transition-colors">
            {idx + 1}
          </span>
        </div>
      ))}
    </div>

    <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
        <Crown size={32} />
      </div>
      <div>
        <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Why Migrate?</h4>
        <p className="text-slate-600 dark:text-slate-400">
          Personal projects are restricted to your eyes only. Once migrated to an Organization, you can assign **Team Heads**, use **Departments** for structure, and access **Enterprise Billing** for your entire team.
        </p>
      </div>
    </div>
  </div>
);

// --- Classic Guide Component (Preserved) ---
const GuideClassic: React.FC<{ searchQuery: string }> = ({ searchQuery }) => {
  const [filter, setFilter] = useState<'all' | 'free' | 'premium'>('all');

  const categories = [
    { id: 'all', label: 'All Features' },
    { id: 'free', label: 'Essentials' },
    { id: 'premium', label: 'Premium Powers' }
  ];

  const filteredFeatures = FEATURES_DATA.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    return filter === 'premium' ? f.isPremium : !f.isPremium;
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Features Guide</h1>
      </div>
      {/* Filter Tabs */}
      <div className="flex justify-center mb-12">
        <div className="bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex gap-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id as any)}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${filter === cat.id
                ? 'bg-primary text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredFeatures.map((feature, idx) => (
          <div key={idx} className={`relative group bg-white dark:bg-gray-800 rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${feature.isPremium ? 'border-yellow-200 dark:border-yellow-900/30' : 'border-gray-100 dark:border-gray-700'}`}>
            {feature.isPremium && (
              <div className="absolute -top-3 -right-3">
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-lg">Premium</span>
              </div>
            )}
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{feature.description}</p>
            {/* Benefits List for Classic View */}
            <div className="space-y-2 mt-auto">
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Why you need this</h4>
              {feature.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Check size={14} className={`mt-0.5 shrink-0 ${feature.isPremium ? 'text-yellow-500' : 'text-green-500'}`} />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Modern / Landing Page Style Guide Component ---
const GuideModern: React.FC<{ searchQuery: string }> = ({ searchQuery }) => {
  const filteredFeaturesData = FEATURES_DATA.filter(f =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visualFeatures = filteredFeaturesData.filter(f => f.image);
  const otherFeatures = filteredFeaturesData.filter(f => !f.image);
  const filteredFaqs = FAQ_DATA.filter(f =>
    f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Fade Up Animation Variant
  const fadeUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  return (
    <div className="max-w-7xl mx-auto text-slate-900 dark:text-slate-100 pb-20">
      {/* Light Hero Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative min-h-[60vh] flex items-center justify-center overflow-hidden rounded-[2.5rem] mb-24 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center p-12 lg:p-20 w-full">
          <div className="text-left space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 bg-white dark:bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-white/10 shadow-sm"
            >
              <Zap size={14} fill="currentColor" /> The Productivity OS
            </motion.div>
            <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
              Master Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">Workflow.</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg font-light">
              Experience the future of task management.
              Seamlessly integrated into your browser.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex gap-4 pt-4"
            >
              <button
                onClick={() => useStore.getState().setPricingModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 px-10 py-5 rounded-full font-bold text-lg shadow-xl shadow-slate-900/20 transition-all"
              >
                Start Free Trial
              </button>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 50, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative group hidden lg:block"
          >
            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-700">
              <img src="/guide/board-view.png" alt="Kanban Board View" className="w-full h-auto transform transition-transform duration-700 hover:scale-[1.02]" />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* AI Agent / MCP Integration Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="mb-32 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-[2.5rem] p-8 md:p-12 lg:p-16 border border-slate-800 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_45%)] pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 grid lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-3 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-indigo-400">
              <Cpu size={14} className="animate-pulse" />
              <span>Model Context Protocol (MCP) Support</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white">
              Connect Your Workspace <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                Directly to AI Coding Tools
              </span>
            </h2>

            <p className="text-slate-300 text-lg leading-relaxed font-light">
              DoneOne features a native, built-in MCP server. Expose your active board, task lists, and project details directly to <strong>Cursor</strong>, <strong>Cline</strong>, <strong>Claude Desktop</strong>, or any custom agentic environment.
            </p>

            <div className="grid md:grid-cols-2 gap-4 pt-4">
              <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl flex gap-3">
                <div className="p-2 h-fit bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
                  <Terminal size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-100">Full Context Injection</h4>
                  <p className="text-xs text-slate-400 mt-1">Let LLMs read the active column structure and find tasks by short ID.</p>
                </div>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl flex gap-3">
                <div className="p-2 h-fit bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0">
                  <Check size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-100">Write / Mutate Tasks</h4>
                  <p className="text-xs text-slate-400 mt-1">AI can create tasks, log time, modify tags, and update progress as you code.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  const el = document.getElementById('faq-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-full text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Read Setup Guide</span>
                <ArrowRight size={14} />
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-400 px-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Available for all premium workspaces</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 relative">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 font-mono text-left shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-1.5 border-b border-slate-850 pb-3 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <span className="text-[10px] text-slate-500 ml-2">mcp-config.json</span>
              </div>
              <pre className="text-xs text-indigo-300 overflow-x-auto select-all cursor-pointer leading-relaxed">
{`{
  "mcpServers": {
    "doneone": {
      "command": "npx",
      "args": [
        "-y",
        "@doneone/mcp-server"
      ],
      "env": {
        "DONEONE_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Visual Features Section */}
      <div className="space-y-40 mb-32">
        {visualFeatures.map((feature, idx) => {
          const isImageRight = idx % 2 === 0;

          return (
            <motion.div
              key={idx}
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="relative"
            >
              <div className={`flex flex-col lg:flex-row items-center gap-16 ${isImageRight ? '' : 'lg:flex-row-reverse'}`}>
                <div className="flex-1 space-y-8 relative z-10">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-white shadow-lg shadow-slate-200/50 dark:bg-slate-800 dark:shadow-none border border-slate-100 dark:border-slate-700`}>
                    <feature.icon size={32} className={feature.color.split(' ')[1]} />
                  </div>
                  <h2 className="text-4xl lg:text-5xl font-bold leading-tight text-slate-900 dark:text-white">
                    {feature.title}
                  </h2>
                  <p className="text-xl leading-relaxed text-slate-600 dark:text-slate-300">
                    {feature.description}
                  </p>
                  <div className="h-px w-full my-8 bg-slate-200 dark:bg-slate-700"></div>
                  <ul className="grid gap-4">
                    {feature.benefits.map((benefit, bIdx) => (
                      <li key={bIdx} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                          <Check size={16} />
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-200">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.5 }} className="flex-1 w-full">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <img src={feature.image} alt={feature.title} className="w-full h-auto" />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>


      {/* Dark Section (Steps to Success) */}
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
        className="rounded-[2.5rem] bg-[#0f2937] text-white p-12 lg:p-20 mb-32 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]"></div>

        <div className="relative z-10">
          <div className="mb-16 max-w-2xl">
            <p className="text-teal-400 font-bold uppercase tracking-wider text-sm mb-4">Migration Masterclass</p>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Convert Your Solo Projects <br />
              to an Organization Scale.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <span className="text-6xl font-black text-white/20 mb-6 block">1</span>
              <h3 className="text-xl font-bold mb-3 text-teal-400">Build Foundation</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Click '+' in Sidebar to create your Workspace (Company Header).</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <span className="text-6xl font-black text-white/20 mb-6 block">2</span>
              <h3 className="text-xl font-bold mb-3 text-teal-400">Set Structure</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Enter 'Workspace Settings' and add Departments (e.g. Sales, Tech).</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <span className="text-6xl font-black text-white/20 mb-6 block">3</span>
              <h3 className="text-xl font-bold mb-3 text-teal-400">Trigger Move</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Hover your Personal Project and click the Building Icon.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <span className="text-6xl font-black text-white/20 mb-6 block">4</span>
              <h3 className="text-xl font-bold mb-3 text-teal-400">Migrate!</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Select Target Org & Dept. Confirm to move it instantly.</p>
            </div>
          </div>
        </div>
      </motion.div>


      {/* Power Features Grid (Expanded) */}
      <div className="text-center mb-16 px-6">
        <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">
          Power Features
        </h2>
        <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full"></div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-32">
        {otherFeatures.map((feature, idx) => (
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            key={idx}
            className="bg-white dark:bg-slate-800 p-8 lg:p-10 rounded-[2rem] border border-slate-100 dark:border-slate-700 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 group"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-slate-50 dark:bg-slate-700/50 group-hover:bg-indigo-500/10 transition-colors`}>
              <feature.icon size={28} className={feature.color.split(' ')[1]} />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">{feature.title}</h3>
            <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
              {feature.description}
            </p>
            {/* Added Benefits List */}
            <ul className="space-y-3">
              {feature.benefits.map((benefit, bIdx) => (
                <li key={bIdx} className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                  <Check size={18} className="text-green-500 mt-1 shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mb-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-4">
          {filteredFaqs.map((faq, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-6 text-left font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                {faq.question}
                {openFaq === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/50">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
        className="py-24 bg-slate-900 rounded-[3rem] text-white text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mixed-blend-overlay"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl mx-auto px-6">
          <h2 className="text-5xl font-bold mb-8 tracking-tight">Ready to Flow?</h2>
          <p className="text-xl mb-12 text-slate-400 font-light">Join thousands of users who are already managing their projects more efficiently.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-slate-900 px-12 py-5 rounded-full font-bold text-xl shadow-2xl hover:shadow-white/20 transition-all"
          >
            Get Started Now
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// --- Main Guide Component ---
export const Guide: React.FC = () => {
  const [viewMode, setViewMode] = useState<'classic' | 'modern' | 'migration'>('migration');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'modern', label: 'Modern View', icon: Layout },
    { id: 'classic', label: 'Classic View', icon: LayoutList },
    { id: 'migration', label: 'Migration Tutorial', icon: Building2 }
  ];

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-10 pb-24 scroll-smooth">
      {/* Search & View Toggles */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 sticky top-0 z-20 pointer-events-none">

        <div className="pointer-events-auto flex-1 max-w-lg w-full relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search help, features, migration keys..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
          />
        </div>

        <div className="pointer-events-auto bg-white/80 dark:bg-slate-800/80 rounded-full shadow-lg p-1 flex border border-slate-200 dark:border-slate-700 backdrop-blur-md overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setViewMode(cat.id as any)}
              className={`px-4 py-2 rounded-full text-xs lg:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${viewMode === cat.id ? 'bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
            >
              <cat.icon size={16} /> {cat.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'migration' ? (
          <MigrationTutorial key="migration" />
        ) : viewMode === 'modern' ? (
          <GuideModern key="modern" searchQuery={searchQuery} />
        ) : (
          <GuideClassic key="classic" searchQuery={searchQuery} />
        )}
      </AnimatePresence>

      {/* Footer / Copyright */}
      <div className="text-center text-slate-400 dark:text-slate-600 text-sm mt-20 pb-8">
        &copy; 2025 DoneOne. All rights reserved.
      </div>
    </div>
  );
};
