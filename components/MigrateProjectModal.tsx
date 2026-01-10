 
import React, { useState } from 'react';
import { useStore } from '../store';
import { Modal } from './Modal';
import { Building2, Layers, ArrowRight, ShieldCheck, ChevronDown, CheckCircle } from 'lucide-react';

interface MigrateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
}

export const MigrateProjectModal: React.FC<MigrateProjectModalProps> = ({ isOpen, onClose, projectId }) => {
    const { projects, teams, departments, assignProjectToTeam, currentUser } = useStore();
    const project = projects.find(p => p.id === projectId);

    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [selectedDeptId, setSelectedDeptId] = useState('');
    const [isMigrating, setIsMigrating] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Filter teams where user is owner or manager (Heads can also receive projects)
    const manageableTeams = teams.filter(t =>
        t.ownerId === currentUser?.id || t.managerIds?.includes(currentUser?.id || '')
    );

    const teamDepts = departments.filter(d => d.teamId === selectedTeamId);

    const handleMigrate = async () => {
        if (!selectedTeamId) return;

        setIsMigrating(true);
        try {
            await assignProjectToTeam(projectId, selectedTeamId, selectedDeptId || undefined);
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setIsSuccess(false);
                setSelectedTeamId('');
                setSelectedDeptId('');
            }, 2000);
        } catch (error) {
            console.error('Migration failed:', error);
        } finally {
            setIsMigrating(false);
        }
    };

    if (!project) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Move to Organization">
            <div className="space-y-6 py-2">
                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600">
                            <CheckCircle size={40} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Project Migrated!</h3>
                            <p className="text-slate-500 dark:text-slate-400">"{project.name}" is now part of your organization.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700">
                                    {project.logo ? (
                                        <img src={project.logo} alt={project.name} className="w-8 h-8 object-cover rounded" />
                                    ) : (
                                        <Layers className="text-primary" size={24} />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">{project.name}</h4>
                                    <p className="text-xs text-slate-500">Personal Project</p>
                                </div>
                                <ArrowRight size={20} className="text-slate-300 ml-auto" />
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                                    <Building2 className="text-primary" size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-primary" />
                                    Target Workspace (Company)
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedTeamId}
                                        onChange={(e) => {
                                            setSelectedTeamId(e.target.value);
                                            setSelectedDeptId(''); // Reset dept when team changes
                                        }}
                                        className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all"
                                    >
                                        <option value="">Select a workspace...</option>
                                        {manageableTeams.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                </div>
                            </div>

                            {selectedTeamId && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                                        <Layers size={16} className="text-primary" />
                                        Assign to Department (Optional)
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedDeptId}
                                            onChange={(e) => setSelectedDeptId(e.target.value)}
                                            className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all"
                                        >
                                            <option value="">None (Top Level Organization)</option>
                                            {teamDepts.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                    </div>
                                    <p className="mt-2 text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                                        Choosing a department helps organize projects by team and division.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                disabled={isMigrating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMigrate}
                                disabled={!selectedTeamId || isMigrating}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-md shadow-primary/20 
                  ${!selectedTeamId || isMigrating ? 'bg-slate-400 cursor-not-allowed opacity-50' : 'bg-primary hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0'}
                `}
                            >
                                {isMigrating ? 'Moving...' : 'Move to Organization'}
                            </button>
                        </div>

                        {!selectedTeamId && (
                            <p className="text-center text-[11px] text-slate-400">
                                You must have at least one workspace to migrate a project.
                            </p>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
};
