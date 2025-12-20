import React, { useState } from 'react';
import {
  Shield, ShieldAlert, User, FolderKanban, Bell, Filter, LayoutList, Calendar,
  Archive, Settings, Crown, Clock, Download, Zap, MousePointerClick,
  Users, Lock, BarChart, X, Check
} from 'lucide-react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  isPremium?: boolean;
  image?: string;
  benefits: string[];
  color: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, isPremium, image, benefits, color }) => (
  <div className={`relative group bg-white dark:bg-gray-800 rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isPremium ? 'border-yellow-200 dark:border-yellow-900/30' : 'border-gray-100 dark:border-gray-700'}`}>
    {isPremium && (
      <div className="absolute -top-3 -right-3">
        <span className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-lg">
          <Crown size={12} fill="currentColor" /> Premium
        </span>
      </div>
    )}

    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
      <Icon size={24} className="text-white" />
    </div>

    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
      {title}
    </h3>

    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
      {description}
    </p>

    {image && (
      <div className="mb-4 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm relative group-hover:shadow-md transition-shadow">
        <img src={image} alt={title} className="w-full h-32 object-cover object-top hover:scale-105 transition-transform duration-500" />
      </div>
    )}

    <div className="space-y-2 mt-auto">
      <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Why you need this</h4>
      {benefits.map((benefit, idx) => (
        <div key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
          <Check size={14} className={`mt-0.5 shrink-0 ${isPremium ? 'text-yellow-500' : 'text-green-500'}`} />
          <span>{benefit}</span>
        </div>
      ))}
    </div>
  </div>
);

export const Guide: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'free' | 'premium'>('all');

  const categories = [
    { id: 'all', label: 'All Features' },
    { id: 'free', label: 'Essentials' },
    { id: 'premium', label: 'Premium Powers' }
  ];

  const features = [
    {
      icon: FolderKanban,
      title: "Kanban Board",
      description: "Visual project management at its finest. Drag and drop tasks across columns to track progress instantly.",
      benefits: ["Visualize your workflow clearly", "Drag-and-drop simplicity", "Customizable columns"],
      color: "bg-blue-500",
      image: '/assets/kanban_preview.png',
      isPremium: false
    },
    {
      icon: LayoutList,
      title: "List View",
      description: "A powerful spreadsheet-style view for managing massive backlogs without the visual clutter.",
      benefits: ["Sort by any field (Date, Priority)", "Scan hundreds of tasks in seconds", "Compact data density"],
      color: "bg-emerald-500",
      image: '/assets/list_preview.png',
      isPremium: true
    },
    {
      icon: Calendar,
      title: "Calendar View",
      description: "Map your tasks onto a monthly calendar. Perfect for deadline-driven projects and planning ahead.",
      benefits: ["Never miss a deadline", "Plan your month effectively", "Visual timeline of deliverables"],
      color: "bg-orange-500",
      isPremium: true
    },
    {
      icon: Clock,
      title: "Smart Time Tracking",
      description: "Track time on tasks with a single click. Includes intelligent sleep detection to pause timers when you step away.",
      benefits: ["Accurate billing & productivity stats", "Auto-pause when system sleeps", "Detailed time logs"],
      color: "bg-indigo-500",
      isPremium: false
    },
    {
      icon: Download,
      title: "Data Export (CSV)",
      description: "Take your data with you. Export project history and task lists to CSV for Excel or external analysis.",
      benefits: ["Create custom reports in Excel", "Backup your project data", "Share data with stakeholders"],
      color: "bg-purple-500",
      isPremium: true
    },
    {
      icon: Archive,
      title: "Unlimited History and Analytics",
      description: "Keep a permanent record of every completed task. Search, filter, and reference past work forever.",
      benefits: ["Audit trails for compliance", "Learn from past projects", "Never lose a completed task"],
      color: "bg-rose-500",
      image: '/assets/analytics_preview.png',
      isPremium: true
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Invite members to your projects. Assign tasks, share updates, and work together in real-time.",
      benefits: ["Real-time sync", "Role-based permissions (Manager/Lead)", "Effective delegation"],
      color: "bg-cyan-500",
      isPremium: false
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Stay in the loop without the noise. Get alerts for deadlines, assignments, and sleep timer adjustments.",
      benefits: ["Instant updates", "Browser-native alerts", "Interactive action buttons"],
      color: "bg-teal-500",
      isPremium: false
    }
  ];

  const filteredFeatures = filter === 'all' ? features : features.filter(f => filter === 'premium' ? f.isPremium : !f.isPremium);

  return (
    <div className="h-full overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50 p-6 md:p-10 pb-24">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
            Unlock Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Productivity</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Explore the powerful features designed to streamline your workflow.
            From essential tools to premium power-ups, we've got you covered.
          </p>
          <div className="mt-8 max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700">
            <img src="/assets/feature_cards_screenshot.png" alt="Feature Cards Screenshot" className="w-full h-auto" />
          </div>
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
          <AnimatePresence mode="popLayout">
            {filteredFeatures.map((feature, idx) => (
              <motion.div
                key={feature.title}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
              >
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to upgrade your workflow?</h2>
            <p className="text-gray-300 text-lg mb-8">
              Join thousands of productive teams using Premium to manage projects more effectively.
              Get unlimited history, advanced views, and data exports.
            </p>
            {/* Logic check: If user not premium, show upgrade button */}
            {!useStore.getState().canAccessPremium() && (
              <button
                onClick={() => useStore.getState().setPricingModalOpen(true)}
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white text-lg font-bold py-4 px-10 rounded-full shadow-lg transform transition-transform hover:scale-105"
              >
                Get Premium Now
              </button>
            )}
            {useStore.getState().canAccessPremium() && (
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full text-yellow-400 font-bold border border-yellow-500/30">
                <Crown size={20} fill="currentColor" />
                You are a Premium Member
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
