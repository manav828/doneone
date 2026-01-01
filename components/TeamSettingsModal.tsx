import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Modal } from './Modal';
import { Team, TeamMember, TeamRole, Department, Project } from '../types';
import {
    Users,
    Copy,
    Check,
    Plus,
    Trash2,
    Edit2,
    Building2,
    Tag,
    Clock,
    UserCheck,
    UserX,
    Settings,
    Link2,
    ChevronRight,
    FolderKanban,
    AlertTriangle,
    UserPlus,
    X
} from 'lucide-react';

interface TeamSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    team: Team | null;
}

export const TeamSettingsModal: React.FC<TeamSettingsModalProps> = ({ isOpen, onClose, team }) => {
    const {
        currentUser,
        teamMembers,
        teamRoles,
        departments,
        users,
        projects,
        fetchTeamMembers,
        fetchTeamRoles,
        fetchDepartments,
        approveTeamMember,
        rejectTeamMember,
        removeTeamMember,
        createTeamRole,
        deleteTeamRole,
        assignRoleToMember,
        createDepartment,
        deleteDepartment,
        addMemberToDepartment,
        removeMemberFromDepartment,
        updateTeam,
        deleteTeam,
        canAddTeamMember,
        getTeamProjects,
        assignMemberToProject
    } = useStore();

    const [activeTab, setActiveTab] = useState<'members' | 'departments' | 'projects' | 'settings'>('members');
    const [codeCopied, setCodeCopied] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleColor, setNewRoleColor] = useState('#6b7280');
    const [newDeptName, setNewDeptName] = useState('');
    const [newDeptColor, setNewDeptColor] = useState('#3b82f6');
    const [teamNameInput, setTeamNameInput] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [expandedDept, setExpandedDept] = useState<string | null>(null);
    const [expandedProject, setExpandedProject] = useState<string | null>(null);

    const isOwner = team?.ownerId === currentUser?.id;

    useEffect(() => {
        if (team && isOpen) {
            fetchTeamMembers(team.id);
            fetchTeamRoles(team.id);
            fetchDepartments(team.id);
        }
    }, [team, isOpen]);

    useEffect(() => {
        if (team) {
            setTeamNameInput(team.name);
        }
    }, [team]);

    const handleCopyCode = () => {
        if (team?.joinCode) {
            navigator.clipboard.writeText(team.joinCode);
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
        }
    };

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (team && newRoleName.trim()) {
            await createTeamRole(team.id, newRoleName, newRoleColor);
            setNewRoleName('');
            setNewRoleColor('#6b7280');
        }
    };

    const handleCreateDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (team && newDeptName.trim()) {
            await createDepartment(team.id, newDeptName, newDeptColor);
            setNewDeptName('');
            setNewDeptColor('#3b82f6');
        }
    };

    const handleSaveTeamName = async () => {
        if (team && teamNameInput.trim() && teamNameInput !== team.name) {
            await updateTeam(team.id, { name: teamNameInput });
        }
    };

    const handleDeleteTeam = async () => {
        if (team) {
            await deleteTeam(team.id);
            onClose();
        }
    };

    const handleAssignToDepartment = async (deptId: string, userId: string) => {
        await addMemberToDepartment(deptId, userId);
        if (team) await fetchDepartments(team.id);
    };

    const handleRemoveFromDepartment = async (deptId: string, userId: string) => {
        await removeMemberFromDepartment(deptId, userId);
        if (team) await fetchDepartments(team.id);
    };

    const handleAssignToProject = async (projectId: string, userId: string, role: 'Lead' | 'Resource') => {
        await assignMemberToProject(projectId, userId, role);
    };

    if (!team) return null;

    const activeMembers = teamMembers.filter(m => m.teamId === team.id && m.status === 'active');
    const pendingMembers = teamMembers.filter(m => m.teamId === team.id && m.status === 'pending');
    const teamRolesList = teamRoles.filter(r => r.teamId === team.id);
    const teamDepartments = departments.filter(d => d.teamId === team.id);
    const teamProjects = getTeamProjects(team.id);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="min-h-[550px] max-h-[80vh] flex flex-col">
                {/* Compact Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="text-primary" size={20} />
                        </div>
                        <div>
                            <input
                                type="text"
                                value={teamNameInput}
                                onChange={(e) => setTeamNameInput(e.target.value)}
                                onBlur={handleSaveTeamName}
                                className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:border-b focus:border-primary"
                                disabled={!isOwner}
                            />
                            <p className="text-xs text-slate-500 flex items-center gap-2">
                                <Users size={12} /> {activeMembers.length}/{team.effectiveLimit || 8} members
                                {isOwner && (
                                    <>
                                        <span className="text-slate-300">•</span>
                                        <span className="font-mono text-primary">{team.joinCode}</span>
                                        <button onClick={handleCopyCode} className="text-slate-400 hover:text-primary">
                                            {codeCopied ? <Check size={12} /> : <Copy size={12} />}
                                        </button>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    {[
                        { id: 'members', label: 'Members', icon: Users, count: activeMembers.length },
                        { id: 'departments', label: 'Depts', icon: Building2, count: teamDepartments.length },
                        { id: 'projects', label: 'Projects', icon: FolderKanban, count: teamProjects.length },
                        ...(isOwner ? [{ id: 'settings', label: 'Settings', icon: Settings }] : [])
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors ${activeTab === tab.id
                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                        >
                            <tab.icon size={13} />
                            {tab.label}
                            {'count' in tab && (
                                <span className="text-[10px] bg-slate-200 dark:bg-slate-600 px-1 rounded">{tab.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Members Tab */}
                    {activeTab === 'members' && (
                        <div className="space-y-3">
                            {/* Pending Requests */}
                            {pendingMembers.length > 0 && isOwner && (
                                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <h4 className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1">
                                        <Clock size={12} /> Pending ({pendingMembers.length})
                                    </h4>
                                    <div className="space-y-1">
                                        {pendingMembers.map(member => {
                                            const user = users.find(u => u.id === member.userId) || member.user;
                                            return (
                                                <div key={member.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded text-sm">
                                                    <span>{user?.name || 'Unknown'}</span>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => approveTeamMember(team.id, member.userId)}
                                                            disabled={!canAddTeamMember(team.id)}
                                                            className="p-1 bg-green-100 text-green-600 hover:bg-green-200 rounded disabled:opacity-50"
                                                        >
                                                            <UserCheck size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => rejectTeamMember(team.id, member.userId)}
                                                            className="p-1 bg-red-100 text-red-600 hover:bg-red-200 rounded"
                                                        >
                                                            <UserX size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Role Creation - Inline */}
                            {isOwner && (
                                <form onSubmit={handleCreateRole} className="flex gap-1 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <input
                                        type="color"
                                        value={newRoleColor}
                                        onChange={(e) => setNewRoleColor(e.target.value)}
                                        className="w-8 h-8 rounded cursor-pointer border-none"
                                    />
                                    <input
                                        type="text"
                                        value={newRoleName}
                                        onChange={(e) => setNewRoleName(e.target.value)}
                                        placeholder="New role name..."
                                        className="flex-1 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newRoleName.trim()}
                                        className="px-2 py-1 bg-primary text-white rounded text-xs disabled:opacity-50"
                                    >
                                        <Plus size={12} />
                                    </button>
                                </form>
                            )}

                            {/* Active Members */}
                            <div className="space-y-1">
                                {activeMembers.map(member => {
                                    const user = users.find(u => u.id === member.userId) || member.user;
                                    const role = teamRolesList.find(r => r.id === member.roleId);
                                    const isMemberOwner = member.userId === team.ownerId;

                                    return (
                                        <div key={member.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                                    {user?.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium flex items-center gap-1">
                                                        {user?.name}
                                                        {isMemberOwner && <span className="text-[9px] px-1 bg-primary/10 text-primary rounded">OWNER</span>}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500">{user?.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {isOwner && !isMemberOwner && (
                                                    <select
                                                        value={member.roleId || ''}
                                                        onChange={(e) => assignRoleToMember(team.id, member.userId, e.target.value || null)}
                                                        className="text-[10px] px-1 py-0.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                                                    >
                                                        <option value="">No Role</option>
                                                        {teamRolesList.map(r => (
                                                            <option key={r.id} value={r.id}>{r.name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                                {role && !isOwner && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${role.color}20`, color: role.color }}>
                                                        {role.name}
                                                    </span>
                                                )}
                                                {isOwner && !isMemberOwner && (
                                                    <button
                                                        onClick={() => removeTeamMember(team.id, member.userId)}
                                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Departments Tab */}
                    {activeTab === 'departments' && (
                        <div className="space-y-3">
                            {/* Create Department */}
                            {isOwner && (
                                <form onSubmit={handleCreateDepartment} className="flex gap-1">
                                    <input
                                        type="color"
                                        value={newDeptColor}
                                        onChange={(e) => setNewDeptColor(e.target.value)}
                                        className="w-8 h-8 rounded cursor-pointer border-none"
                                    />
                                    <input
                                        type="text"
                                        value={newDeptName}
                                        onChange={(e) => setNewDeptName(e.target.value)}
                                        placeholder="New department..."
                                        className="flex-1 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                                    />
                                    <button type="submit" disabled={!newDeptName.trim()} className="px-2 bg-primary text-white rounded text-xs disabled:opacity-50">
                                        <Plus size={12} />
                                    </button>
                                </form>
                            )}

                            {/* Department List - Expandable */}
                            <div className="space-y-2">
                                {teamDepartments.map(dept => {
                                    const isExpanded = expandedDept === dept.id;
                                    // Get members in this department (would need to query)

                                    return (
                                        <div key={dept.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                            <div
                                                className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                                onClick={() => setExpandedDept(isExpanded ? null : dept.id)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dept.color }} />
                                                    <span className="text-sm font-medium">{dept.name}</span>
                                                    <span className="text-[10px] text-slate-500">({dept.memberCount || 0})</span>
                                                </div>
                                                {isOwner && dept.name !== 'General' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteDepartment(dept.id); }}
                                                        className="p-1 text-slate-400 hover:text-red-500"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Expanded: Assign Members */}
                                            {isExpanded && isOwner && (
                                                <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
                                                    <p className="text-[10px] text-slate-500 mb-2">Click member to add/remove from department:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {activeMembers.map(member => {
                                                            const user = users.find(u => u.id === member.userId) || member.user;
                                                            // Check if already in department (simplified)
                                                            const inDept = false; // Would need to track this

                                                            return (
                                                                <button
                                                                    key={member.id}
                                                                    onClick={() => handleAssignToDepartment(dept.id, member.userId)}
                                                                    className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${inDept
                                                                        ? 'bg-primary/10 border-primary text-primary'
                                                                        : 'border-slate-200 dark:border-slate-600 hover:border-primary'
                                                                        }`}
                                                                >
                                                                    {user?.name}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Projects Tab */}
                    {activeTab === 'projects' && (
                        <div className="space-y-2">
                            {teamProjects.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <FolderKanban size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No projects in this workspace yet.</p>
                                    <p className="text-xs">Create a new project to get started.</p>
                                </div>
                            ) : (
                                teamProjects.map(project => {
                                    const isExpanded = expandedProject === project.id;
                                    const projectMembers = [
                                        ...(project.leadIds || []).map(id => ({ id, role: 'Lead' })),
                                        ...(project.resourceIds || []).map(id => ({ id, role: 'Resource' }))
                                    ];

                                    return (
                                        <div key={project.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                            <div
                                                className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100"
                                                onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                                    <span className="text-sm font-medium">{project.name}</span>
                                                    <span className="text-[10px] text-slate-500">({projectMembers.length} assigned)</span>
                                                </div>
                                            </div>

                                            {/* Expanded: Assign Members to Project */}
                                            {isExpanded && isOwner && (
                                                <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
                                                    <p className="text-[10px] text-slate-500 mb-2">Assign team members to this project:</p>
                                                    <div className="space-y-1">
                                                        {activeMembers.filter(m => m.userId !== team.ownerId).map(member => {
                                                            const user = users.find(u => u.id === member.userId) || member.user;
                                                            const isLead = project.leadIds?.includes(member.userId);
                                                            const isResource = project.resourceIds?.includes(member.userId);
                                                            const assigned = isLead || isResource;

                                                            return (
                                                                <div key={member.id} className="flex items-center justify-between py-1">
                                                                    <span className="text-xs">{user?.name}</span>
                                                                    <div className="flex gap-1">
                                                                        <button
                                                                            onClick={() => handleAssignToProject(project.id, member.userId, 'Lead')}
                                                                            className={`px-2 py-0.5 text-[10px] rounded ${isLead ? 'bg-blue-500 text-white' : 'bg-slate-100 hover:bg-blue-100 text-slate-600'
                                                                                }`}
                                                                        >
                                                                            Lead
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleAssignToProject(project.id, member.userId, 'Resource')}
                                                                            className={`px-2 py-0.5 text-[10px] rounded ${isResource ? 'bg-green-500 text-white' : 'bg-slate-100 hover:bg-green-100 text-slate-600'
                                                                                }`}
                                                                        >
                                                                            Resource
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && isOwner && (
                        <div className="space-y-4">
                            {/* Team Info */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-slate-500">Join Code</span>
                                    <button onClick={handleCopyCode} className="text-xs text-primary hover:underline">
                                        {codeCopied ? 'Copied!' : 'Copy Code'}
                                    </button>
                                </div>
                                <div className="font-mono text-lg tracking-widest text-center py-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                    {team.joinCode}
                                </div>
                            </div>

                            {/* Member Limit Progress */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-slate-500">Member Usage</span>
                                    <span className="font-medium">{activeMembers.length} / {team.effectiveLimit || 8}</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, (activeMembers.length / (team.effectiveLimit || 8)) * 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Roles Management */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <h4 className="text-xs font-medium mb-2">Custom Roles ({teamRolesList.length})</h4>
                                <div className="flex flex-wrap gap-1">
                                    {teamRolesList.map(role => (
                                        <span key={role.id} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded" style={{ backgroundColor: `${role.color}20`, color: role.color }}>
                                            {role.name}
                                            <button onClick={() => deleteTeamRole(role.id)} className="hover:text-red-500">
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <h4 className="text-xs font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
                                    <AlertTriangle size={12} /> Danger Zone
                                </h4>
                                {!showDeleteConfirm ? (
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="w-full py-2 text-xs font-medium text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                    >
                                        Delete this Workspace
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-xs text-red-600">This will delete all projects and remove all members. Are you sure?</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="flex-1 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleDeleteTeam}
                                                className="flex-1 py-1.5 text-xs bg-red-500 text-white hover:bg-red-600 rounded"
                                            >
                                                Yes, Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
