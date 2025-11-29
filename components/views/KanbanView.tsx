import React, { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useStore } from '../../store';
import { Column } from '../Column';
import { TaskCard } from '../TaskCard';
import { Task, Column as ColumnType } from '../../types';
import { Plus } from 'lucide-react';
import { Modal } from '../Modal';

interface KanbanViewProps {
    tasks: Task[];
    columns: ColumnType[];
}

export const KanbanView: React.FC<KanbanViewProps> = ({ tasks, columns }) => {
    const {
        activeProjectId,
        moveTask,
        can,
        addColumn,
    } = useStore();

    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [isColModalOpen, setIsColModalOpen] = useState(false);
    const [newColTitle, setNewColTitle] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const activeId = active.id as string;
        const task = tasks.find(t => t.id === activeId);
        if (task) setActiveTask(task);
    };

    const handleDragOver = (event: DragOverEvent) => {
        // Over logic handled in DragEnd
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;
        if (activeId === overId) return;

        const isOverColumn = columns.some(c => c.id === overId);
        const isOverTask = tasks.some(t => t.id === overId);

        let newColumnId = '';
        let newIndex = 0;

        if (isOverColumn) {
            newColumnId = overId;
            newIndex = tasks.filter(t => t.columnId === overId).length;
        } else if (isOverTask) {
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                newColumnId = overTask.columnId;
                newIndex = overTask.orderIndex;
            }
        }

        if (newColumnId) {
            moveTask(activeId, newColumnId, newIndex);
        }
    };

    const handleAddColumn = (e: React.FormEvent) => {
        e.preventDefault();
        if (newColTitle.trim() && activeProjectId) {
            addColumn(activeProjectId, newColTitle);
            setNewColTitle('');
            setIsColModalOpen(false);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex-1 flex overflow-x-auto px-6 py-4 gap-4 items-start pb-6">
                {columns.map((col, index) => (
                    <Column
                        key={col.id}
                        column={col}
                        tasks={tasks
                            .filter(t => t.columnId === col.id)
                            .sort((a, b) => a.orderIndex - b.orderIndex)
                        }
                        index={index}
                        totalColumns={columns.length}
                    />
                ))}

                {can('manageColumns') && (
                    <button
                        onClick={() => setIsColModalOpen(true)}
                        className="shrink-0 w-80 h-[50px] border border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all gap-2 group"
                    >
                        <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                            <Plus size={14} />
                        </div>
                        <span className="text-sm font-medium">Add Column</span>
                    </button>
                )}

                <DragOverlay dropAnimation={{
                    duration: 250,
                    easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                }}>
                    {activeTask ? (
                        <TaskCard task={activeTask} />
                    ) : null}
                </DragOverlay>

                <Modal isOpen={isColModalOpen} onClose={() => setIsColModalOpen(false)} title="Add New Column">
                    <form onSubmit={handleAddColumn} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Column Title</label>
                            <input
                                autoFocus
                                value={newColTitle}
                                onChange={e => setNewColTitle(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                placeholder="e.g., Quality Check"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsColModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="bg-primary text-white px-5 py-2 rounded-lg font-medium shadow-sm hover:bg-primary-hover hover:shadow transition-all text-sm">
                                Add Column
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </DndContext>
    );
};
