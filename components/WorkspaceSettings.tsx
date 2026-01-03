import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import {
    Users,
    Building2,
    FolderKanban,
    Tag,
    Settings,
    ArrowLeft,
    Copy,
    Check,
    Plus,
    Trash2,
    Edit2,
    Clock,
    UserCheck,
    UserX,
    AlertTriangle,
    ChevronRight,
    ChevronDown,
    Search,
    X
} from 'lucide-react';
import { ManageMemberDepartmentsModal } from './ManageMemberDepartmentsModal';

export const WorkspaceSettings: React.FC = () => {
    const navigate = useNavigate();
    const {
        currentUser,
        teams,
        teamMembers,
        teamRoles,
        departments,
        users,
        isLoading, // Add isLoading
        fetchTeams,
        fetchTeamMembers,
        fetchTeamRoles,
        fetchDepartments,
        approveTeamMember,
        rejectTeamMember,
        removeTeamMember,
        createTeamRole,
        updateTeamRole,
        deleteTeamRole,
        assignRoleToMember,
        createDepartment,
        updateDepartment,
        deleteDepartment,
        currentCompany,
        updateCompany,
        addMemberToDepartment,
        createTeam,
        updateTeam,
        deleteTeam,
        canAddTeamMember,
        getTeamProjects,
        getOwnedTeams,
        assignMemberToProject,
        assignTeamHead, removeTeamHead, getScopedEmployees, getCompanyEmployees, addTeamMember
    } = useStore();

    const [activeSection, setActiveSection] = useState<'members' | 'departments' | 'roles' | 'projects' | 'settings'>('members');
    const [codeCopied, setCodeCopied] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Rename Modal State
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [itemToRename, setItemToRename] = useState<{ id: string, name: string, type: 'department' | 'company' } | null>(null);
    const [renameValue, setRenameValue] = useState('');

    // Form states
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleColor, setNewRoleColor] = useState('#6366f1');
    const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
    const [editRoleName, setEditRoleName] = useState('');
    const [editRoleColor, setEditRoleColor] = useState('');

    const [newDeptName, setNewDeptName] = useState('');
    const [newDeptColor, setNewDeptColor] = useState('#3b82f6');
    const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
    const [editDeptName, setEditDeptName] = useState('');
    const [editDeptColor, setEditDeptColor] = useState('');
    const [managingDeptId, setManagingDeptId] = useState<string | null>(null);
    const [headSearch, setHeadSearch] = useState('');

    const [expandedProject, setExpandedProject] = useState<string | null>(null);
    const [expandedDept, setExpandedDept] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    // Project Assignment States
    const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('all');
    const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [managingMemberDeptsId, setManagingMemberDeptsId] = useState<string | null>(null);

    // Get ALL manageable teams (Owned by me OR where I am Team Head)
    // Team Heads need access to Workspace Settings for their teams
    const manageableTeams = teams.filter(t =>
        t.ownerId === currentUser?.id ||
        t.managerIds?.includes(currentUser?.id || '')
    );
    // Alias to fix ReferenceErrors while using new logic
    const ownedTeams = manageableTeams;
    const primaryTeam = manageableTeams[0]; // Primary workspace for settings

    // Aggregate ALL members across all owned teams filtered by Access Scope
    const visibleUsers = getScopedEmployees();
    const companyEmployees = getCompanyEmployees();
    const visibleUserIds = new Set(visibleUsers.map(u => u.id));

    const allMembers = teamMembers.filter(m =>
        ownedTeams.some(t => t.id === m.teamId) && visibleUserIds.has(m.userId)
    );

    // UNIQUE EMPLOYEES: Deduplicate by userId - one person = one seat regardless of workspaces
    const uniqueUserIds = new Set<string>();
    const uniqueActiveMembers = allMembers
        .filter(m => m.status === 'active')
        .filter(m => {
            if (uniqueUserIds.has(m.userId)) return false;
            uniqueUserIds.add(m.userId);
            return true;
        });

    const uniquePendingUserIds = new Set<string>();
    const uniquePendingMembers = allMembers
        .filter(m => m.status === 'pending')
        .filter(m => {
            if (uniquePendingUserIds.has(m.userId)) return false;
            uniquePendingUserIds.add(m.userId);
            return true;
        });

    // Keep full list for display (showing workspace assignments)
    const activeMembers = allMembers.filter(m => m.status === 'active');
    const pendingMembers = allMembers.filter(m => m.status === 'pending');

    // Aggregate ALL roles across all owned teams
    const allRoles = teamRoles.filter(r => ownedTeams.some(t => t.id === r.teamId));

    // Aggregate ALL departments across all owned teams  
    const allDepartments = departments.filter(d => ownedTeams.some(t => t.id === d.teamId));

    // Aggregate ALL projects across all owned teams
    const allProjects = ownedTeams.flatMap(t => getTeamProjects(t.id));

    // Total member limit (from primary team/user profile) - based on UNIQUE employees
    const totalMemberLimit = primaryTeam?.effectiveLimit || currentUser?.maxMembersPerProject || 8;
    const uniqueEmployeeCount = uniqueActiveMembers.length;

    // Fetch all teams first, then fetch members for each
    useEffect(() => {
        const loadAllData = async () => {
            await fetchTeams();
            // After teams fetch, get all owned teams from store
            const { teams, currentUser } = useStore.getState();
            const myTeams = teams.filter(t =>
                t.ownerId === currentUser?.id ||
                t.managerIds?.includes(currentUser?.id || '')
            );
            // Fetch members for ALL manageable teams
            for (const team of myTeams) {
                await fetchTeamMembers(team.id);
                await fetchTeamRoles(team.id);
                await fetchDepartments(team.id);
            }
        };
        loadAllData();
    }, []);

    if (ownedTeams.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center">
                    <Building2 size={48} className="mx-auto mb-4 text-slate-300" />
                    <h2 className="text-xl font-semibold mb-2">No Teams Found</h2>
                    <p className="text-slate-500 mb-4">Create a workspace to manage your team</p>
                    <button onClick={() => navigate('/')} className="px-4 py-2 bg-primary text-white rounded-lg">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    };

    // Role CRUD (use primary team for new items)
    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newRoleName.trim() && primaryTeam) {
            await createTeamRole(primaryTeam.id, newRoleName, newRoleColor);
            setNewRoleName('');
            setNewRoleColor('#6366f1');
        }
    };

    const startEditRole = (role: any) => {
        setEditingRoleId(role.id);
        setEditRoleName(role.name);
        setEditRoleColor(role.color);
    };

    const handleUpdateRole = async () => {
        if (editingRoleId && editRoleName.trim()) {
            await updateTeamRole(editingRoleId, { name: editRoleName, color: editRoleColor });
            setEditingRoleId(null);
        }
    };

    // Department CRUD
    const handleCreateDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newDeptName.trim() && primaryTeam) {
            await createDepartment(primaryTeam.id, newDeptName, newDeptColor);
            setNewDeptName('');
            setNewDeptColor('#3b82f6');
        }
    };

    const startEditDept = (dept: any) => {
        setEditingDeptId(dept.id);
        setEditDeptName(dept.name);
        setEditDeptColor(dept.color);
    };

    const handleUpdateDept = async () => {
        if (editingDeptId && editDeptName.trim()) {
            await updateDepartment(editingDeptId, { name: editDeptName, color: editDeptColor });
            setEditingDeptId(null);
        }
    };

    const handleAssignToProject = async (projectId: string, userId: string, role: 'Lead' | 'Resource') => {
        await assignMemberToProject(projectId, userId, role);
    };

    const handleDeleteTeam = async (teamId: string) => {
        await deleteTeam(teamId);
        setShowDeleteConfirm(null);
        if (ownedTeams.length <= 1) {
            navigate('/');
        }
    };

    const navItems = [
        { id: 'members', label: 'Employees', icon: Users, count: uniqueEmployeeCount },
        { id: 'departments', label: 'Departments', icon: Building2, count: ownedTeams.filter(t => t.name !== 'DoneOne').length },
        { id: 'roles', label: 'Roles', icon: Tag, count: allRoles.length },
        { id: 'projects', label: 'Projects', icon: FolderKanban, count: allProjects.length },
    ];

    if (primaryTeam?.ownerId === currentUser?.id) {
        navItems.push({ id: 'settings', label: 'Settings', icon: Settings, count: 0 });
    }

    return (
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 h-full overflow-hidden">
            {/* Top Navigation Bar */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header & Tabs */}
                    <div className="flex items-center justify-between h-16">
                        {/* Tabs */}
                        <div className="flex items-center space-x-8 h-full overflow-x-auto no-scrollbar">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id as any)}
                                    className={`
                                    flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap
                                    ${activeSection === item.id
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300'
                                        }
                                `}
                                >
                                    <item.icon size={18} />
                                    {item.label}
                                    {'count' in item && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${activeSection === item.id
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                            }`}>
                                            {item.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Pending Requests Badge */}
                        {pendingMembers.length > 0 && (
                            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-900/50">
                                <Clock size={14} className="text-amber-600 dark:text-amber-400" />
                                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">{pendingMembers.length} Pending</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content - Centered */}
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
                <div className="max-w-6xl mx-auto p-6 space-y-8">

                    {/* Main Content */}


                    {/* Members Section */}
                    {activeSection === 'members' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold">Company Employees</h2>
                                    <p className="text-sm text-slate-500">
                                        Your team employees
                                        {primaryTeam?.ownerId === currentUser?.id && ` (${uniqueEmployeeCount}/${totalMemberLimit} seats used)`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={selectedDepartmentFilter}
                                        onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                                        className="pl-3 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="all">All Departments</option>
                                        {ownedTeams.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search members..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pending Requests */}
                            {pendingMembers.length > 0 && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                                    <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                                        <Clock size={16} />
                                        Pending Requests ({pendingMembers.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {pendingMembers.map(member => {
                                            const user = users.find(u => u.id === member.userId) || member.user;
                                            const team = ownedTeams.find(t => t.id === member.teamId);
                                            return (
                                                <div key={member.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-semibold">
                                                            {user?.name?.charAt(0) || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{user?.name || 'Unknown'}</p>
                                                            <p className="text-xs text-slate-500">{user?.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => approveTeamMember(member.teamId, member.userId)}
                                                            disabled={activeMembers.length >= totalMemberLimit}
                                                            className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
                                                        >
                                                            <UserCheck size={14} />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => rejectTeamMember(member.teamId, member.userId)}
                                                            className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 flex items-center gap-1"
                                                        >
                                                            <UserX size={14} />
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Active Employees Table */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="grid grid-cols-[1fr_200px_140px_60px] gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 uppercase">
                                    <span>Employee</span>
                                    <span>Departments</span>
                                    <span>Role</span>
                                    <span></span>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {uniqueActiveMembers
                                        .filter(m => {
                                            const user = users.find(u => u.id === m.userId);
                                            const matchesSearch = !searchQuery ||
                                                user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

                                            const matchesDept = selectedDepartmentFilter === 'all' ||
                                                activeMembers.some(am => am.userId === m.userId && am.teamId === selectedDepartmentFilter);

                                            return matchesSearch && matchesDept;
                                        })
                                        .map(member => {
                                            const user = users.find(u => u.id === member.userId) || member.user;
                                            const isMemberOwner = ownedTeams.some(t => t.ownerId === member.userId);
                                            const teamRolesList = allRoles.filter(r => r.teamId === member.teamId);

                                            // Get ALL departments this employee belongs to
                                            const employeeDeptIds = activeMembers
                                                .filter(m => m.userId === member.userId)
                                                .map(m => m.teamId);
                                            const employeeDepts = ownedTeams.filter(t => employeeDeptIds.includes(t.id));
                                            const availableDepts = ownedTeams.filter(t => !employeeDeptIds.includes(t.id));

                                            return (
                                                <div key={member.id} className="grid grid-cols-[1fr_200px_140px_60px] gap-4 px-4 py-3 items-center hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary overflow-hidden">
                                                            {user?.avatar ? (
                                                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                user?.name?.charAt(0) || '?'
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium flex items-center gap-2">
                                                                {user?.name}
                                                                {isMemberOwner && <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold">OWNER</span>}
                                                            </p>
                                                            <p className="text-xs text-slate-500">{user?.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {employeeDepts.map(dept => (
                                                            <span key={dept.id} className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                                                                {dept.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div>
                                                        {!isMemberOwner ? (
                                                            <div className="relative">
                                                                <select
                                                                    value={member.roleId || ''}
                                                                    onChange={(e) => assignRoleToMember(member.teamId, member.userId, e.target.value || null)}
                                                                    className="w-full text-xs px-2 py-1.5 pr-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 appearance-none bg-none"
                                                                >
                                                                    <option value="">No Role</option>
                                                                    {teamRolesList.map(r => (
                                                                        <option key={r.id} value={r.id}>{r.name}</option>
                                                                    ))}
                                                                </select>
                                                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-slate-400">—</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        {!isMemberOwner && (
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => setManagingMemberDeptsId(member.userId)}
                                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"
                                                                    title="Manage Departments"
                                                                >
                                                                    <Settings size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        if (confirm(`Remove ${user?.name} from all departments?`)) {
                                                                            employeeDepts.forEach(dept => removeTeamMember(dept.id, member.userId));
                                                                        }
                                                                    }}
                                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                                    title="Remove from Company"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    )
                    }

                    {/* Department Section - Moved to Top Level */}
                    {activeSection === 'departments' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold">Departments</h2>
                                    <p className="text-sm text-slate-500 mt-1">Organize your company into departments (Workspaces)</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        const name = prompt('Enter department name:');
                                        if (name && name.trim()) {
                                            await createTeam(name.trim());
                                            fetchTeams();
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                                >
                                    <Plus size={16} />
                                    Add Department
                                </button>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {ownedTeams.filter(t => t.name !== 'DoneOne').map(team => {
                                        const teamProjectCount = getTeamProjects(team.id).length;
                                        const teamMemberCount = activeMembers.filter(m => m.teamId === team.id).length;
                                        return (
                                            <div key={team.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Building2 size={18} className="text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{team.name}</p>
                                                        <p className="text-xs text-slate-500">{teamProjectCount} projects • {teamMemberCount} members</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setManagingDeptId(team.id)}
                                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                                                        title="Manage Department Heads"
                                                    >
                                                        <Users size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setItemToRename({ id: team.id, name: team.name, type: 'department' });
                                                            setRenameValue(team.name);
                                                            setIsRenameModalOpen(true);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"
                                                        title="Rename department"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    {ownedTeams.length > 1 && (
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm(`Delete "${team.name}" department?\n\nThis will remove all projects and members associated with this department.`)) {
                                                                    await handleDeleteTeam(team.id);
                                                                }
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                            title="Delete department"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Manage Heads Modal */}
                            {managingDeptId && (() => {
                                const team = ownedTeams.find(t => t.id === managingDeptId);
                                if (!team) return null;

                                // Get Team Heads from team.managerIds
                                const currentHeadIds = team.managerIds || [];

                                const availableEmployees = companyEmployees.filter(u => !currentHeadIds.includes(u.id));
                                const filteredEmployees = availableEmployees.filter(u =>
                                    u.name?.toLowerCase().includes(headSearch.toLowerCase()) ||
                                    u.email?.toLowerCase().includes(headSearch.toLowerCase())
                                );

                                return (
                                    <Modal isOpen={true} onClose={() => { setManagingDeptId(null); setHeadSearch(''); }} title="Manage Team Heads">
                                        <div className="space-y-4">
                                            <p className="text-sm text-slate-500">
                                                Assign users who can manage all projects within <strong>{team.name}</strong>.
                                            </p>

                                            {/* Current Heads */}
                                            <div className="space-y-2">
                                                <label className="block text-xs font-medium text-slate-700">Current Heads</label>
                                                {currentHeadIds.length === 0 ? (
                                                    <p className="text-sm text-slate-400 italic">No heads assigned yet.</p>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {currentHeadIds.map(managerId => {
                                                            const user = users.find(u => u.id === managerId);
                                                            return (
                                                                <span key={managerId} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                                                    {user?.name || 'Unknown'}
                                                                    <button onClick={() => removeTeamHead(team.id, managerId)} className="hover:text-red-500">
                                                                        <X size={12} />
                                                                    </button>
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Searchable Multi-Select */}
                                            <div className="pt-4 border-t border-slate-100">
                                                <label className="block text-xs font-medium text-slate-700 mb-2">Add Team Heads</label>
                                                <div className="relative">
                                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search employees..."
                                                        value={headSearch}
                                                        onChange={(e) => setHeadSearch(e.target.value)}
                                                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                    />
                                                </div>
                                                <div className="mt-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                                                    {filteredEmployees.length === 0 ? (
                                                        <p className="p-3 text-sm text-slate-400 text-center">No employees found</p>
                                                    ) : (
                                                        filteredEmployees.map(user => (
                                                            <div key={user.id} onClick={() => assignTeamHead(team.id, user.id)} className="flex items-center gap-3 p-2 hover:bg-slate-50 cursor-pointer">
                                                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                                                    {user.name?.charAt(0) || '?'}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium truncate">{user.name}</p>
                                                                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                                                </div>
                                                                <Plus size={16} className="text-primary" />
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Modal>
                                );
                            })()}
                        </div>
                    )}


                    {/* Roles Section */}
                    {
                        activeSection === 'roles' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold">Custom Roles</h2>
                                    <p className="text-sm text-slate-500 mt-1">Create roles to organize your team members</p>
                                </div>

                                <form onSubmit={handleCreateRole} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                    <h3 className="font-semibold mb-3">Create New Role</h3>
                                    <div className="flex gap-3">
                                        <input type="color" value={newRoleColor} onChange={(e) => setNewRoleColor(e.target.value)} className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-200" />
                                        <input
                                            type="text" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)}
                                            placeholder="Role name (e.g. Senior Developer, Designer)"
                                            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                        />
                                        <button type="submit" disabled={!newRoleName.trim()} className="px-6 py-2 bg-primary text-white rounded-lg font-medium disabled:opacity-50">
                                            Create
                                        </button>
                                    </div>
                                </form>

                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                    {allRoles.length === 0 ? (
                                        <div className="p-8 text-center text-slate-500">
                                            <Tag size={32} className="mx-auto mb-2 opacity-50" />
                                            <p>No custom roles created yet</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {allRoles.map(role => (
                                                <div key={role.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                                    {editingRoleId === role.id ? (
                                                        <div className="flex-1 flex items-center gap-3">
                                                            <input type="color" value={editRoleColor} onChange={(e) => setEditRoleColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                                                            <input type="text" value={editRoleName} onChange={(e) => setEditRoleName(e.target.value)}
                                                                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700" autoFocus />
                                                            <button onClick={handleUpdateRole} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Save</button>
                                                            <button onClick={() => setEditingRoleId(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: role.color }} />
                                                                <span className="font-medium">{role.name}</span>
                                                                <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                                                                    {activeMembers.filter(m => m.roleId === role.id).length} members
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => startEditRole(role)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"><Edit2 size={16} /></button>
                                                                <button onClick={() => deleteTeamRole(role.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }


                    {/* Projects Section */}
                    {
                        activeSection === 'projects' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold">Project Assignments</h2>
                                        <p className="text-sm text-slate-500 mt-1">Manage employee assignments per project</p>
                                    </div>
                                </div>

                                {allProjects.length === 0 ? (
                                    <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700">
                                        <FolderKanban size={48} className="mx-auto mb-4 text-slate-300" />
                                        <p className="text-slate-500 mb-4">No projects yet</p>
                                        <button onClick={() => navigate('/')} className="px-4 py-2 bg-primary text-white rounded-lg">Create Project</button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Filters */}
                                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Department Filter */}
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Department</label>
                                                    <select
                                                        value={selectedDepartmentFilter}
                                                        onChange={(e) => {
                                                            setSelectedDepartmentFilter(e.target.value);
                                                            setSelectedProjectFilter('all');
                                                            setShowAddMemberModal(false);
                                                        }}
                                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium appearance-none"
                                                    >
                                                        <option value="all">All Departments</option>
                                                        {ownedTeams.map(t => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {/* Project Filter */}
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Project</label>
                                                    <select
                                                        value={selectedProjectFilter}
                                                        onChange={(e) => { setSelectedProjectFilter(e.target.value); setShowAddMemberModal(false); }}
                                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium appearance-none"
                                                    >
                                                        <option value="all">-- Select a Project --</option>
                                                        {allProjects
                                                            .filter(p => selectedDepartmentFilter === 'all' || p.teamId === selectedDepartmentFilter)
                                                            .map(p => (
                                                                <option key={p.id} value={p.id}>{p.name}</option>
                                                            ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Show Assignment Panel when project is selected */}
                                        {selectedProjectFilter !== 'all' && (() => {
                                            const selectedProject = allProjects.find(p => p.id === selectedProjectFilter);
                                            if (!selectedProject) return null;

                                            const assignableEmployees = uniqueActiveMembers.filter(m => !ownedTeams.some(t => t.ownerId === m.userId));
                                            const assignedUserIds = [...(selectedProject.leadIds || []), ...(selectedProject.resourceIds || [])];
                                            const assignedEmployees = assignableEmployees.filter(m => assignedUserIds.includes(m.userId));
                                            const unassignedEmployees = assignableEmployees.filter(m => !assignedUserIds.includes(m.userId));
                                            const filteredUnassigned = unassignedEmployees.filter(m => {
                                                const user = users.find(u => u.id === m.userId) || m.user;
                                                const matchesSearch = !employeeSearchQuery ||
                                                    user?.name?.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                                                    user?.email?.toLowerCase().includes(employeeSearchQuery.toLowerCase());

                                                if (!matchesSearch) return false;

                                                // Department Filter
                                                if (selectedDepartmentFilter && selectedDepartmentFilter !== 'all') {
                                                    const isMember = activeMembers.some(am => am.userId === m.userId && am.teamId === selectedDepartmentFilter);
                                                    if (!isMember) return false;
                                                }
                                                return true;
                                            });

                                            return (
                                                <>
                                                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                                        {/* Project Header with Add Button */}
                                                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-4 h-4 rounded-full bg-primary" />
                                                                <h3 className="font-semibold text-lg">{selectedProject.name}</h3>
                                                                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                                                    {assignedEmployees.length} assigned
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => { setShowAddMemberModal(true); setEmployeeSearchQuery(''); }}
                                                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                                                            >
                                                                <Plus size={16} />
                                                                Add Member
                                                            </button>
                                                        </div>

                                                        {/* Assigned Members List */}
                                                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                                            {assignedEmployees.length === 0 ? (
                                                                <div className="p-8 text-center text-slate-500">
                                                                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                                                                    <p>No members assigned yet</p>
                                                                    <p className="text-xs mt-1">Click "Add Member" to assign employees</p>
                                                                </div>
                                                            ) : (
                                                                assignedEmployees.map(member => {
                                                                    const user = users.find(u => u.id === member.userId) || member.user;
                                                                    const isLead = selectedProject.leadIds?.includes(member.userId);
                                                                    const isResource = selectedProject.resourceIds?.includes(member.userId);

                                                                    return (
                                                                        <div key={member.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                                                                                    {user?.name?.charAt(0) || '?'}
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-medium">{user?.name}</p>
                                                                                    <p className="text-xs text-slate-500">{user?.email}</p>
                                                                                </div>
                                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isLead ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                                                                    }`}>
                                                                                    {isLead ? 'Lead' : 'Resource'}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    onClick={() => handleAssignToProject(selectedProject.id, member.userId, 'Lead')}
                                                                                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${isLead ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 hover:bg-blue-100'
                                                                                        }`}
                                                                                >Lead</button>
                                                                                <button
                                                                                    onClick={() => handleAssignToProject(selectedProject.id, member.userId, 'Resource')}
                                                                                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${isResource ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 hover:bg-green-100'
                                                                                        }`}
                                                                                >Resource</button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        // Remove from both lists
                                                                                        if (isLead) handleAssignToProject(selectedProject.id, member.userId, 'Lead');
                                                                                        if (isResource) handleAssignToProject(selectedProject.id, member.userId, 'Resource');
                                                                                    }}
                                                                                    className="px-2 py-1.5 text-xs rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                                                                >
                                                                                    <Trash2 size={14} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })
                                                            )}
                                                        </div>

                                                        {/* Summary Footer */}
                                                        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                                                            <div className="flex items-center justify-between">
                                                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                                                    <span className="font-medium text-blue-600">{(selectedProject.leadIds || []).length}</span> Leads,
                                                                    <span className="font-medium text-green-600 ml-1">{(selectedProject.resourceIds || []).length}</span> Resources
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Add Member Modal */}
                                                    {showAddMemberModal && (
                                                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddMemberModal(false)}>
                                                            <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                                                                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                                                    <h3 className="font-semibold text-lg">Add Member to {selectedProject.name}</h3>
                                                                    <button onClick={() => setShowAddMemberModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                                                                        ✕
                                                                    </button>
                                                                </div>

                                                                {/* Search */}
                                                                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                                                    <div className="relative">
                                                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Search employees..."
                                                                            value={employeeSearchQuery}
                                                                            onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                                                                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                                                            autoFocus
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Unassigned Employee List */}
                                                                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                                                                    {filteredUnassigned.length === 0 ? (
                                                                        <div className="p-6 text-center text-slate-500">
                                                                            <Users size={32} className="mx-auto mb-2 opacity-50" />
                                                                            <p>{unassignedEmployees.length === 0 ? 'All employees are assigned' : 'No matching employees'}</p>
                                                                        </div>
                                                                    ) : (
                                                                        filteredUnassigned.map(member => {
                                                                            const user = users.find(u => u.id === member.userId) || member.user;
                                                                            return (
                                                                                <div key={member.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                                                                                            {user?.name?.charAt(0) || '?'}
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="font-medium">{user?.name}</p>
                                                                                            <p className="text-xs text-slate-500">{user?.email}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex gap-2">
                                                                                        <button
                                                                                            onClick={() => handleAssignToProject(selectedProject.id, member.userId, 'Lead')}
                                                                                            className="px-4 py-2 text-sm rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                                                                        >Add as Lead</button>
                                                                                        <button
                                                                                            onClick={() => handleAssignToProject(selectedProject.id, member.userId, 'Resource')}
                                                                                            className="px-4 py-2 text-sm rounded-lg font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
                                                                                        >Add as Resource</button>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })
                                                                    )}
                                                                </div>

                                                                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                                                                    <button
                                                                        onClick={() => setShowAddMemberModal(false)}
                                                                        className="w-full py-2 text-sm text-slate-600 hover:text-slate-800"
                                                                    >
                                                                        Done
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}

                                        {/* Hint when no project selected */}
                                        {selectedProjectFilter === 'all' && (
                                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                                                <FolderKanban size={48} className="mx-auto mb-4 text-slate-300" />
                                                <p className="text-slate-500">Select a project above to manage assignments</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {/* Settings Section */}
                    {
                        activeSection === 'settings' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold">Company Settings</h2>

                                {/* Company Name Settings */}
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                                    <h3 className="font-semibold mb-2">Company Name</h3>
                                    <p className="text-sm text-slate-500 mb-4">This name is displayed in your sidebar header</p>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                        <span className="font-medium text-lg">
                                            {currentCompany?.name || 'Company'}
                                        </span>
                                        <button
                                            onClick={() => {
                                                const currentName = currentCompany?.name || 'Company';
                                                setItemToRename({ id: 'company', name: currentName, type: 'company' });
                                                setRenameValue(currentName);
                                                setIsRenameModalOpen(true);
                                            }}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"
                                            title="Rename Company"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Company Join Code - ONE code for all */}
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                                    <h3 className="font-semibold mb-2">Company Join Code</h3>
                                    <p className="text-sm text-slate-500 mb-4">Share this code with employees to join your company</p>

                                    {currentCompany && (
                                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                            <div className="flex-1">
                                                <span className="font-mono text-2xl font-bold text-primary tracking-widest">
                                                    {currentCompany.joinCode || 'No Code'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleCopyCode(primaryTeam.joinCode)}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                                            >
                                                {codeCopied ? <Check size={16} /> : <Copy size={16} />}
                                                {codeCopied ? 'Copied!' : 'Copy Code'}
                                            </button>
                                        </div>
                                    )}
                                </div>



                                {/* Employee Usage */}
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                                    <h3 className="font-semibold mb-2">Employee Seats</h3>
                                    <p className="text-sm text-slate-500 mb-4">
                                        {uniqueEmployeeCount} of {totalMemberLimit} employee seats used
                                    </p>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                                        <div
                                            className="bg-primary h-3 rounded-full transition-all"
                                            style={{ width: `${Math.min(100, (uniqueEmployeeCount / totalMemberLimit) * 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">
                                        Each employee counts as 1 seat, regardless of how many projects they're assigned to
                                    </p>
                                </div>

                                {/* Danger Zone */}
                                {primaryTeam && (
                                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
                                        <h3 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 mb-4">
                                            <AlertTriangle size={18} />
                                            Danger Zone
                                        </h3>
                                        <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                                            <div>
                                                <span className="text-sm font-medium">Delete Company</span>
                                                <p className="text-xs text-slate-500">This will remove all employees and projects</p>
                                            </div>
                                            {showDeleteConfirm === primaryTeam.id ? (
                                                <div className="flex gap-2">
                                                    <button onClick={() => setShowDeleteConfirm(null)} className="px-3 py-1 bg-slate-100 rounded text-sm">Cancel</button>
                                                    <button onClick={() => handleDeleteTeam(primaryTeam.id)} className="px-3 py-1 bg-red-500 text-white rounded text-sm">Delete</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setShowDeleteConfirm(primaryTeam.id)} className="px-3 py-1 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50">
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {/* Rename Modal */}
                    <Modal
                        isOpen={isRenameModalOpen}
                        onClose={() => setIsRenameModalOpen(false)}
                        title={itemToRename?.type === 'company' ? 'Rename Company' : 'Rename Department'}
                    >
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    placeholder="Enter new name"
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setIsRenameModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!itemToRename || !renameValue.trim()) return;

                                        if (itemToRename.type === 'company') {
                                            await updateCompany({ name: renameValue.trim() });
                                            setIsRenameModalOpen(false);
                                        } else {
                                            await updateTeam(itemToRename.id, { name: renameValue.trim() });
                                            await fetchTeams();
                                        }
                                        setIsRenameModalOpen(false);
                                    }}
                                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </Modal>

                    {/* Manage Member Departments Modal */}
                    {/* Manage Member Departments Modal */}
                    {managingMemberDeptsId && (
                        <ManageMemberDepartmentsModal
                            userId={managingMemberDeptsId}
                            onClose={() => setManagingMemberDeptsId(null)}
                        />
                    )}

                </div >
            </div >
        </div >
    );
};
