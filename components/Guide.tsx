
import React from 'react';
import { Shield, ShieldAlert, User, FolderKanban, Bell, Filter } from 'lucide-react';

export const Guide: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto overflow-y-auto h-full pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">FlowBoard User Guide</h1>
        <p className="text-gray-500 text-lg">Everything you need to know about managing your projects.</p>
      </div>

      <div className="space-y-8">
        {/* Roles */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <User className="text-primary" /> User Roles & Hierarchy
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-primary">
                <Shield size={18} /> Manager (Owner)
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                The project creator. Has full access to all settings, columns, and tasks. Can promote members to Leads.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-orange-500">
                <ShieldAlert size={18} /> Lead
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Team leaders who report to the Manager. Can view and manage tasks for Resources assigned to them.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-gray-500">
                <User size={18} /> Resource
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Standard team members. Can only see and move tasks assigned to them.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold mb-3 flex items-center gap-2"><FolderKanban className="text-green-500"/> Projects & Joining</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>Create projects via the sidebar (+).</li>
              <li>Invite members by sharing the <strong>6-digit Project Code</strong> found in the Members modal.</li>
              <li>New members join as "Resource" pending approval.</li>
              <li>Limits: Max 3 projects (Basic). Upgrade to Premium for more.</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Bell className="text-yellow-500"/> Reminders</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>Set date/time reminders on tasks via the Edit Modal.</li>
              <li>Tasks due soon turn <span className="text-yellow-500 font-bold">Yellow</span>.</li>
              <li>Overdue tasks turn <span className="text-red-500 font-bold">Red</span>.</li>
              <li><strong>Note:</strong> This feature must be enabled by an Admin for your team.</li>
            </ul>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Filter className="text-purple-500"/> Board Filters</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Use the toolbar at the top of the board to find what you need quickly.
          </p>
          <div className="flex gap-4 text-sm">
             <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded flex-1">
                <span className="font-bold block mb-1">By Member</span>
                Show only tasks assigned to a specific person.
             </div>
             <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded flex-1">
                <span className="font-bold block mb-1">By Status</span>
                Isolate tasks in a specific column (e.g., "In Progress").
             </div>
             <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded flex-1">
                <span className="font-bold block mb-1">By Tag</span>
                Filter tasks by priority or type tags.
             </div>
          </div>
        </section>
      </div>
    </div>
  );
};
