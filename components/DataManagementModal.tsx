import React, { useState } from 'react';
import { useStore } from '../store';
import { Modal } from './Modal';
import { Download, Archive, FileJson, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const DataManagementModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const {
        projects,
        tasks,
        columns,
        activeProjectId,
        users,
        archiveProject,
        currentUser,
        canAccessPremium
    } = useStore();

    const activeProject = projects.find(p => p.id === activeProjectId);

    if (!activeProject) return null;

    const handleExportJSON = async () => {
        let projectTasks = tasks.filter(t => t.projectId === activeProjectId);
        let archivedTasks: any[] = [];
        let reportStats: any = {};

        // Feature Gating
        const hasPremium = canAccessPremium();
        const isPremium = hasPremium; // Local alias for existing code compatibility

        if (isPremium) {
            // Fetch Archived Tasks
            const { data: historyData } = await supabase
                .from('task_history')
                .select('*')
                .eq('project_id', activeProjectId);

            if (historyData) {
                archivedTasks = historyData;
            }

            // Calculate Report Stats (Basic)
            const totalTasks = projectTasks.length + archivedTasks.length;
            const completedTasks = projectTasks.filter(t => columns.find(c => c.id === t.columnId)?.title === 'Done').length + archivedTasks.length;

            reportStats = {
                totalTasks,
                completedTasks,
                activeTaskCount: projectTasks.length,
                archivedTaskCount: archivedTasks.length,
                generatedAt: new Date().toISOString()
            };
        }

        const projectColumns = columns.filter(c => c.projectId === activeProjectId);

        const data = {
            project: activeProject,
            columns: projectColumns,
            activeTasks: projectTasks,
            archivedTasks: isPremium ? archivedTasks : [],
            reports: isPremium ? reportStats : undefined,
            isPremiumExport: isPremium
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeProject.name.replace(/\s+/g, '_')}_full_export.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = async () => {
        const isPremium = canAccessPremium();
        let allTasks = tasks.filter(t => t.projectId === activeProjectId).map(t => ({
            ...t,
            status: columns.find(c => c.id === t.columnId)?.title || 'Unknown',
            isArchived: false,
            archivedAt: null
        }));

        if (isPremium) {
            const { data: historyData } = await supabase
                .from('task_history')
                .select('*')
                .eq('project_id', activeProjectId);

            if (historyData) {
                const mappedHistory = historyData.map((h: any) => ({
                    ...h.task_data, // Assuming task_data holds the task snapshot
                    id: h.task_id,
                    status: h.status_at_archive || 'Archived',
                    isArchived: true,
                    archivedAt: h.archived_at
                }));
                allTasks = [...allTasks, ...mappedHistory];
            }
        }

        // Headers
        const headers = ['ID', 'Title', 'Description', 'Status', 'Assignee', 'Is Archived', 'Archived Date', 'Priority', 'Estimated Time (min)', 'Actual Time (min)'];

        // Rows
        const rows = allTasks.map(t => {
            return [
                t.id,
                `"${(t.title || '').replace(/"/g, '""')}"`, // Escape quotes
                `"${(t.description || '').replace(/"/g, '""')}"`,
                t.status,
                (users.find(u => u.id === t.assigneeId)?.name || 'Unassigned'),
                t.isArchived ? 'Yes' : 'No',
                t.archivedAt ? new Date(t.archivedAt).toLocaleDateString() : '',
                'Normal',
                Math.floor((t.estimatedTime || 0) / 60),
                Math.floor((t.timeTracked || 0) / 60)
            ];
        });

        const csvContent = [
            '\uFEFF', // BOM
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeProject.name.replace(/\s+/g, '_')}_${isPremium ? 'full_' : ''}export.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleArchive = async () => {
        if (confirm(`Are you sure you want to archive "${activeProject.name}"? This will remove it from your workspace.`)) {
            await archiveProject(activeProject.id);
            onClose();
        }
    };

    const handleExportExcel = async () => {
        // 1. Prepare Data
        const isPremium = canAccessPremium();

        // Sheet 1: Active Tasks
        let activeTasksData = tasks.filter(t => t.projectId === activeProjectId).map(t => ({
            ID: t.id,
            Title: t.title,
            Description: t.description,
            Status: columns.find(c => c.id === t.columnId)?.title || 'Unknown',
            Assignee: users.find(u => u.id === t.assigneeId)?.name || 'Unassigned',
            Priority: 'Normal', // Placeholder
            EstimatedTime: Math.floor((t.estimatedTime || 0) / 60),
            TimeTracked: Math.floor((t.timeTracked || 0) / 60),
            CreatedAt: new Date(t.createdAt).toLocaleDateString()
        }));

        // Sheet 2: History (Premium only or empty)
        let historyrows: any[] = [];
        if (isPremium) {
            const { data: historyData } = await supabase
                .from('task_history')
                .select('*')
                .eq('project_id', activeProjectId);

            if (historyData) {
                historyrows = historyData.map((h: any) => ({
                    OriginalID: h.task_id,
                    Title: h.task_data?.title || 'Unknown',
                    StatusAtArchive: h.status_at_archive,
                    ArchivedAt: new Date(h.archived_at).toLocaleDateString(),
                    TimeTaken: Math.floor(h.time_taken / 60) + ' min'
                }));
            }
        }

        // Sheet 3: Performance Report
        const totalTasks = activeTasksData.length + historyrows.length;
        const doneColId = columns.find(c => c.projectId === activeProjectId && c.title === 'Done')?.id;
        const activeDone = tasks.filter(t => t.projectId === activeProjectId && t.columnId === doneColId).length;
        const historyDone = historyrows.length; // Assuming history contains mostly done tasks

        const performanceData = [
            { Metric: 'Total Tasks (Active + History)', Value: totalTasks },
            { Metric: 'Active Tasks', Value: activeTasksData.length },
            { Metric: 'Archived/History Tasks', Value: historyrows.length },
            { Metric: 'Completion Rate', Value: totalTasks ? Math.round(((activeDone + historyDone) / totalTasks) * 100) + '%' : '0%' },
            { Metric: 'Generated At', Value: new Date().toLocaleString() }
        ];

        // 2. Create Workbook and Sheets
        const wb = XLSX.utils.book_new();

        const wsActive = XLSX.utils.json_to_sheet(activeTasksData);
        XLSX.utils.book_append_sheet(wb, wsActive, "Active Tasks");

        if (isPremium) {
            const wsHistory = XLSX.utils.json_to_sheet(historyrows);
            XLSX.utils.book_append_sheet(wb, wsHistory, "Task History");
        } else {
            const wsHistory = XLSX.utils.json_to_sheet([{ Note: "Upgrade to Premium to view History export" }]);
            XLSX.utils.book_append_sheet(wb, wsHistory, "Task History");
        }

        const wsPerf = XLSX.utils.json_to_sheet(performanceData);
        XLSX.utils.book_append_sheet(wb, wsPerf, "Performance Report");

        // 3. Save File
        XLSX.writeFile(wb, `${activeProject.name.replace(/\s+/g, '_')}_Report.xlsx`);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Data Management">
            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Export Data</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleExportExcel}
                            className="col-span-2 flex flex-col items-center justify-center p-4 border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors group"
                        >
                            <FileSpreadsheet size={32} className="text-green-600 dark:text-green-400 mb-2" />
                            <span className="text-sm font-bold text-green-700 dark:text-green-300">Export Excel Report (3 Tabs)</span>
                            <span className="text-xs text-green-600/70 dark:text-green-400/70">Tasks • History • Performance</span>
                        </button>
                        <button
                            onClick={handleExportJSON}
                            className="flex flex-col items-center justify-center p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                        >
                            <FileJson size={24} className="text-slate-400 group-hover:text-primary mb-2" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Export JSON</span>
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex flex-col items-center justify-center p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                        >
                            <FileSpreadsheet size={24} className="text-slate-400 group-hover:text-green-500 mb-2" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Export CSV</span>
                        </button>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Danger Zone</h3>
                    <button
                        onClick={handleArchive}
                        className="w-full flex items-center justify-center gap-2 p-3 border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                        <Archive size={18} />
                        <span>Archive Project</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};
