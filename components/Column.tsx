
import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column as ColumnType, Task as TaskType } from '../types';
import { TaskCard } from './TaskCard';
import { Plus, Trash2, ArrowLeft, ArrowRight, Timer, ChevronsUp, ChevronsDown } from 'lucide-react';
import { useStore } from '../store';

interface Props {
  column: ColumnType;
  tasks: TaskType[];
  index: number;
  totalColumns: number;
}

export const Column: React.FC<Props> = ({ column, tasks, index, totalColumns }) => {
  const { addTask, deleteColumn, can, moveColumn, currentUser } = useStore();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Identify if any task in this column has a running timer for the current user
  const activeTimerTask = tasks.find(t => t.timerStartedAt && t.assigneeId === currentUser?.id);

  // Use Droppable instead of Sortable for the Column
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
    data: { type: 'Column', column }
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      addTask(column.projectId, column.id, newTaskTitle);
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col shrink-0 w-80 h-full max-h-full bg-panel-light dark:bg-panel-dark rounded-xl border transition-colors shadow-sm ${isOver ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-transparent dark:border-slate-700/50'}`}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between group cursor-default border-b border-transparent">
        <div className="flex items-center gap-2.5">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider">
            {column.title}
          </h3>
          <span className="px-2 py-0.5 bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] rounded-full font-bold shadow-sm border border-slate-100 dark:border-slate-600">
            {tasks.length}
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
            <button
              onClick={() => { if (confirm('Delete column?')) deleteColumn(column.id) }}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded transition-all"
              title="Delete Column"
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
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>

      {/* Footer / Add Task */}
      <div className="p-3">
        {can('manageTasks') ? (
          isAddingTask ? (
            <form onSubmit={handleAddTask} className="bg-white dark:bg-slate-800 p-2.5 rounded-lg shadow-lg border border-primary ring-1 ring-primary/20 animate-in fade-in zoom-in-95 duration-200">
              <input
                autoFocus
                className="w-full text-sm bg-transparent outline-none placeholder-slate-400 text-slate-700 dark:text-white"
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="text-xs px-2.5 py-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs px-2.5 py-1.5 bg-primary text-white rounded-md hover:bg-primary-hover font-medium shadow-sm"
                >
                  Add Task
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingTask(true)}
              className="flex items-center gap-2 w-full py-2 px-3 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700/50 rounded-lg transition-all text-sm font-medium border border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-sm"
            >
              <Plus size={16} />
              <span className="text-xs">Add Task</span>
            </button>
          )
        ) : null}
      </div>
    </div>
  );
};
