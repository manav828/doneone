import React from 'react';
import { X, Clock, Calendar, User as UserIcon, CheckCircle, ArrowRight, Tag } from 'lucide-react';
import { TaskHistory, User } from '../types';

interface Props {
  history: TaskHistory;
  users: User[];
  onClose: () => void;
  formatTime: (s: number) => string;
}

export const HistoryDetailDrawer: React.FC<Props> = ({ history, users, onClose, formatTime }) => {
  const task = history.taskData;
  const assignee = users.find(u => u.id === task.assigneeId);
  const creator = users.find(u => u.id === task.creatorId);

  const formatDate = (ts: number | string) =>
    new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const priorityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  const statusDot: Record<string, string> = {
    'Done': 'bg-emerald-500',
    'In Progress': 'bg-blue-500',
  };

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[340px] bg-white dark:bg-slate-800 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-700 animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Task Details</span>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Title */}
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-snug capitalize">{task.title}</h3>
            {task.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{task.description}</p>}
          </div>

          {/* Status + Priority row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              <span className={`w-2 h-2 rounded-full ${statusDot[history.statusAtArchive] || 'bg-slate-400'}`} />
              {history.statusAtArchive}
            </span>
            {task.priority && (
              <span className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize ${priorityColors[task.priority] || ''}`}>
                {task.priority}
              </span>
            )}
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Timeline</span>
            <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-3">
              {task.createdAt ? (
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-white dark:border-slate-800" />
                  <p className="text-xs text-slate-500">Created</p>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{formatDate(task.createdAt)}</p>
                </div>
              ) : null}
              {task.startedAt ? (
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-400 border-2 border-white dark:border-slate-800" />
                  <p className="text-xs text-slate-500">Started</p>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{formatDate(task.startedAt)}</p>
                </div>
              ) : null}
              {task.completedAt ? (
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-800" />
                  <p className="text-xs text-slate-500">Completed</p>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{formatDate(task.completedAt)}</p>
                </div>
              ) : null}
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-orange-400 border-2 border-white dark:border-slate-800" />
                <p className="text-xs text-slate-500">Archived</p>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{formatDate(history.archivedAt)}</p>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={12} className="text-slate-400" />
                <span className="text-xs text-slate-500">Time Tracked</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {history.timeTaken > 0 ? formatTime(history.timeTaken) : '—'}
              </p>
            </div>
            {task.estimatedTime ? (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock size={12} className="text-slate-400" />
                  <span className="text-xs text-slate-500">Estimated</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatTime(task.estimatedTime)}</p>
              </div>
            ) : null}
          </div>

          {/* Subtasks */}
          {totalSubtasks > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Subtasks</span>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{completedSubtasks}/{totalSubtasks}</span>
                </div>
                {task.subtasks!.map(sub => (
                  <div key={sub.id} className="flex items-center gap-2 text-xs">
                    <CheckCircle size={12} className={sub.completed ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'} />
                    <span className={sub.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}>{sub.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* People */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">People</span>
            {assignee && (
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold">{assignee.name.charAt(0)}</div>
                <div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{assignee.name}</p>
                  <p className="text-[10px] text-slate-400">Assignee</p>
                </div>
              </div>
            )}
            {creator && creator.id !== assignee?.id && (
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-[10px] font-bold">{creator.name.charAt(0)}</div>
                <div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{creator.name}</p>
                  <p className="text-[10px] text-slate-400">Creator</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
