import React, { useState } from 'react';
import { useStore } from '../../store';
import { Task, Column } from '../../types';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { DndContext, useDraggable, useDroppable, DragEndEvent, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { TaskEditModal } from '../TaskEditModal';
import { v4 as uuidv4 } from 'uuid';
import { CalendarViewMobile } from './CalendarViewMobile';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface CalendarViewProps {
    tasks: Task[];
    columns: Column[];
}

const DraggableTask: React.FC<{ task: Task; columns: Column[]; onClick: () => void }> = ({ task, columns, onClick }) => {
    const { users } = useStore();
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: task.id,
        data: { task }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50
    } : undefined;

    const column = columns.find(c => c.id === task.columnId);
    const timeString = task.reminderAt ? new Date(task.reminderAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={(e) => {
                if (!transform) onClick();
            }}
            className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 rounded shadow-sm cursor-pointer hover:border-primary transition-colors mb-1 group"
        >
            <div className="flex items-center gap-1 mb-0.5">
                {timeString && <span className="text-[10px] text-primary font-bold bg-primary/10 px-1 rounded">{timeString}</span>}
                <div className="font-medium truncate text-slate-800 dark:text-slate-200 flex-1">{task.title}</div>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-between">
                <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: column.color }} />
                    {column.title}
                </div>
                {users.find(u => u.id === task.assigneeId) && (
                    <div className="w-4 h-4 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600">
                        {users.find(u => u.id === task.assigneeId)?.avatar ? (
                            <img src={users.find(u => u.id === task.assigneeId)?.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                {users.find(u => u.id === task.assigneeId)?.name.charAt(0)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const DroppableDay: React.FC<{ day: number; date: Date; children: React.ReactNode; onAdd: () => void; isToday: boolean }> = ({ day, date, children, onAdd, isToday }) => {
    const droppableId = `day-${date.getFullYear()}-${date.getMonth()}-${day}`;
    const { setNodeRef, isOver } = useDroppable({
        id: droppableId,
        data: { day, date }
    });

    return (
        <div
            ref={setNodeRef}
            onClick={(e) => {
                if (e.target === e.currentTarget) onAdd();
            }}
            className={`h-32 border border-slate-100 dark:border-slate-700 p-2 overflow-y-auto transition-colors ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'bg-white dark:bg-slate-900'} ${isOver ? 'bg-primary/5 ring-2 ring-inset ring-primary/20' : ''}`}
        >
            <div className={`text-sm font-medium mb-1 flex justify-between ${isToday ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                {day}
                <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className="opacity-0 group-hover:opacity-100 hover:bg-slate-100 rounded p-0.5">
                    <Plus size={12} />
                </button>
            </div>
            <div className="space-y-1">
                {children}
            </div>
        </div>
    );
};

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, columns }) => {
    const isMobile = useIsMobile();

    // Simply render the appropriate component - no early returns
    if (isMobile) {
        return <CalendarViewMobile tasks={tasks} />;
    }

    // Desktop render
    return <DesktopCalendarView tasks={tasks} columns={columns} />;
};

// Separate component for desktop to avoid hooks issues
const DesktopCalendarView: React.FC<CalendarViewProps> = ({ tasks, columns }) => {
    const { updateTask, addTask, activeProjectId, tags, currentUser } = useStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const taskId = active.id as string;
        const dayData = over.data.current as { day: number, date: Date };

        if (dayData) {
            const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayData.day);
            newDate.setHours(12, 0, 0, 0);
            await updateTask(taskId, { reminderAt: newDate.getTime() });
        }
    };

    const handleAddTask = async (day: number) => {
        if (!activeProjectId || !currentUser) return;

        const tempDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        tempDate.setHours(9, 0, 0, 0);

        const tempTask: Task = {
            id: 'temp-' + uuidv4(),
            projectId: activeProjectId,
            columnId: columns[0]?.id || '',
            title: '',
            creatorId: currentUser.id,
            orderIndex: 0,
            tagIds: [],
            estimatedTime: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            attachments: [],
            reminderAt: tempDate.getTime()
        };

        setIsCreating(true);
        setEditingTask(tempTask);
    };

    const handleSaveNewTask = async (taskData: Partial<Task>) => {
        if (!activeProjectId || !columns[0]) return;

        if (!taskData.title) {
            alert("Title is required");
            return;
        }

        const newTask = await addTask(activeProjectId, columns[0].id, taskData.title);
        if (newTask) {
            await updateTask(newTask.id, {
                description: taskData.description,
                assigneeId: taskData.assigneeId,
                tagIds: taskData.tagIds,
                reminderAt: taskData.reminderAt,
                estimatedTime: taskData.estimatedTime,
                attachments: taskData.attachments
            });
        }
        setEditingTask(null);
        setIsCreating(false);
    };

    const getTasksForDate = (day: number) => {
        return tasks.filter(task => {
            if (!task.reminderAt) return false;

            const taskDate = new Date(task.reminderAt);
            return (
                taskDate.getDate() === day &&
                taskDate.getMonth() === currentDate.getMonth() &&
                taskDate.getFullYear() === currentDate.getFullYear()
            );
        });
    };

    const renderCalendarDays = () => {
        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayTasks = getTasksForDate(day);
            const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

            days.push(
                <DroppableDay
                    key={day}
                    day={day}
                    date={currentDate}
                    onAdd={() => handleAddTask(day)}
                    isToday={isToday}
                >
                    {dayTasks.map(task => (
                        <DraggableTask
                            key={task.id}
                            task={task}
                            columns={columns}
                            onClick={() => setEditingTask(task)}
                        />
                    ))}
                </DroppableDay>
            );
        }
        return days;
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="text-sm font-medium text-primary hover:underline px-2">
                            Today
                        </button>
                        <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Weekdays */}
                <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-7 auto-rows-fr">
                        {renderCalendarDays()}
                    </div>
                </div>

                {editingTask && (
                    <TaskEditModal
                        isOpen={!!editingTask}
                        onClose={() => {
                            setEditingTask(null);
                            setIsCreating(false);
                        }}
                        task={editingTask}
                        isCreating={isCreating}
                        onSaveNew={isCreating ? handleSaveNewTask : undefined}
                    />
                )}
            </div>
        </DndContext>
    );
};
