import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../types';
import { useStore } from '../store';
import { Tag as TagIcon, User, Trash, Clock, Plus, BellRing, Play, Pause, Timer, AlertCircle, Image, X, Upload, Archive } from 'lucide-react';
import { Modal } from './Modal';

import { TaskEditModal } from './TaskEditModal';

interface Props {
  task: Task;
}

export const TaskCard: React.FC<Props> = ({ task }) => {
  const {
    tags, toggleTaskTimer,
    currentUser, users, projects, activeProjectId,
    collapsedTaskIds, toggleTaskCollapse,
    columns, archiveTaskManually
  } = useStore();

  const activeProject = projects.find(p => p.id === activeProjectId);
  const isManager = activeProject?.managerId === currentUser?.id;
  const isLead = activeProject?.leadIds.includes(currentUser?.id || '');
  const isAssignee = task.assigneeId === currentUser?.id;
  const canMove = isManager || isLead || isAssignee;

  // Feature Flag Check
  const projectManager = users.find(u => u.id === activeProject?.managerId);
  const remindersEnabled = projectManager?.remindersEnabled || false;
  const timeTrackingEnabled = projectManager?.timeTrackingEnabled || false;

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
    return `${h}h ${m}m ${s}s`;
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

  // Animation classes
  const animationClass = task.isHighlighted ? 'task-highlighted' :
    isOverdue ? 'task-overdue' :
      isDueSoon ? 'task-reminder-soon' : '';

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

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleCardClick}
        className={`group cursor-pointer bg-white dark:bg-slate-700 p-3.5 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md hover:border-primary dark:hover:border-primary transition-all duration-200 relative ${animationClass}
          ${canMove ? 'cursor-grab active:cursor-grabbing hover:shadow-card-hover hover:-translate-y-0.5' : 'cursor-default opacity-90'}
          ${isOverdue
            ? 'border-red-400 dark:border-red-600 bg-red-50/30 dark:bg-red-900/10'
            : isCreatedByMe
              ? 'border-blue-300 dark:border-blue-700 bg-blue-50/10 dark:bg-blue-900/5 hover:border-blue-400'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-card'
          }
        `}
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
            {taskTags.map(tag => (
              <span
                key={tag.id}
                className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide text-white shadow-sm"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Header */}
        <div className={`flex items-start justify-between gap-2 ${isCollapsed ? 'mb-0' : 'mb-1.5'}`}>
          <h4 className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug break-words pr-6">
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
                  <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-500">
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
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-blue-500 text-white flex items-center justify-center text-[8px] font-bold shadow-sm">
                      {assignedUser.name.charAt(0)}
                    </div>
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">{assignedUser.name.split(' ')[0]}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 opacity-40">
                    <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <User size={10} className="text-slate-500" />
                    </div>
                  </div>
                )}

                {/* Timer Control */}
                {timeTrackingEnabled && canMove && (
                  <button
                    onClick={handleToggleTimer}
                    className={`p-1 rounded-full flex items-center gap-1 text-[10px] font-mono border transition-all z-10 ${task.timerStartedAt
                      ? 'bg-green-50 text-green-600 border-green-200 animate-pulse'
                      : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100 hover:text-slate-600'
                      }`}
                    title={task.timerStartedAt ? "Stop Timer" : "Start Timer"}
                  >
                    {task.timerStartedAt ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
                    {elapsedTime > 0 && <span>{formatTime(elapsedTime)}</span>}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Archive Button (Only in Done column) */}
                {isDoneColumn && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Archive this task?')) {
                        archiveTaskManually(task.id);
                      }
                    }}
                    className="p-1 rounded-full text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    title="Archive Task"
                  >
                    <Archive size={14} />
                  </button>
                )}

                {(task.reminderAt || task.updatedAt) && (
                  <span className={`text-[10px] font-medium flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                    {task.reminderAt && remindersEnabled && <Clock size={10} />}
                    {task.reminderAt && remindersEnabled
                      ? new Date(task.reminderAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : new Date(task.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <TaskEditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} task={task} />

      {/* Image Preview Modal */}
      {
        previewImage && (
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
        )
      }
    </>
  );
};
