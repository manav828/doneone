import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Modal } from './Modal';
import { Building2 } from 'lucide-react';

interface ManageMemberDepartmentsModalProps {
    userId: string;
    onClose: () => void;
}

export const ManageMemberDepartmentsModal: React.FC<ManageMemberDepartmentsModalProps> = ({ userId, onClose }) => {
    const { users, teams, currentUser, activeMembers, addTeamMember, removeTeamMember } = useStore();
    const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    // Derived state
    const ownedTeams = teams.filter(t => t.ownerId === currentUser?.id);

    // Initialize state
    useEffect(() => {
        const currentTeamIds = activeMembers
            .filter(m => m.userId === userId)
            .map(m => m.teamId);
        setSelectedTeamIds(new Set(currentTeamIds));
    }, [userId, activeMembers]);

    const memberUser = users.find(u => u.id === userId);
    if (!memberUser) return null;

    // Filter out "Unassigned" team from the list so user can't manually select/deselect it?
    // Actually, if we AUTO-remove it, we should hide it.
    const manageableTeams = ownedTeams.filter(t => t.name !== 'Unassigned');

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const currentMemberships = activeMembers.filter(m => m.userId === userId);
            const currentTeamIds = new Set(currentMemberships.map(m => m.teamId));

            // 1. Add new teams
            const toAdd = Array.from(selectedTeamIds).filter(id => !currentTeamIds.has(id));
            for (const teamId of toAdd) {
                await addTeamMember(teamId, userId);
            }

            // 2. Remove old teams
            const toRemove = Array.from(currentTeamIds).filter(id => !selectedTeamIds.has(id));

            for (const teamId of toRemove) {
                if (manageableTeams.some(t => t.id === teamId)) {
                    await removeTeamMember(teamId, userId);
                }
            }

            // 3. Auto-remove Unassigned if now in a Real Team
            const unassignedTeam = ownedTeams.find(t => t.name === 'Unassigned');
            if (unassignedTeam && currentTeamIds.has(unassignedTeam.id)) {
                // Check if user HAS any real team now (either existing or newly added)
                // Start with selectedTeamIds (which is the target state sans Unassigned if it was hidden)
                // Ensure we check if any ID in selectedTeamIds is NOT Unassigned
                const hasRealTeam = Array.from(selectedTeamIds).some(id => id !== unassignedTeam.id);
                if (hasRealTeam) {
                    await removeTeamMember(unassignedTeam.id, userId);
                }
            }

        } catch (error) {
            console.error('Error saving departments', error);
        } finally {
            setIsSaving(false);
            onClose();
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={`Manage Departments: ${memberUser.name}`}
        >
            <div className="space-y-4">
                <p className="text-sm text-slate-500">
                    Select the departments (workspaces) this employee should be a member of.
                </p>
                <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-900/50">
                    {manageableTeams.length === 0 ? (
                        <p className="text-center text-slate-400 py-4 text-xs">No departments available.</p>
                    ) : (
                        manageableTeams.map(team => {
                            const isChecked = selectedTeamIds.has(team.id);
                            return (
                                <label key={team.id} className="flex items-center justify-between p-3 hover:bg-white dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <Building2 size={16} />
                                        </div>
                                        <span className="font-medium">{team.name}</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                            const newSet = new Set(selectedTeamIds);
                                            if (e.target.checked) {
                                                newSet.add(team.id);
                                            } else {
                                                newSet.delete(team.id);
                                            }
                                            setSelectedTeamIds(newSet);
                                        }}
                                        className="w-5 h-5 rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-600 cursor-pointer"
                                    />
                                </label>
                            );
                        })
                    )}
                </div>
                <div className="flex justify-end pt-2 gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Done'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
