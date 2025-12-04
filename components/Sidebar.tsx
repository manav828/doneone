
import React, { useState } from 'react';
import { useStore } from '../store';
import { FolderKanban, Plus, Trash2, Hash, Settings, Edit2, ChevronLeft, ChevronRight, Shield, HelpCircle, Grip, LayoutTemplate, Archive } from 'lucide-react';
import { Modal } from './Modal';
import { useNavigate } from 'react-router-dom';
import { TemplateSelector } from './TemplateSelector';
import { BoardTemplate } from '../templates/templates';

export const Sidebar: React.FC = () => {
  const {
    activeProjectId,
    setActiveProject,
    addProject,
    addProjectFromTemplate,
    can,
    deleteProject,
    joinProject,
    getVisibleProjects,
    projects,
    updateProject,
    currentUser
  } = useStore();

  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6');
  const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate | null>(null);

  const [editProjectId, setEditProjectId] = useState('');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState('');

  const [joinCode, setJoinCode] = useState('');
  const [joinMessage, setJoinMessage] = useState({ type: '', text: '' });

  const visibleProjects = getVisibleProjects();
  const isSuperAdmin = currentUser?.email === 'manavss828@gmail.com';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      if (selectedTemplate) {
        addProjectFromTemplate(newProjectName, newProjectDesc, newProjectColor, selectedTemplate);
      } else {
        addProject(newProjectName, newProjectDesc, newProjectColor);
      }
      setIsModalOpen(false);
      setNewProjectName('');
      setNewProjectDesc('');
      setSelectedTemplate(null);
    }
  };

  const handleTemplateSelect = (template: BoardTemplate) => {
    setSelectedTemplate(template);
    if (!newProjectDesc) {
      setNewProjectDesc(template.description);
    }
    setIsTemplateSelectorOpen(false);
    setIsModalOpen(true); // Re-open the create modal
  };

  const openCreateModal = () => {
    setSelectedTemplate(null);
    setNewProjectName('');
    setNewProjectDesc('');
    setIsModalOpen(true);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      const result = await joinProject(joinCode.trim().toUpperCase());
      if (result === 'joined') {
        setJoinMessage({ type: 'success', text: 'Successfully joined!' });
        setTimeout(() => { setIsJoinModalOpen(false); setJoinCode(''); setJoinMessage({ type: '', text: '' }); }, 1500);
      } else if (result === 'requested') {
        setJoinMessage({ type: 'success', text: 'Request sent to project manager.' });
        setTimeout(() => { setIsJoinModalOpen(false); setJoinCode(''); setJoinMessage({ type: '', text: '' }); }, 2000);
      } else if (result === 'already_member') {
        setJoinMessage({ type: 'error', text: 'You are already a member or pending.' });
      } else {
        setJoinMessage({ type: 'error', text: 'Project not found.' });
      }
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProject(id);
    }
  };

  const openEditModal = (e: React.MouseEvent, project: any) => {
    e.stopPropagation();
    setEditProjectId(project.id);
    setEditName(project.name);
    setEditDesc(project.description || '');
    setEditColor(project.themeColor);
    setIsEditModalOpen(true);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editProjectId && editName.trim()) {
      updateProject(editProjectId, {
        name: editName,
        description: editDesc,
        themeColor: editColor
      });
      setIsEditModalOpen(false);
    }
  };

  return (
    <aside className={`${isCollapsed ? 'w-18' : 'w-72'} h-full bg-surface-light dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 z-20`}>
      {/* Header */}
      <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-4'} border-b border-transparent`}>
        <div className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
          <div className="p-2 bg-gradient-to-br from-primary to-blue-600 rounded-xl text-white shadow-sm shrink-0">
            <FolderKanban size={20} />
          </div>
          {!isCollapsed && <h1 className="font-bold text-lg tracking-tight">FlowBoard</h1>}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        {/* Projects Section */}
        <div className="px-3">
          {!isCollapsed && (
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Projects</span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">{visibleProjects.length}</span>
            </div>
          )}

          <div className="space-y-0.5">
            {visibleProjects.map(project => (
              <div
                key={project.id}
                onClick={() => { setActiveProject(project.id); navigate('/'); }}
                className={`group flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${activeProjectId === project.id
                  ? 'bg-primary/5 text-primary font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                title={isCollapsed ? project.name : undefined}
              >
                <div className="flex items-center gap-3 truncate">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${activeProjectId !== project.id ? 'opacity-70' : ''}`}
                    style={{ backgroundColor: project.themeColor }}
                  ></span>
                  {!isCollapsed && <span className="truncate text-sm">{project.name}</span>}
                </div>

                {!isCollapsed && (
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    {can('editSettings') && (
                      <button
                        onClick={(e) => openEditModal(e, project)}
                        className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-400 hover:text-primary transition-colors shadow-sm"
                        title="Edit Project"
                      >
                        <Edit2 size={12} />
                      </button>
                    )}
                    {can('deleteProject') && (
                      <button
                        onClick={(e) => handleDelete(e, project.id)}
                        className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-400 hover:text-red-500 transition-colors shadow-sm"
                        title="Delete Project"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {visibleProjects.length === 0 && !isCollapsed && (
              <div className="px-3 py-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-lg mx-2">
                <p className="text-xs text-slate-400">No projects yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Global Tools Section */}
        <div className="px-3">
          {!isCollapsed && <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Workspace</div>}
          <div className="space-y-0.5">
            {isSuperAdmin && (
              <button
                onClick={() => { setActiveProject(''); navigate('/admin'); }}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}
              >
                <Shield size={18} className="text-red-500 opacity-80" />
                {!isCollapsed && <span className="text-sm font-medium">Admin Panel</span>}
              </button>
            )}
            <button
              onClick={() => { navigate('/history'); }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}
              title={isCollapsed ? "History" : undefined}
            >
              <Archive size={18} />
              {!isCollapsed && <span className="text-sm font-medium">History</span>}
            </button>
            <button
              onClick={() => { setActiveProject(''); navigate('/guide'); }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}
            >
              <HelpCircle size={18} />
              {!isCollapsed && <span className="text-sm font-medium">Help Guide</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
        <button
          onClick={() => setIsJoinModalOpen(true)}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-2'} py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 transition-all shadow-sm`}
          title={isCollapsed ? "Join Project" : undefined}
        >
          <Hash size={16} />
          {!isCollapsed && <span>Join with Code</span>}
        </button>

        <button
          onClick={openCreateModal}
          disabled={!can('createProject')}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-2'} py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-sm font-medium text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
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
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Theme Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                value={newProjectColor}
                onChange={e => setNewProjectColor(e.target.value)}
              />
              <span className="text-sm text-slate-500">{newProjectColor}</span>
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
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Theme Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                value={editColor}
                onChange={e => setEditColor(e.target.value)}
              />
              <span className="text-sm text-slate-500">{editColor}</span>
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

      <Modal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} title="Join Existing Project">
        <form onSubmit={handleJoin} className="space-y-6">
          <div className="text-center">
            <label className="block text-sm font-medium text-slate-500 mb-3">Enter the 6-character Project Code</label>
            <input
              autoFocus
              type="text"
              maxLength={6}
              className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono text-center uppercase tracking-[0.5em] text-2xl focus:border-primary focus:ring-0 outline-none transition-all"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              placeholder="••••••"
              required
            />
            {joinMessage.text && (
              <p className={`text-sm mt-3 font-medium ${joinMessage.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                {joinMessage.text}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsJoinModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow font-medium text-sm transition-all"
            >
              Request to Join
            </button>
          </div>
        </form>
      </Modal>

      {/* Template Selector Modal */}
      {isTemplateSelectorOpen && (
        <TemplateSelector
          onSelectTemplate={handleTemplateSelect}
          onClose={() => { setIsTemplateSelectorOpen(false); setIsModalOpen(true); }}
          userIsPremium={currentUser?.isPremium || false}
        />
      )}
    </aside>
  );
};
