
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import {
  FolderKanban, Plus, Trash2, Hash, Settings, Edit2, ChevronLeft, ChevronRight,
  Shield, HelpCircle, Grip, LayoutTemplate, Archive, BarChart2, Camera,
  Building2, Users, ChevronDown, UserPlus, FolderOpen
} from 'lucide-react';
import { Modal } from './Modal';
import { useNavigate, useLocation } from 'react-router-dom';
import { TemplateSelector } from './TemplateSelector';
import { BoardTemplate } from '../templates/templates';
import { TeamSettingsModal } from './TeamSettingsModal';
import { JoinTeamModal } from './JoinTeamModal';
import { CreateTeamModal } from './CreateTeamModal';
import { Team } from '../types';

// --- Extracted Components ---

const SidebarProjectCard = ({
  project,
  activeProjectId,
  isCollapsed,
  can,
  onEdit,
  onDelete,
  onSelect
}: any) => (
  <div
    onClick={() => onSelect(project.id)}
    className={`sidebar-item group flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} 
      relative px-3 py-1.5 cursor-pointer transition-all duration-200 
      ${activeProjectId === project.id
        ? 'bg-[#FF6B35]/10 text-slate-900 dark:text-white font-medium'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    title={isCollapsed ? project.name : undefined}
  >
    {/* Absolute Indicator Bar - Overlaps tree line */}
    <div className={`absolute -left-[9px] top-0 bottom-0 w-[3px] rounded-r-sm transition-colors ${activeProjectId === project.id
      ? 'bg-[#FF6B35]'
      : 'bg-transparent group-hover:bg-slate-300 dark:group-hover:bg-slate-600'
      }`}
    />

    <div className="flex items-center gap-3 truncate">
      {project.logo ? (
        <img src={project.logo} alt={project.name} className="w-5 h-5 rounded object-cover bg-white shrink-0" />
      ) : (
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${activeProjectId === project.id ? 'bg-[#FF6B35]' : 'bg-slate-200 dark:bg-slate-700'}`}
        />
      )}
      {!isCollapsed && <span className="truncate text-sm">{project.name}</span>}
    </div>

    {!isCollapsed && (
      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-0.5">
        {can('editSettings', project.id) && (
          <button
            onClick={(e) => onEdit(e, project)}
            className={`p-1 rounded transition-colors ${activeProjectId === project.id ? 'text-[#FF6B35] hover:bg-[#FF6B35]/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
            title="Edit Project"
          >
            <Edit2 size={12} />
          </button>
        )}
        {can('deleteProject', project.id) && (
          <button
            onClick={(e) => onDelete(e, project.id)}
            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete Project"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    )}
  </div>
);

const SidebarTeamSection = ({
  team,
  isOwned,
  isCollapsed,
  activeProjectId,
  can,
  onEditProject,
  onDeleteProject,
  onSelectProject
}: any) => {
  const { departments, fetchDepartments, getTeamProjects } = useStore();
  const teamProjects = getTeamProjects(team.id);
  const teamDeps = departments.filter(d => d.teamId === team.id);
  const [isExpanded, setIsExpanded] = useState(true);

  // This useEffect is now safe because SidebarTeamSection is a stable component
  useEffect(() => {
    fetchDepartments(team.id);
  }, [team.id]); // Only runs when team.id changes

  return (
    <div className="mb-2">
      <div
        className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 min-w-0 w-full">
          <ChevronDown size={12} className={`text-slate-400 transition-transform ${!isExpanded ? '-rotate-90' : ''}`} />
          {!isCollapsed && (
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
              {team.name}
            </span>
          )}
        </div>
      </div>

      {isExpanded && !isCollapsed && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 dark:border-slate-700 pl-2">



          {teamProjects.map((project: any) => (
            <SidebarProjectCard
              key={project.id}
              project={project}
              activeProjectId={activeProjectId}
              isCollapsed={isCollapsed}
              can={can}
              onEdit={onEditProject}
              onDelete={onDeleteProject}
              onSelect={onSelectProject}
            />
          ))}

          {teamProjects.length === 0 && !isOwned && (
            <p className="text-xs text-slate-400 py-2 px-2">No projects yet</p>
          )}
        </div>
      )}
    </div>
  );
};

// --- Main Sidebar Component ---

export const Sidebar: React.FC = () => {
  const {
    activeProjectId,
    setActiveProject,
    addProject,
    addProjectFromTemplate,
    can,
    deleteProject,
    getVisibleProjects,
    projects,
    updateProject,
    currentUser,
    canAccessPremium,
    uploadFile,
    // Team-related
    teams,
    teamMembers,
    fetchTeams,
    fetchTeamMembers,
    getOwnedTeams,
    getJoinedTeams,
    getTeamProjects,
    getPersonalProjects,
    activeTeamId,
    setActiveTeam,
    currentCompany
  } = useStore();

  const navigate = useNavigate();
  const location = useLocation();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // Team modals
  const [isJoinTeamModalOpen, setIsJoinTeamModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [isTeamSettingsOpen, setIsTeamSettingsOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [creatingForTeamId, setCreatingForTeamId] = useState<string | null>(null);

  // Form states
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectLogoUrl, setNewProjectLogoUrl] = useState('');
  const [isUploadingNewLogo, setIsUploadingNewLogo] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate | null>(null);

  const [editProjectId, setEditProjectId] = useState('');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editViewAllReports, setEditViewAllReports] = useState(false);
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Section collapse states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    ownedTeams: true,
    joinedTeams: true,
    personal: true
  });

  const isSuperAdmin = currentUser?.email?.toLowerCase() === 'manavss828@gmail.com';

  // Fetch teams on mount
  useEffect(() => {
    if (currentUser) {
      fetchTeams().then((teams) => {
        // Fetch members for owned teams to ensure employee count is accurate
        const myTeams = teams.filter(t => t.ownerId === currentUser.id);
        myTeams.forEach(t => fetchTeamMembers(t.id));
      });
    }
  }, [currentUser]);

  const ownedTeams = getOwnedTeams();
  const joinedTeams = getJoinedTeams();

  const personalProjects = getPersonalProjects();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      if (selectedTemplate) {
        addProjectFromTemplate(newProjectName, newProjectDesc, selectedTemplate, newProjectLogoUrl);
      } else {
        addProject(newProjectName, newProjectDesc, creatingForTeamId, newProjectLogoUrl);
      }
      setIsModalOpen(false);
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectLogoUrl('');
      setSelectedTemplate(null);
      setCreatingForTeamId(null);
    }
  };

  const handleTemplateSelect = (template: BoardTemplate) => {
    setSelectedTemplate(template);
    if (!newProjectDesc) {
      setNewProjectDesc(template.description);
    }
    setIsTemplateSelectorOpen(false);
    setIsModalOpen(true);
  };

  const openCreateModal = (teamId: string | null = null) => {
    setSelectedTemplate(null);
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectLogoUrl('');

    // Auto-select team for Admins/Heads if not provided
    if (teamId) {
      setCreatingForTeamId(teamId);
    } else {
      const manageableTeams = ownedTeams.concat(
        joinedTeams.filter(t => t.managerIds?.includes(currentUser?.id))
      );
      // Default to first manageable team, or null (Personal)
      setCreatingForTeamId(manageableTeams.length > 0 ? manageableTeams[0].id : null);
    }

    setIsModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setProjectToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete);
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
    }
  };

  const openEditModal = (e: React.MouseEvent, project: any) => {
    e.stopPropagation();
    setEditProjectId(project.id);
    setEditName(project.name);
    setEditDesc(project.description || '');
    setEditViewAllReports(project.viewAllReportsEnabled || false);
    setEditLogoUrl(project.logo || '');
    setIsEditModalOpen(true);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editProjectId && editName.trim()) {
      updateProject(editProjectId, {
        name: editName,
        description: editDesc,
        viewAllReportsEnabled: editViewAllReports,
        logo: editLogoUrl
      });
      setIsEditModalOpen(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploadingLogo(true);
      try {
        const url = await uploadFile(e.target.files[0]);
        if (url) {
          setEditLogoUrl(url);
        }
      } catch (error) {
        console.error('Failed to upload logo', error);
      } finally {
        setIsUploadingLogo(false);
      }
    }
  };

  const handleNewLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploadingNewLogo(true);
      try {
        const url = await uploadFile(e.target.files[0]);
        if (url) {
          setNewProjectLogoUrl(url);
        }
      } catch (error) {
        console.error('Failed to upload logo', error);
      } finally {
        setIsUploadingNewLogo(false);
      }
    }
  };

  const openTeamSettings = (team: Team) => {
    setSelectedTeam(team);
    setIsTeamSettingsOpen(true);
  };

  const handleProjectSelect = (id: string) => {
    setActiveProject(id);
    navigate('/');
  };

  return (
    <aside className={`${isCollapsed ? 'w-18' : 'w-72'} h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 z-20`}>
      {/* Header */}
      <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-4'} border-b border-transparent`}>
        <div className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
          {!isCollapsed ? (
            <div className="flex flex-col pl-3">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="DoneOne" className="h-8 w-auto object-contain" />
              </div>
            </div>
          ) : (
            <img src="/logo.png" alt="DoneOne" className="h-8 w-8 object-contain" />
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {/* My Teams Section */}
        {ownedTeams.length > 0 && (
          <div className="px-3">
            <div
              className="flex items-center justify-between px-2 mb-1 cursor-pointer group"
              onClick={() => toggleSection('ownedTeams')}
            >
              {!isCollapsed && (
                <>
                  <span
                    className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1"
                  >
                    {currentCompany?.name || 'Company'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                      {new Set(teamMembers.filter(m => ownedTeams.some(t => t.id === m.teamId) && m.status === 'active').map(m => m.userId)).size} employees
                    </span>
                  </div>
                </>
              )}
            </div>

            {expandedSections.ownedTeams && (
              <div className="space-y-1">
                {ownedTeams.filter(t => t.name !== 'Unassigned').map(team => (
                  <SidebarTeamSection
                    key={team.id}
                    team={team}
                    isOwned={true}
                    activeProjectId={activeProjectId}
                    isCollapsed={isCollapsed}
                    can={can}
                    onEditProject={openEditModal}
                    onDeleteProject={handleDelete}
                    onSelectProject={handleProjectSelect}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Joined Teams Section - Always show if not empty OR if we need to show empty state */}
        {/* Joined Teams Section - Only show if has actual joined teams */}
        {joinedTeams.filter(t => t.name !== 'DoneOne' && t.name !== 'Unassigned').length > 0 && (
          <div className="px-3">
            <div
              className="flex items-center justify-between px-2 mb-1 cursor-pointer"
              onClick={() => toggleSection('joinedTeams')}
            >
              {!isCollapsed && (
                <>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                    {(() => {
                      // Extract Company Name from first joined team
                      const firstTeam = joinedTeams.find(t => t.name !== 'DoneOne' && t.name !== 'Unassigned');
                      // Use 'companies' prop from store (which now holds 'company' data) OR 'company' if direct from DB
                      const compData = firstTeam?.companies || firstTeam?.company;

                      const companyName = compData
                        ? (Array.isArray(compData) ? compData[0]?.name : compData.name)
                        : null;
                      return companyName || 'Joined Teams';
                    })()}
                  </span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                    {joinedTeams.filter(t => t.name !== 'DoneOne' && t.name !== 'Unassigned').length}
                  </span>
                </>
              )}
            </div>

            {expandedSections.joinedTeams && (
              <div className="space-y-1">
                {joinedTeams.filter(t => t.name !== 'DoneOne' && t.name !== 'Unassigned').map(team => (
                  <SidebarTeamSection
                    key={team.id}
                    team={team}
                    isOwned={false}
                    activeProjectId={activeProjectId}
                    isCollapsed={isCollapsed}
                    can={can}
                    onEditProject={openEditModal}
                    onDeleteProject={handleDelete}
                    onSelectProject={handleProjectSelect}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Personal Projects Section */}
        {personalProjects.length > 0 && (
          <div className="px-3">
            <div
              className="flex items-center justify-between px-2 mb-1 cursor-pointer"
              onClick={() => toggleSection('personal')}
            >
              {!isCollapsed && (
                <>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                    Personal Projects
                  </span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                    {personalProjects.length}
                  </span>
                </>
              )}
            </div>

            {expandedSections.personal && (
              <div className="space-y-0.5">
                {personalProjects.map(project => (
                  <SidebarProjectCard
                    key={project.id}
                    project={project}
                    activeProjectId={activeProjectId}
                    isCollapsed={isCollapsed}
                    can={can}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onSelect={handleProjectSelect}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {ownedTeams.length === 0 && joinedTeams.length === 0 && personalProjects.length === 0 && !isCollapsed && (
          <div className="px-5 py-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
              <FolderOpen size={24} className="text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">No projects yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Create a team or project to get started</p>
          </div>
        )}

        {/* Global Tools Section */}
        <div className="px-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
          {!isCollapsed && <div className="px-2 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Workspace</div>}
          <div className="space-y-0.5">
            {isSuperAdmin && (
              <button
                onClick={() => { setActiveProject(''); navigate('/admin'); }}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-lg text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors`}
              >
                <Shield size={18} className="text-slate-500 text-red-500 opacity-80" />
                {!isCollapsed && <span className="text-sm font-medium">Super Admin Panel</span>}
              </button>
            )}
            <button
              onClick={() => { setActiveProject(''); navigate('/workspace'); }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-lg transition-colors ${location.pathname === '/workspace'
                ? 'bg-[#FF6B35]/[0.06] text-slate-900 dark:text-white font-medium border-l-[3px] border-[#FF6B35]'
                : 'text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border-l-[3px] border-transparent'
                }`}
              title={isCollapsed ? "Admin Panel" : undefined}
            >
              <Settings size={18} className={location.pathname === '/workspace' ? 'text-[#FF6B35]' : 'text-slate-500'} />
              {!isCollapsed && <span className="text-sm font-medium">Admin Panel</span>}
            </button>
            <button
              onClick={() => navigate('/reports')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-lg transition-colors ${location.pathname === '/reports'
                ? 'bg-[#FF6B35]/[0.06] text-slate-900 dark:text-white font-medium border-l-[3px] border-[#FF6B35]'
                : 'text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border-l-[3px] border-transparent'
                }`}
              title={isCollapsed ? "Reports" : undefined}
            >
              <BarChart2 size={18} className={location.pathname === '/reports' ? 'text-[#FF6B35]' : 'text-slate-500'} />
              {!isCollapsed && <span className="text-sm font-medium">Reports</span>}
            </button>
            <button
              onClick={() => navigate('/history')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-lg transition-colors ${location.pathname === '/history'
                ? 'bg-[#FF6B35]/[0.06] text-slate-900 dark:text-white font-medium border-l-[3px] border-[#FF6B35]'
                : 'text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border-l-[3px] border-transparent'
                }`}
              title={isCollapsed ? "History" : undefined}
            >
              <Archive size={18} className={location.pathname === '/history' ? 'text-[#FF6B35]' : 'text-slate-500'} />
              {!isCollapsed && <span className="text-sm font-medium">History</span>}
            </button>
            <button
              onClick={() => { setActiveProject(''); navigate('/guide'); }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-lg text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border-l-[3px] border-transparent`}
            >
              <HelpCircle size={18} className="text-slate-500" />
              {!isCollapsed && <span className="text-sm font-medium">Help Guide</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
        {/* Team Actions Row */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsJoinTeamModalOpen(true)}
            className={`flex-1 flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-2'} py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary/50 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 transition-all`}
            title={isCollapsed ? "Join Company" : undefined}
          >
            <Users size={14} />
            {!isCollapsed && <span>Join Company</span>}
          </button>
          <button
            onClick={() => setIsCreateTeamModalOpen(true)}
            className={`flex-1 flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-2'} py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary/50 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 transition-all`}
            title={isCollapsed ? "Create Company" : undefined}
          >
            <Building2 size={14} />
            {!isCollapsed && <span>New Company</span>}
          </button>
        </div>

        {/* New Project Button */}
        <button
          onClick={() => openCreateModal(null)}
          disabled={!can('createProject')}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-2'} py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-sm font-medium text-white transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isCollapsed ? "New Project" : undefined}
        >
          <Plus size={16} />
          {!isCollapsed && <span>New Project</span>}
        </button>
      </div>

      {/* Modals */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Project">
        <form onSubmit={handleCreate} className="space-y-5">
          {/* Template Selection Button */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                  <LayoutTemplate size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                    {selectedTemplate ? 'Selected Template' : 'Start with a Template'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedTemplate ? selectedTemplate.name : 'Choose from 25+ pre-built workflows'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); setIsTemplateSelectorOpen(true); }}
                className="px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors"
              >
                {selectedTemplate ? 'Change' : 'Browse'}
              </button>
            </div>

            {selectedTemplate && (
              <div className="mt-3 flex flex-wrap gap-1">
                {selectedTemplate.columns.map((col, idx) => (
                  <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                    {col.title}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Workspace Selection Dropdown */}
          {(() => {
            const manageableTeams = ownedTeams.concat(
              joinedTeams.filter(t => t.managerIds?.includes(currentUser?.id))
            );

            // Only show dropdown if user can manage at least one team
            if (manageableTeams.length > 0) {
              return (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Workspace / Team</label>
                  <select
                    value={creatingForTeamId || ''}
                    onChange={(e) => setCreatingForTeamId(e.target.value || null)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  >
                    <option value="">Personal Project</option>
                    {manageableTeams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    {creatingForTeamId
                      ? "Project will be visible to all team members."
                      : "Only you can see this project (unless you share it)."}
                  </p>
                </div>
              );
            }
            return null;
          })()}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Project Name</label>
            <input
              autoFocus
              type="text"
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <textarea
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              value={newProjectDesc}
              onChange={e => setNewProjectDesc(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              {newProjectLogoUrl ? (
                <img src={newProjectLogoUrl} alt="Logo" className="w-10 h-10 rounded-md object-cover bg-white" />
              ) : (
                <div className="w-10 h-10 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                  <Camera size={20} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Project Logo</label>
                <p className="text-xs text-slate-500">Visible when sidebar is collapsed</p>
              </div>
            </div>
            <div>
              <input
                type="file"
                id="new-logo-upload"
                className="hidden"
                accept="image/*"
                onChange={handleNewLogoUpload}
              />
              <button
                type="button"
                onClick={() => document.getElementById('new-logo-upload')?.click()}
                disabled={isUploadingNewLogo}
                className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                {isUploadingNewLogo ? 'Uploading...' : 'Upload Logo'}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow font-medium text-sm transition-all"
            >
              {selectedTemplate ? 'Create from Template' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Project">
        <form onSubmit={handleEditSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Project Name</label>
            <input
              type="text"
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <textarea
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              rows={3}
            />
          </div>


          {isSuperAdmin && (
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">View All Reports</label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Allow all members to see all project reports</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={editViewAllReports}
                  onChange={e => setEditViewAllReports(e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              {editLogoUrl ? (
                <img src={editLogoUrl} alt="Logo" className="w-10 h-10 rounded-md object-cover bg-white" />
              ) : (
                <div className="w-10 h-10 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                  <Camera size={20} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Project Logo</label>
                <p className="text-xs text-slate-500">Visible when sidebar is collapsed</p>
              </div>
            </div>
            <div>
              <input
                type="file"
                id="logo-upload"
                className="hidden"
                accept="image/*"
                onChange={handleLogoUpload}
              />
              <button
                type="button"
                onClick={() => document.getElementById('logo-upload')?.click()}
                disabled={isUploadingLogo}
                className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                {isUploadingLogo ? 'Uploading...' : 'Change Logo'}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow font-medium text-sm transition-all"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Project">
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/50 flex gap-3 text-red-600 dark:text-red-400">
            <div className="shrink-0 pt-0.5">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-medium">Are you sure?</h3>
              <p className="text-sm mt-1 opacity-90">
                This action cannot be undone. This will permanently delete the project and all its tasks, columns, and history.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow font-medium text-sm transition-all"
            >
              Delete Project
            </button>
          </div>
        </div>
      </Modal>

      {
        isTemplateSelectorOpen && (
          <TemplateSelector
            onSelectTemplate={handleTemplateSelect}
            onClose={() => { setIsTemplateSelectorOpen(false); setIsModalOpen(true); }}
            userIsPremium={canAccessPremium()}
          />
        )
      }

      {/* Team Modals */}
      <JoinTeamModal isOpen={isJoinTeamModalOpen} onClose={() => setIsJoinTeamModalOpen(false)} />
      <CreateTeamModal isOpen={isCreateTeamModalOpen} onClose={() => setIsCreateTeamModalOpen(false)} />
      <TeamSettingsModal isOpen={isTeamSettingsOpen} onClose={() => setIsTeamSettingsOpen(false)} team={selectedTeam} />
    </aside >
  );
};
