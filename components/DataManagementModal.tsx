import React from 'react';
import { useStore } from '../store';
import { Modal } from './Modal';
import { Download, Archive, FileJson, FileSpreadsheet } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const DataManagementModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { projects, activeProjectId, tasks, columns, archiveProject, users } = useStore();
    const activeProject = projects.find(p => p.id === activeProjectId);

    if (!activeProject) return null;

    const handleExportJSON = () => {
        const projectTasks = tasks.filter(t => t.projectId === activeProjectId);
        const projectColumns = columns.filter(c => c.projectId === activeProjectId);

        const data = {
            project: activeProject,
            columns: projectColumns,
            tasks: projectTasks
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeProject.name.replace(/\s+/g, '_')}_export.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = () => {
        const projectTasks = tasks.filter(t => t.projectId === activeProjectId);

        // Headers
        const headers = ['ID', 'Title', 'Description', 'Status', 'Assignee', 'Priority', 'Estimated Time (min)', 'Actual Time (min)'];

        // Rows
        const rows = projectTasks.map(t => {
            const column = columns.find(c => c.id === t.columnId);
            return [
                t.id,
                `"${t.title.replace(/"/g, '""')}"`, // Escape quotes
                `"${(t.description || '').replace(/"/g, '""')}"`,
                column?.title || 'Unknown',
                (users.find(u => u.id === t.assigneeId)?.name || 'Unassigned'),
                'Normal', // Placeholder for priority logic if complex
                Math.floor((t.estimatedTime || 0) / 60),
                Math.floor((t.timeTracked || 0) / 60)
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeProject.name.replace(/\s+/g, '_')}_export.csv`;
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Data Management">
            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Export Data</h3>
                    <div className="grid grid-cols-2 gap-4">
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
