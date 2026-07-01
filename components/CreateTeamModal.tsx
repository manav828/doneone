import React, { useState } from 'react';
import { useStore } from '../store';
import { Modal } from './Modal';
import { Building2, Sparkles, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isOpen, onClose }) => {
    const { createTeam, canAccessPremium, setPricingModalOpen, getOwnedTeams, currentCompany } = useStore();
    const [teamName, setTeamName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const isPremium = canAccessPremium();
    const ownedTeams = getOwnedTeams();
    const hasExistingWorkspace = ownedTeams.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamName.trim() || !isPremium || hasExistingWorkspace) return;

        setIsCreating(true);
        const team = await createTeam(teamName.trim());
        setIsCreating(false);

        if (team) {
            onClose();
            setTeamName('');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="py-4">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <Building2 className="text-primary" size={28} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Create Your Workspace</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Your workspace is where you manage all team members and projects
                    </p>
                </div>

                {/* Already has workspace */}
                {hasExistingWorkspace ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                                <div>
                                    <h3 className="font-medium text-blue-800 dark:text-blue-300 text-sm">Workspace already active</h3>
                                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                                        Your current plan supports one workspace. You are managing all projects and team members under <strong>"{currentCompany?.name || ownedTeams[0]?.name}"</strong>. To create a new workspace, please manage your existing one first.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            OK, Go Back
                        </button>
                    </div>
                ) : !isPremium ? (
                    /* Premium Required */
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                                <div>
                                    <h3 className="font-medium text-amber-800 dark:text-amber-300 text-sm">Premium Feature</h3>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                                        Creating a workspace and inviting members requires a Premium plan. You'll get:
                                    </p>
                                    <ul className="text-xs text-amber-700 dark:text-amber-400 mt-2 space-y-1">
                                        <li>• One workspace with up to 8 team members</li>
                                        <li>• Unlimited projects under your workspace</li>
                                        <li>• Custom roles and departments</li>
                                        <li>• Assign members to any project</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                onClose();
                                setPricingModalOpen(true);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-white font-medium hover:opacity-90 transition-all"
                        >
                            <Sparkles size={18} />
                            <span>Upgrade to Premium</span>
                        </button>
                    </div>
                ) : (
                    /* Create Workspace Form */
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Workspace Name
                            </label>
                            <input
                                autoFocus
                                type="text"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="e.g. My Company"
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                disabled={isCreating}
                            />
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <h4 className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">What you'll get:</h4>
                            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                                <li className="flex items-center gap-2">
                                    <CheckCircle size={12} className="text-green-500" />
                                    A unique join code to invite team members
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle size={12} className="text-green-500" />
                                    One shared member pool for all projects
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle size={12} className="text-green-500" />
                                    Assign any member to any project
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle size={12} className="text-green-500" />
                                    Custom roles and departments
                                </li>
                            </ul>
                        </div>

                        <button
                            type="submit"
                            disabled={!teamName.trim() || isCreating}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isCreating ? (
                                <>
                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <span>Create Workspace</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </Modal>
    );
};
