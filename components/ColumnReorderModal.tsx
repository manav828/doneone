import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Modal } from './Modal';
import { useStore } from '../store';
import { Column } from '../types';
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
    id: string;
    column: Column;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, column }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as 'relative',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-sm mb-2 ${isDragging ? 'opacity-50 ring-2 ring-primary' : ''}`}
        >
            <div {...attributes} {...listeners} className="cursor-grab hover:text-primary text-slate-400">
                <GripVertical size={20} />
            </div>
            <div className="flex-1">
                <span className="font-medium text-slate-700 dark:text-slate-200">{column.title}</span>
                {(column.title === 'Pending' || column.title === 'In Progress' || column.title === 'Done') && (
                    <span className="ml-2 text-xs text-slate-400 italic">(Fixed System Column)</span>
                )}
            </div>
        </div>
    );
};

interface ColumnReorderModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
}

export const ColumnReorderModal: React.FC<ColumnReorderModalProps> = ({ isOpen, onClose, projectId }) => {
    const { columns, reorderColumns } = useStore();
    const [localColumns, setLocalColumns] = useState<Column[]>([]);

    useEffect(() => {
        if (isOpen) {
            const projectCols = columns
                .filter(c => c.projectId === projectId)
                .sort((a, b) => a.orderIndex - b.orderIndex);
            setLocalColumns(projectCols);
        }
    }, [isOpen, columns, projectId]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setLocalColumns((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSave = async () => {
        const newOrderIds = localColumns.map(c => c.id);
        await reorderColumns(projectId, newOrderIds);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Arrange Columns">
            <div className="mt-4">
                <p className="text-sm text-slate-500 mb-4">Drag and drop to reorder columns.</p>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <div className="max-h-[60vh] overflow-y-auto px-1">
                        <SortableContext
                            items={localColumns.map(c => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {localColumns.map((col) => (
                                <SortableItem key={col.id} id={col.id} column={col} />
                            ))}
                        </SortableContext>
                    </div>
                </DndContext>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-primary text-white px-5 py-2 rounded-lg font-medium shadow-sm hover:bg-primary-hover hover:shadow transition-all text-sm"
                    >
                        Save Order
                    </button>
                </div>
            </div>
        </Modal>
    );
};
