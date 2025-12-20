import React, { useState } from 'react';
import {
  Shield, ShieldAlert, User, FolderKanban, Bell, Filter, LayoutList, Calendar,
  Archive, Settings, Crown, Clock, Download, Zap, MousePointerClick,
  Users, Lock, BarChart, X, Check, ToggleLeft, ToggleRight, Layout, Quote, Star,
  ArrowRight, HelpCircle, ChevronDown, ChevronUp
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
  }
];

// --- Classic Guide Component (Preserved) ---
const GuideClassic: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'free' | 'premium'>('all');

  const categories = [
    { id: 'all', label: 'All Features' },
    { id: 'free', label: 'Essentials' },
    { id: 'premium', label: 'Premium Powers' }
  ];

  const filteredFeatures = filter === 'all'
    ? FEATURES_DATA
    : FEATURES_DATA.filter(f => filter === 'premium' ? f.isPremium : !f.isPremium);

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
const GuideModern: React.FC = () => {
  const visualFeatures = FEATURES_DATA.filter(f => f.image);
  const otherFeatures = FEATURES_DATA.filter(f => !f.image);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Fade Up Animation Variant
  const fadeUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
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
            <p className="text-teal-400 font-bold uppercase tracking-wider text-sm mb-4">Steps to Success</p>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Maximize your returns with a <br />
              Workflow that generates.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <span className="text-6xl font-black text-white/20 mb-6 block">1</span>
              <h3 className="text-xl font-bold mb-3">Create Project</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Sign up and set up your first project from the dashboard.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <span className="text-6xl font-black text-white/20 mb-6 block">2</span>
              <h3 className="text-xl font-bold mb-3">Add Tasks</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Use the Quick Add shortcut (Ctrl+Shift+F) to populate your board instantly.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <span className="text-6xl font-black text-white/20 mb-6 block">3</span>
              <h3 className="text-xl font-bold mb-3">Track Progress</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Watch your productivity grow with detailed analytics and reports.</p>
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
          {FAQ_DATA.map((faq, idx) => (
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
  const [viewMode, setViewMode] = useState<'classic' | 'modern'>('modern');

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-10 pb-24 scroll-smooth">
      {/* View Toggles */}
      <div className="flex justify-end mb-6 sticky top-0 z-20 pointer-events-none">
        <div className="pointer-events-auto bg-white/80 dark:bg-slate-800/80 rounded-full shadow-lg p-1 flex border border-slate-200 dark:border-slate-700 backdrop-blur-md">
          <button
            onClick={() => setViewMode('modern')}
            className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'modern' ? 'bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
          >
            <Layout size={16} /> Modern
          </button>
          <button
            onClick={() => setViewMode('classic')}
            className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'classic' ? 'bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
          >
            <LayoutList size={16} /> Classic
          </button>
        </div>
      </div>

      {viewMode === 'modern' ? <GuideModern /> : <GuideClassic />}

      {/* Footer / Copyright */}
      <div className="text-center text-slate-400 dark:text-slate-600 text-sm mt-20 pb-8">
        &copy; 2025 FlowBoard. All rights reserved.
      </div>
    </div>
  );
};
