import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Task, User } from '../types';
import { Modal } from './Modal';
import { Plus, Trash, Timer, Play, Pause, X, Clock, Image, Archive } from 'lucide-react';

interface TaskEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    isCreating?: boolean;
    onSaveNew?: (task: Partial<Task>) => Promise<void>;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ isOpen, onClose, task, isCreating, onSaveNew }) => {
    const {
        tags, updateTask, deleteTask, createTag, toggleTaskTimer,
        users, uploadFile, isOffline, currentUser, projects, activeProjectId, deleteTag, archiveTaskManually
    } = useStore();

    const activeProject = projects.find(p => p.id === activeProjectId);
    const isManager = activeProject?.managerId === currentUser?.id;
    const isLead = activeProject?.leadIds.includes(currentUser?.id || '');
    const projectManager = users.find(u => u.id === activeProject?.managerId);
    const remindersEnabled = projectManager?.remindersEnabled || false;
    const timeTrackingEnabled = projectManager?.timeTrackingEnabled || false;

    const [localTitle, setLocalTitle] = useState(task.title);
    const [localDesc, setLocalDesc] = useState(task.description || '');
    const [localAssignee, setLocalAssignee] = useState(task.assigneeId || '');
    const [localTags, setLocalTags] = useState<string[]>(task.tagIds);
    const [newTagName, setNewTagName] = useState('');
    const [localAttachments, setLocalAttachments] = useState<string[]>(task.attachments || []);
    const [reminderDate, setReminderDate] = useState(task.reminderAt ? new Date(task.reminderAt).toISOString().slice(0, 16) : '');
    const [showReminder, setShowReminder] = useState(!!task.reminderAt);
    const [localPriority, setLocalPriority] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Time Tracking
    const [localEstimatedMinutes, setLocalEstimatedMinutes] = useState(Math.floor((task.estimatedTime || 0) / 60));
    const [localActualMinutes, setLocalActualMinutes] = useState(Math.floor((task.timeTracked || 0) / 60));
    const [elapsedTime, setElapsedTime] = useState(task.timeTracked || 0);

    // Reset state when task changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setLocalTitle(task.title);
            setLocalDesc(task.description || '');
            setLocalAssignee(task.assigneeId || '');
            setLocalTags(task.tagIds);
            setLocalAttachments(task.attachments || []);
            setReminderDate(task.reminderAt ? new Date(task.reminderAt).toISOString().slice(0, 16) : '');
            setShowReminder(!!task.reminderAt);
            setLocalEstimatedMinutes(Math.floor((task.estimatedTime || 0) / 60));
            setLocalActualMinutes(Math.floor((task.timeTracked || 0) / 60));
            setElapsedTime(task.timeTracked || 0);
        }
    }, [isOpen, task]);

    // Priority sync
    useEffect(() => {
        const pTags = tags.filter(t => t.type === 'Priority' && localTags.includes(t.id));
        if (pTags.length > 0) setLocalPriority(pTags[0].id);
        else setLocalPriority('');
    }, [isOpen, tags, localTags]);

    // Timer effect
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

    // Sync actual minutes
    useEffect(() => {
        setLocalActualMinutes(Math.floor(elapsedTime / 60));
    }, [elapsedTime]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
    };

    const handleSave = async () => {
        let finalTags = [...localTags];
        if (localPriority) {
            const priorityTagIds = tags.filter(t => t.type === 'Priority').map(t => t.id);
            finalTags = finalTags.filter(id => !priorityTagIds.includes(id));
            finalTags.push(localPriority);
        }

        const taskData = {
            title: localTitle,
            description: localDesc,
            assigneeId: localAssignee || undefined,
            tagIds: finalTags,
            reminderAt: showReminder && reminderDate ? new Date(reminderDate).getTime() : undefined,
            attachments: localAttachments,
            estimatedTime: localEstimatedMinutes * 60,
            timeTracked: localActualMinutes * 60
        };

        if (isCreating && onSaveNew) {
            await onSaveNew(taskData);
        } else {
            await updateTask(task.id, taskData);
        }
        onClose();
    };

    const handleDelete = async () => {
        if (confirm('Delete this task?')) {
            await deleteTask(task.id);
            onClose();
        }
    };

    const handleCreateTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newTagName.trim()) {
            const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const newTag = await createTag(task.projectId, newTagName, randomColor);
            setLocalTags([...localTags, newTag.id]);
            setNewTagName('');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const url = await uploadFile(e.target.files[0]);
            if (url) setLocalAttachments([...localAttachments, url]);
        }
    };

    const handleTagToggle = (tagId: string) => {
        if (localTags.includes(tagId)) {
            setLocalTags(localTags.filter(id => id !== tagId));
        } else {
            setLocalTags([...localTags, tagId]);
        }
    };

    const handleDeleteTag = async (tagId: string) => {
        if (confirm('Are you sure you want to permanently delete this tag?')) {
            setLocalTags(prev => prev.filter(id => id !== tagId));
            await deleteTag(tagId);
        }
    };

    const projectTags = tags.filter(t => !t.projectId || t.projectId === task.projectId);
    const priorityTags = projectTags.filter(t => t.type === 'Priority');
    const typeTags = projectTags.filter(t => t.type !== 'Priority');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isCreating ? "New Task" : "Edit Task"}>
            <div className="space-y-4">
                {/* Title Input */}
                <div>
                    <input
                        type="text"
                        value={localTitle}
                        onChange={e => setLocalTitle(e.target.value)}
                        placeholder="Task Title"
                        className="w-full p-3 border rounded-lg text-lg font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-slate-800 dark:border-slate-600 dark:text-white placeholder-slate-400"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Description / Discuss Points</label>
                    <textarea
                        value={localDesc}
                        onChange={e => setLocalDesc(e.target.value)}
                        placeholder="Add description or discussion points..."
                        className="w-full p-3 border rounded-lg h-24 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-slate-800 dark:border-slate-600"
                    />
                </div>

                {/* Properties Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Assignee</label>
                        <select value={localAssignee} onChange={e => setLocalAssignee(e.target.value)} className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 appearance-none">
                            <option value="">Unassigned</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Priority</label>
                        <select value={localPriority} onChange={e => setLocalPriority(e.target.value)} className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 appearance-none">
                            <option value="">None</option>
                            {priorityTags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Time Tracking & Reminder */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Estimated Time (min)</label>
                        <input
                            type="number"
                            value={localEstimatedMinutes}
                            onChange={e => setLocalEstimatedMinutes(parseInt(e.target.value) || 0)}
                            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 appearance-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Actual Time (min)</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={localActualMinutes}
                                onChange={e => {
                                    const val = parseInt(e.target.value) || 0;
                                    setLocalActualMinutes(val);
                                    setElapsedTime(val * 60);
                                }}
                                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 appearance-none"
                            />
                            <button
                                onClick={() => toggleTaskTimer(task.id)}
                                title={task.timerStartedAt ? "Stop Timer" : "Start Timer"}
                                className={`p-2 rounded border transition-colors ${task.timerStartedAt ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'}`}
                            >
                                {task.timerStartedAt ? <Pause size={16} /> : <Play size={16} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Reminder</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={showReminder}
                                onChange={e => setShowReminder(e.target.checked)}
                                className="rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <input
                                type="datetime-local"
                                value={reminderDate}
                                onChange={e => setReminderDate(e.target.value)}
                                disabled={!showReminder}
                                className="flex-1 p-2 border rounded text-sm dark:bg-slate-800 dark:border-slate-600 disabled:opacity-50"
                            />
                        </div>
                    </div>
                </div>

                {/* Attachments */}
                <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Attachments</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {localAttachments.map((url, i) => (
                            <div key={i} className="relative group w-16 h-16 rounded overflow-hidden border border-slate-200">
                                <img src={url} alt="Attachment" className="w-full h-full object-cover" onClick={() => setPreviewImage(url)} />
                                <button
                                    onClick={() => setLocalAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                    className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                        <label className="w-16 h-16 flex items-center justify-center border-2 border-dashed border-slate-300 rounded cursor-pointer hover:border-primary hover:text-primary transition-colors">
                            <Plus size={20} />
                            <input type="file" className="hidden" onChange={handleFileUpload} />
                        </label>
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {typeTags.map(tag => (
                            <div
                                key={tag.id}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${localTags.includes(tag.id) ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-500'}`}
                            >
                                <button onClick={() => handleTagToggle(tag.id)}>{tag.name}</button>
                                <button onClick={() => handleDeleteTag(tag.id)} className="hover:text-red-500 ml-1 text-slate-400"><Trash size={10} /></button>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleCreateTag} className="flex gap-2">
                        <input
                            type="text"
                            value={newTagName}
                            onChange={e => setNewTagName(e.target.value)}
                            placeholder="New tag..."
                            className="flex-1 p-1.5 text-sm border rounded dark:bg-slate-800 dark:border-slate-600"
                        />
                        <button type="submit" className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200">
                            <Plus size={16} />
                        </button>
                    </form>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                    {!isCreating && (
                        <>
                            <button onClick={handleDelete} className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                Delete Task
                            </button>
                            <button
                                onClick={async () => {
                                    if (confirm('Archive this task? It will move to History and can be viewed in the History page.')) {
                                        await archiveTaskManually(task.id);
                                        onClose();
                                    }
                                }}
                                className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg flex items-center gap-2 font-medium"
                            >
                                <Archive size={16} />
                                Archive Now
                            </button>
                        </>
                    )}
                    <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg ml-auto">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-blue-600 shadow-sm">
                        {isCreating ? "Create Task" : "Save Changes"}
                    </button>
                </div>
            </div>

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
        </Modal>
    );
};
