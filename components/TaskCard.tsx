import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../types';
import { useStore } from '../store';
import { Tag as TagIcon, User, Trash, Clock, Plus, BellRing, Play, Pause, Timer, AlertCircle, Image, X, Upload, Archive, CheckSquare, MessageCircle, Repeat } from 'lucide-react';
import { Modal } from './Modal';
import { ConfirmModal } from './ConfirmModal';
import { TaskEditModal } from './TaskEditModal';

interface Props {
  task: Task;
}

export const TaskCard: React.FC<Props> = ({ task }) => {
  const {
    tags, toggleTaskTimer, updateTask,
    currentUser, users, projects, activeProjectId,
    collapsedTaskIds, toggleTaskCollapse,
    columns, archiveTaskManually, canAccessPremium
  } = useStore();

  const activeProject = projects.find(p => p.id === activeProjectId);
  const isManager = activeProject?.managerId === currentUser?.id;
  const isLead = activeProject?.leadIds.includes(currentUser?.id || '');
  const isAssignee = task.assigneeId === currentUser?.id;
  const canMove = isManager || isLead || isAssignee;

  // Feature Flag Check
  // Feature Flag Check
  // FIX: Use activeProject.manager directly as it contains the enriched plan overrides from fetchProjects
  const projectManager = activeProject?.manager || users.find(u => u.id === activeProject?.managerId);
  // CHANGED: Use Project Manager's Premium Status - Check BOTH property names
  // activeProject.manager has 'hasPremiumAccess', users array has 'isPremium'
  const hasPremium = (projectManager as any)?.hasPremiumAccess === true || projectManager?.isPremium === true;
  const remindersEnabled = hasPremium && (projectManager?.remindersEnabled || false);
  // SIMPLIFIED: If Owner is Premium, Time Tracking is Enabled.
  const timeTrackingEnabled = hasPremium;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
    disabled: !canMove,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  // Timer Local State
  const [elapsedTime, setElapsedTime] = useState(task.timeTracked || 0);

  useEffect(() => {
    let interval: any;
    if (task.timerStartedAt) {
      interval = setInterval(() => {
        const seconds = Math.floor((Date.now() - (task.timerStartedAt || 0)) / 1000);
        setElapsedTime((task.timeTracked || 0) + seconds);
      }, 1000);
    } else {
      setElapsedTime(task.timeTracked || 0);
    }
    return () => clearInterval(interval);
  }, [task.timerStartedAt, task.timeTracked]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    // Compact format without spaces to prevent wrapping
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const taskTags = tags.filter(t => task.tagIds.includes(t.id));
  const assignedUser = users.find(u => u.id === task.assigneeId);
  const isCreatedByMe = task.creatorId === currentUser?.id;

  const now = new Date().getTime();
  const isOverdue = task.reminderAt && task.reminderAt < now;
  const isDueSoon = task.reminderAt && task.reminderAt > now && (task.reminderAt - now < 30 * 60 * 1000);
  const isCollapsed = collapsedTaskIds.includes(task.id);

  const taskColumn = columns.find(c => c.id === task.columnId);
  const isDoneColumn = taskColumn?.title === 'Done';

  // Discussion Task Check
  const isActiveDiscussion = task.isDiscussion && !task.discussionEnded;
  const isDiscussionParticipant = task.discussionUserIds?.includes(currentUser?.id || '');

  // Animation classes - Discussion takes priority
  const animationClass = isActiveDiscussion ? 'task-discussion' :
    task.isHighlighted ? 'task-highlighted' :
      (isOverdue && !isDoneColumn && !task.isReminderDismissed) ? 'task-overdue' :
        (isDueSoon && !isDoneColumn && !task.isReminderDismissed) ? 'task-reminder-soon' : '';

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-2xl border-2 border-primary rotate-2 cursor-grabbing z-50 h-[120px] scale-105"
      />
    );
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsModalOpen(true);
  };

  const handleToggleTimer = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleTaskTimer(task.id);
  };

  const containerClasses = `
    card-lift group relative flex flex-col gap-2 p-3.5 rounded-xl border shadow-sm transition-all duration-200 select-none
    ${isDragging ? 'opacity-50 scale-105 z-50 cursor-grabbing' : 'opacity-100 cursor-grab'}
    bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700
    ${animationClass}
    ${canMove ? 'cursor-grab active:cursor-grabbing' : 'cursor-default opacity-90'}
    ${isOverdue && !isDoneColumn
      ? 'border-red-400 dark:border-red-600 bg-red-50/30 dark:bg-red-900/10'
      : isActiveDiscussion
        ? 'border-purple-400 dark:border-purple-500 bg-purple-50/30 dark:bg-purple-900/10 ring-2 ring-purple-300 dark:ring-purple-600'
        : isCreatedByMe
          ? 'border-blue-300 dark:border-blue-700 bg-blue-50/10 dark:bg-blue-900/5'
          : 'border-slate-200 dark:border-slate-700'
    }
  `;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleCardClick}
        className={containerClasses}
      >
        {/* Toggle Collapse Button */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleTaskCollapse(task.id); }}
          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity z-20"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
          )}
        </button>

        {/* Tags (Hidden if collapsed) */}
        {!isCollapsed && (
          <div className="flex flex-wrap gap-1.5 mb-2.5 pr-6">
            {/* Discussion Badge */}
            {isActiveDiscussion && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide bg-purple-500 text-white shadow-sm animate-pulse">
                <MessageCircle size={10} fill="currentColor" />
                Discussion
              </span>
            )}
            {taskTags.map(tag => (
              <span
                key={tag.id}
                className="tag-premium text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide text-white shadow-sm cursor-default"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Header */}
        <div className={`flex items-start justify-between gap-2 ${isCollapsed ? 'mb-0' : 'mb-1.5'}`}>
          <h4 className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug break-words pr-6 capitalize">
            {task.title}
          </h4>
          {task.reminderAt && remindersEnabled && !isCollapsed && (
            <span className={`shrink-0 ${isOverdue ? 'text-red-500 animate-pulse' : isDueSoon ? 'text-yellow-500' : 'text-slate-300'}`}>
              <BellRing size={12} fill={isOverdue ? 'currentColor' : 'none'} />
            </span>
          )}
        </div>

        {/* Details (Hidden if collapsed) */}
        {!isCollapsed && (
          <>
            {/* Desc */}
            {task.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Attachments Preview */}
            {task.attachments && task.attachments.length > 0 && (
              <div className="flex gap-1 mb-3 overflow-hidden">
                {task.attachments.slice(0, 3).map((url, i) => (
                  <div key={i} className="w-8 h-8 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer hover:opacity-80" onClick={(e) => { e.stopPropagation(); setPreviewImage(url); }}>
                    <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                  </div>
                ))}
                {task.attachments.length > 3 && (
                  <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    +{task.attachments.length - 3}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-700/50 mt-1">
              <div className="flex items-center gap-2">
                {assignedUser ? (
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 pr-2 pl-0.5 py-0.5 rounded-full border border-slate-100 dark:border-slate-700">
                    {assignedUser.avatar ? (
                      <img src={assignedUser.avatar} alt={assignedUser.name} className="w-4 h-4 rounded-full object-cover shadow-sm border border-white dark:border-slate-700" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-blue-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                        {assignedUser.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">{assignedUser.name.split(' ')[0]}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 opacity-40">
                    <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <User size={10} className="text-slate-500" />
                    </div>
                  </div>
                )}


                {timeTrackingEnabled && canMove && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskTimer(task.id);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border transition-all z-10 
                      ${task.timerStartedAt
                        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 animate-pulse'
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                      }`}
                    title={task.timerStartedAt ? "Pause Timer" : "Start Timer"}
                  >
                    {task.timerStartedAt ? (
                      <Pause size={10} fill="currentColor" />
                    ) : (
                      <Play size={10} fill="currentColor" />
                    )}
                    <span className="font-mono whitespace-nowrap">
                      {formatTime(elapsedTime)}
                    </span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Archive Button (Only in Done column) */}
                {isDoneColumn && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmModal({
                        isOpen: true,
                        title: 'Archive Task',
                        message: 'Are you sure you want to archive this task? It will be moved to History.',
                        confirmText: 'Archive',
                        onConfirm: () => archiveTaskManually(task.id)
                      });
                    }}
                    className="p-1 rounded-full text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    title="Archive Task"
                  >
                    <Archive size={14} />
                  </button>
                )}

                {(task.reminderAt || task.updatedAt || task.recurrence) && (
                  <div className="flex items-center gap-1.5">
                    {task.recurrence && (
                      <div title="Recurring Task" className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 p-0.5 rounded">
                        <Repeat size={10} />
                      </div>
                    )}
                    {/* Stop Animation Button */}
                    {task.reminderAt && !isDoneColumn && (isOverdue || isDueSoon) && !task.isReminderDismissed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateTask(task.id, { isReminderDismissed: true });
                        }}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-all flex items-center gap-1 font-semibold shadow-sm hover:scale-105 active:scale-95 ${isOverdue
                          ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/50'
                          : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                          }`}
                        title="Stop Alert Animation"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                        Stop
                      </button>
                    )}

                    <span className={`text-[10px] font-medium flex items-center gap-1 ${((isOverdue || isDueSoon) && !isDoneColumn && !task.isReminderDismissed) ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                      {task.reminderAt && remindersEnabled && !((isOverdue || isDueSoon) && !isDoneColumn && !task.isReminderDismissed) && <Clock size={10} />}
                      {task.reminderAt && remindersEnabled
                        ? new Date(task.reminderAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : new Date(task.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <TaskEditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} task={task} />

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        isDestructive={confirmModal.isDestructive}
        confirmText={confirmModal.confirmText || 'Confirm'}
      />
    </>
  );
};
