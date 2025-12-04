import React from 'react';
import { Shield, ShieldAlert, User, FolderKanban, Bell, Filter, LayoutList, Calendar, Archive, Settings, Crown, Clock, Download } from 'lucide-react';

export const Guide: React.FC = () => {
  return (
    <div className="p-8 max-w-5xl mx-auto overflow-y-auto h-full pb-20">
      <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">FlowBoard User Guide</h1>
        <p className="text-gray-500 text-lg">Master your workflow with this comprehensive guide.</p>
      </div>

      <div className="space-y-12">

        {/* 1. Project Views */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <LayoutList className="text-blue-500" /> Project Views
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold mb-3 flex items-center gap-2 text-lg"><FolderKanban size={20} className="text-indigo-500" /> Kanban Board</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                The classic visual workflow. Drag and drop tasks between columns to update their status instantly.
              </p>
              <ul className="list-disc list-inside text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <li>Best for: Visualizing process flow</li>
                <li>Drag & Drop enabled</li>
                <li>Collapse columns to save space</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold mb-3 flex items-center gap-2 text-lg"><LayoutList size={20} className="text-emerald-500" /> List View</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                A structured table view of all tasks. Perfect for scanning many items and sorting by priority or due date.
              </p>
              <ul className="list-disc list-inside text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <li>Best for: Managing large backlogs</li>
                <li>Sortable columns</li>
                <li>Compact density</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold mb-3 flex items-center gap-2 text-lg"><Calendar size={20} className="text-orange-500" /> Calendar View</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                See tasks plotted on a monthly calendar based on their due dates. Never miss a deadline again.
              </p>
              <ul className="list-disc list-inside text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <li>Best for: Deadline tracking</li>
                <li>Month/Week views</li>
                <li>Color-coded by priority</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. History Management */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <Archive className="text-purple-500" /> History & Archiving
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-lg mb-3">Accessing History</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Click the <strong>History</strong> tab in the sidebar to view archived tasks. History is project-specific.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Filter size={18} className="text-gray-400 mt-1" />
                    <div>
                      <span className="font-bold text-sm block">Filtering</span>
                      <p className="text-xs text-gray-500">Use the filter panel to search by text, date range, assignee, or tags.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Download size={18} className="text-gray-400 mt-1" />
                    <div>
                      <span className="font-bold text-sm block">Exporting</span>
                      <p className="text-xs text-gray-500">Download history as CSV. Options: Export All, Export Filtered, or Export Selected.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5">
                <h3 className="font-bold text-lg mb-3">Auto-Archive Settings</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Configure when your completed tasks automatically move to history.
                </p>
                <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <li>Click your profile picture in the top right.</li>
                  <li>Select <strong>Archive Settings</strong>.</li>
                  <li>Choose a duration (e.g., 7 days, 30 days).</li>
                  <li>Tasks in the "Done" column older than this will be automatically archived.</li>
                </ol>
                <div className="mt-4 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 p-3 rounded border border-blue-100 dark:border-blue-800">
                  <strong>Note:</strong> You can also manually archive any task instantly using the "Archive Now" button in the task edit modal.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. User Roles */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <User className="text-green-500" /> Roles & Permissions
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-primary">
                <Shield size={18} /> Manager (Owner)
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Full control. Can manage team, edit project settings, and configure columns.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-orange-500">
                <ShieldAlert size={18} /> Lead
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Team leader. Can manage tasks and view resources, but cannot delete projects.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-gray-500">
                <User size={18} /> Resource
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Standard member. Can view and update assigned tasks.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Admin Panel (If applicable) */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <Shield className="text-red-500" /> Admin Controls
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Super Admins have access to the <strong>Admin Panel</strong> to manage global settings and user limits.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-sm uppercase text-gray-500 mb-3">User Management</h4>
                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <Crown size={16} className="text-yellow-500" />
                    <span><strong>Premium Status:</strong> Toggle premium features for users.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FolderKanban size={16} className="text-blue-500" />
                    <span><strong>Limits:</strong> Set max projects, leads, and resources per user.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Settings size={16} className="text-gray-500" />
                    <span><strong>Features:</strong> Enable/disable notifications, time tracking, etc.</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-sm uppercase text-gray-500 mb-3">Data Retention</h4>
                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <Clock size={16} className="text-purple-500" />
                    <span><strong>History Retention:</strong> Set how long archived data is kept (e.g., 90 days).</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">∞</span>
                    <span>Leave empty to keep history forever.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
