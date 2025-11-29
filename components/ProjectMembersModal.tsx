
import React, { useState } from 'react';
import { useStore } from '../store';
import { Modal } from './Modal';
import { Trash2, Copy, Check, UserCheck, XCircle, Shield, ShieldAlert, ChevronDown, Lock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectMembersModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { projects, activeProjectId, removeMember, resolveJoinRequest, changeMemberRole, assignMemberLead, currentUser, users } = useStore();
  const project = projects.find(p => p.id === activeProjectId);
  const [copied, setCopied] = useState(false);

  if (!project || !currentUser) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(project.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getUser = (id: string) => users.find(u => u.id === id) || { id, name: 'Unknown', role: 'Resource' } as any;

  const leads = project.leadIds.map(getUser);
  const resources = project.resourceIds.map(getUser);
  const pendingUsers = (project.pendingJoinRequests || []).map(getUser);
  const manager = getUser(project.managerId);
  const canManage = currentUser.id === project.managerId;

  // Limits Display
  const maxLeads = manager?.maxLeads || 2;
  const maxRes = manager?.maxResources || 5;
  const isPremium = manager?.isPremium;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Members: ${project.name}`}>
      <div className="space-y-6">

        {/* Project Code - Locked if not premium? Or always open? Prompt says invite person depends on admin allow */}
        <div className={`p-4 rounded-lg flex items-center justify-between border border-dashed ${!isPremium && canManage ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-300 dark:bg-gray-700/50 dark:border-gray-600'}`}>
          {!isPremium && canManage ? (
            <div className="flex items-center gap-3 text-gray-500 w-full">
              <Lock size={20} />
              <p className="text-sm">Invites are disabled. Contact Admin to upgrade to Premium.</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Invite via Project Code</p>
                <p className="text-2xl font-mono font-bold tracking-widest text-primary">{project.code}</p>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-2 text-gray-500 hover:text-primary transition-colors relative"
                title="Copy Code"
              >
                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
              </button>
            </>
          )}
        </div>

        {/* Pending Requests */}
        {canManage && pendingUsers.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
            <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-2">Pending Join Requests</h4>
            <div className="space-y-2">
              {pendingUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-yellow-200 text-yellow-800 flex items-center justify-center text-xs font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-sm">{user.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => resolveJoinRequest(project.id, user.id, true)}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                      title="Accept"
                    >
                      <UserCheck size={16} />
                    </button>
                    <button
                      onClick={() => resolveJoinRequest(project.id, user.id, false)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                      title="Reject"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team List */}
        <div>
          <div className="flex justify-between items-end mb-3">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Project Team</h4>
            <div className="text-[10px] text-gray-400 flex flex-col items-end">
              <span>Leads: {leads.length} / {maxLeads}</span>
              <span>Resources: {resources.length} / {maxRes}</span>
            </div>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {/* Manager */}
            {manager && (
              <div className="flex items-center justify-between p-2 rounded bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                    {manager.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{manager.name}</p>
                    <p className="text-xs text-primary font-semibold flex items-center gap-1"><Shield size={10} /> Owner</p>
                  </div>
                </div>
              </div>
            )}

            {/* Leads */}
            {leads.map(member => (
              <div key={member.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 flex items-center justify-center text-xs font-bold">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-orange-500 font-semibold flex items-center gap-1"><ShieldAlert size={10} /> Lead</p>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => changeMemberRole(project.id, member.id, 'Resource')}
                      className="text-gray-400 hover:text-orange-500 text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700"
                    >
                      Demote
                    </button>
                    <button
                      onClick={() => removeMember(project.id, member.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Resources */}
            {resources.map(member => (
              <div key={member.id} className="flex flex-col p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center text-xs font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-gray-500">Resource</p>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => changeMemberRole(project.id, member.id, 'Lead')}
                        className="text-gray-400 hover:text-green-500 text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700"
                      >
                        Promote
                      </button>
                      <button
                        onClick={() => removeMember(project.id, member.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {canManage && (
                  <div className="mt-2 pl-10 flex items-center gap-2">
                    <span className="text-xs text-gray-400">Reports to:</span>
                    <select
                      className="bg-transparent text-xs border border-gray-200 dark:border-gray-600 rounded px-1 py-0.5 outline-none cursor-pointer hover:bg-white dark:hover:bg-gray-800"
                      value={project.reportsTo[member.id] || ''}
                      onChange={(e) => assignMemberLead(project.id, member.id, e.target.value || null)}
                    >
                      <option value="">-- No Lead --</option>
                      {leads.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
