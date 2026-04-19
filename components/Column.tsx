import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column as ColumnType, Task as TaskType } from '../types';
import { TaskCard } from './TaskCard';
import { Plus, Trash2, ArrowLeft, ArrowRight, Timer, ChevronsUp, ChevronsDown, Archive } from 'lucide-react';
import { useStore } from '../store';
import { sortTasksByPriority } from '../utils/taskPriority'; // kept for potential future use
import { ConfirmModal } from './ConfirmModal';
import { TaskEditModal } from './TaskEditModal';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  column: ColumnType;
  tasks: TaskType[];
  index: number;
  totalColumns: number;
}

export const Column: React.FC<Props> = ({ column, tasks, index, totalColumns }) => {
  const { addTask, deleteColumn, updateColumn, can, moveColumn, currentUser, tags } = useStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  // Priority order map for sorting
  const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

  // Sorting: Overdue tasks float to the top, then sort by priority
  const displayTasks = React.useMemo(() => {
    const now = Date.now();
    const overdue: TaskType[] = [];
    const others: TaskType[] = [];

    tasks.forEach(t => {
      if (t.reminderAt && t.reminderAt < now && column.title !== 'Done') {
        overdue.push(t);
      } else {
        others.push(t);
      }
    });

    // Sort overdue by reminderAt ascending
    overdue.sort((a, b) => (a.reminderAt || 0) - (b.reminderAt || 0));

    // Sort others by priority: high → medium → low → none
    others.sort((a, b) => {
      const aPriority = a.priority ? (PRIORITY_ORDER[a.priority] ?? 3) : 3;
      const bPriority = b.priority ? (PRIORITY_ORDER[b.priority] ?? 3) : 3;
      return aPriority - bPriority;
    });

    return [...overdue, ...others];
  }, [tasks, column.title]);

  // Identify if any task in this column has a running timer for the current user
  const activeTimerTask = tasks.find(t => t.timerStartedAt && t.assigneeId === currentUser?.id);

  // Use Droppable instead of Sortable for the Column
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
    data: { type: 'Column', column }
  });



  const handleCreateTask = async (taskData: Partial<TaskType>) => {
    if (!taskData.title) return;
    // Pass all fields directly to addTask so priority (and other fields) are saved
    // in the initial DB insert — no separate updateTask needed, preserving collapse state.
    const { title, ...extraFields } = taskData;
    await addTask(column.projectId, column.id, title, extraFields as Partial<TaskType>);
  };

  const dummyTask = React.useMemo<TaskType>(() => ({
    id: uuidv4(),
    projectId: column.projectId,
    columnId: column.id,
    title: '',
    creatorId: currentUser?.id || '',
    assigneeId: currentUser?.id,
    orderIndex: tasks.length,
    tagIds: [],
    estimatedTime: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    attachments: [],
    subtasks: [],
    timeTracked: 0
  }), [column.projectId, column.id, currentUser?.id, tasks.length]);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col shrink-0 w-80 h-full max-h-full bg-panel-light dark:bg-panel-dark rounded-xl border transition-colors shadow-sm ${isOver ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-transparent dark:border-slate-700/50'}`}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between group cursor-default border-b border-transparent">
        <div className="flex items-center gap-2.5">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1">
            {column.title}
            {(column.title === 'Pending' || column.title === 'In Progress' || column.title === 'Done') && (
              <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            )}
            {column.isArchiveEnabled && (
              <div title="Auto-archiving enabled (Managed in Archive Settings)" className="cursor-help flex items-center">
                <Archive size={12} className="text-purple-500 ml-1" />
              </div>
            )}
          </h3>
          <span className="px-2 py-0.5 bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] rounded-full font-bold shadow-sm border border-slate-100 dark:border-slate-600">
            {displayTasks.length}
          </span>
        </div>

        {can('manageColumns') && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => moveColumn(column.id, 'left')}
              disabled={index === 0}
              className="p-1 text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
              title="Move Left"
            >
              <ArrowLeft size={14} />
            </button>
            <button
              onClick={() => moveColumn(column.id, 'right')}
              disabled={index === totalColumns - 1}
              className="p-1 text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
              title="Move Right"
            >
              <ArrowRight size={14} />
            </button>
            <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 mx-1"></div>
            {/* Toggle Collapse/Expand All */}
            <button
              onClick={() => {
                const allCollapsed = tasks.length > 0 && tasks.every(t => useStore.getState().collapsedTaskIds.includes(t.id));
                if (allCollapsed) {
                  useStore.getState().expandColumnTasks(column.id);
                } else {
                  useStore.getState().collapseColumnTasks(column.id);
                }
              }}
              className="p-1 text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded transition-all"
              title={tasks.length > 0 && tasks.every(t => useStore.getState().collapsedTaskIds.includes(t.id)) ? "Expand All" : "Collapse All"}
            >
              {tasks.length > 0 && tasks.every(t => useStore.getState().collapsedTaskIds.includes(t.id)) ? (
                <ChevronsDown size={14} />
              ) : (
                <ChevronsUp size={14} />
              )}
            </button>
            <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 mx-1"></div>
            {/* Auto Archive Toggle */}

            <button
              onClick={() => {
                const isFixed = column.title === 'Pending' || column.title === 'In Progress' || column.title === 'Done';
                if (isFixed) {
                  setConfirmModal({
                    isOpen: true,
                    title: 'Cannot Delete Column',
                    message: 'This is a fixed column and cannot be deleted.',
                    confirmText: 'OK',
                    onConfirm: () => { },
                    isDestructive: false
                  });
                  return;
                }
                setConfirmModal({
                  isOpen: true,
                  title: 'Delete Column',
                  message: 'Are you sure you want to delete this column? All tasks within it will be deleted.',
                  confirmText: 'Delete',
                  isDestructive: true,
                  onConfirm: () => deleteColumn(column.id)
                });
              }}
              disabled={column.title === 'Pending' || column.title === 'In Progress' || column.title === 'Done'}
              className={`p-1 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded transition-all ${(column.title === 'Pending' || column.title === 'In Progress' || column.title === 'Done')
                ? 'opacity-30 cursor-not-allowed'
                : ''
                }`}
              title={column.title === 'Pending' || column.title === 'In Progress' || column.title === 'Done' ? 'Fixed column cannot be deleted' : 'Delete Column'}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Active Timer Banner */}
      {activeTimerTask && (
        <div className="mx-2 mb-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 animate-pulse">
          <Timer size={12} className="text-green-600 dark:text-green-400" />
          <span className="text-xs font-medium text-green-700 dark:text-green-300 truncate">
            Tracking: {activeTimerTask.title}
          </span>
        </div>
      )}

      {/* Task List Area */}
      <div
        className="flex-1 overflow-y-auto px-2 space-y-2.5 min-h-[100px] pt-2"
      >
        <SortableContext items={displayTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {displayTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>

      {/* Footer / Add Task */}
      <div className="p-3">
        {can('manageTasks') ? (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 w-full py-2 px-3 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700/50 rounded-lg transition-all text-sm font-medium border border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-sm"
          >
            <Plus size={16} />
            <span className="text-xs">Add Task</span>
          </button>
        ) : null}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        isDestructive={confirmModal.isDestructive}
        confirmText={confirmModal.confirmText || 'Confirm'}
      />

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <TaskEditModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          task={dummyTask}
          isCreating={true}
          onSaveNew={handleCreateTask}
        />
      )}
    </div>
  );
};
