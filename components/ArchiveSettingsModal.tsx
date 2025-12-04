import React, { useState } from 'react';
import { useStore } from '../store';
import { Settings, Clock, Save } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const ArchiveSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { currentUser, archiveSettings, updateArchiveSettings } = useStore();
    const [autoArchiveDays, setAutoArchiveDays] = useState(currentUser?.autoArchiveDays || 0);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

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
            alert('Archive settings saved successfully!');
            onClose();
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Settings size={24} />
                        Archive Settings
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Configure when your tasks are automatically archived
                    </p>
                </div>

                <div className="p-6 space-y-6">
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
                                '⚠️ Auto-archive is disabled. Tasks will not be automatically archived.'
                            ) : (
                                `✓ Tasks inactive for ${autoArchiveDays} days will be moved to History`
                            )}
                        </p>
                    </div>

                    {/* Info box */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex gap-2">
                            <Clock size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                            <div className="text-xs text-blue-700 dark:text-blue-300">
                                <strong>How it works:</strong> Tasks that haven't been updated in the specified number of days will automatically move to the History page. You can still view and export them from History.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
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
                        className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition-all shadow-sm hover:shadow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
