import React, { useState } from 'react';
import { useStore } from '../store';
import { Modal } from './Modal';
import { Clock, Save, Check } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const ArchiveSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { currentUser, updateArchiveSettings, projects, activeProjectId, columns, updateColumn } = useStore();
    const [autoArchiveDays, setAutoArchiveDays] = useState(currentUser?.autoArchiveDays || 0);
    const [isSaving, setIsSaving] = useState(false);

    const activeProject = projects.find(p => p.id === activeProjectId);
    const projectColumns = columns.filter(c => c.projectId === activeProjectId);

    const toggleColumnArchive = async (columnId: string, currentValue: boolean) => {
        await updateColumn(columnId, { isArchiveEnabled: !currentValue });
    };

    const presets = [
        { label: '7 days', value: 7 },
        { label: '14 days', value: 14 },
        { label: '30 days', value: 30 },
        { label: '60 days', value: 60 },
        { label: '90 days', value: 90 }
    ];

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateArchiveSettings(autoArchiveDays);
            onClose();
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Archive Settings">
            <div className="space-y-6">
                {/* Auto-archive setting */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Auto-archive tasks after:
                    </label>

                    {/* Preset buttons */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {presets.map(preset => (
                            <button
                                key={preset.value}
                                onClick={() => setAutoArchiveDays(preset.value)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${autoArchiveDays === preset.value
                                    ? 'bg-primary text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    {/* Custom input */}
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="0"
                            value={autoArchiveDays}
                            onChange={e => setAutoArchiveDays(parseInt(e.target.value) || 0)}
                            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="Custom days"
                        />
                        <span className="text-sm text-slate-500 dark:text-slate-400">days</span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                        {autoArchiveDays === 0 ? (
                            '⚠️ Auto-archive is disabled.'
                        ) : (
                            `✓ Tasks inactive for ${autoArchiveDays} days will be moved to History`
                        )}
                    </p>
                </div>

                {/* Column Selection */}
                {activeProject && (
                    <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            Select columns to auto-archive from:
                        </label>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {projectColumns.map(column => (
                                <div key={column.id}
                                    onClick={() => toggleColumnArchive(column.id, !!column.isArchiveEnabled)}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group"
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${column.isArchiveEnabled
                                        ? 'bg-primary border-primary text-white'
                                        : 'border-slate-300 dark:border-slate-600 group-hover:border-primary'
                                        }`}>
                                        {column.isArchiveEnabled && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {column.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Info box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex gap-2">
                        <Clock size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                            Tasks that haven't been updated will move to History.
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition-all shadow-sm hover:shadow flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : (
                            <>
                                <Save size={16} />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
