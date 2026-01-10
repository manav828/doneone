import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { Task, User, RecurrenceConfig } from '../types';
import { Modal } from './Modal';
import { ConfirmModal } from './ConfirmModal';
import { PremiumModal } from './PremiumModal';
import { Plus, Trash, Timer, Play, Pause, X, Clock, Image, Archive, Lock, Users, MessageCircle, CheckCircle, Edit2, Repeat } from 'lucide-react';

interface TaskEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    isCreating?: boolean;
    onSaveNew?: (task: Partial<Task>) => Promise<void>;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ isOpen, onClose, task, isCreating, onSaveNew }) => {
    const {
        tags, updateTask, deleteTask, createTag, updateTag, toggleTaskTimer, endDiscussion, startDiscussion,
        users, uploadFile, deleteFile, isOffline, currentUser, projects, activeProjectId, deleteTag, archiveTaskManually
    } = useStore();

    const activeProject = projects.find(p => p.id === activeProjectId);

    // FIXED PERMISSION LOGIC:
    // If I am the owner of this project, use MY settings (always fresh from currentUser)
    // If I am NOT the owner, use the project owner's settings
    const isOwner = activeProject?.ownerId === currentUser?.id;
    const effectiveOwner = isOwner ? currentUser : activeProject?.owner;

    const isLead = activeProject?.leadIds.includes(currentUser?.id || '');
    const remindersEnabled = effectiveOwner?.remindersEnabled || false;
    const timeTrackingEnabled = effectiveOwner?.timeTrackingEnabled || false;
    const imageUploadEnabled = effectiveOwner?.imageUploadEnabled || false;

    const [localTitle, setLocalTitle] = useState(task.title);
    const [localDesc, setLocalDesc] = useState(task.description || '');
    const [localAssignee, setLocalAssignee] = useState(task.assigneeId || '');
    const [localTags, setLocalTags] = useState<string[]>(task.tagIds);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#f97316'); // Default to primary/theme color (Orange)
    const [editingTagId, setEditingTagId] = useState<string | null>(null);
    const [isManagingTags, setIsManagingTags] = useState(false);
    const [localAttachments, setLocalAttachments] = useState<(string | File)[]>(task.attachments || []);
    const [reminderDate, setReminderDate] = useState(task.reminderAt ? new Date(task.reminderAt).toISOString().slice(0, 16) : '');
    const [localReminderUsers, setLocalReminderUsers] = useState<string[]>(task.reminderUserIds || []);
    const [showReminder, setShowReminder] = useState(!!task.reminderAt);
    const [premiumModalFeature, setPremiumModalFeature] = useState<string | null>(null);
    const [localPriority, setLocalPriority] = useState<'high' | 'medium' | 'low' | ''>(task.priority || '');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
    const assigneeDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
                setIsAssigneeDropdownOpen(false);
            }
        }

        if (isAssigneeDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isAssigneeDropdownOpen]);

    // Discussion Task State
    const [isDiscussion, setIsDiscussion] = useState(task.isDiscussion || false);
    const [discussionUsers, setDiscussionUsers] = useState<string[]>(task.discussionUserIds || []);
    const [isDiscussionDropdownOpen, setIsDiscussionDropdownOpen] = useState(false);
    const [discussionSearch, setDiscussionSearch] = useState('');
    const discussionDropdownRef = useRef<HTMLDivElement>(null);

    // Recurrence State
    const [localRecurrence, setLocalRecurrence] = useState<RecurrenceConfig | null>(task.recurrence || null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (discussionDropdownRef.current && !discussionDropdownRef.current.contains(event.target as Node)) {
                setIsDiscussionDropdownOpen(false);
                setDiscussionSearch('');
            }
        }

        if (isDiscussionDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDiscussionDropdownOpen]);

    // Time Tracking
    const [localEstimatedMinutes, setLocalEstimatedMinutes] = useState(Math.floor((task.estimatedTime || 0) / 60));
    const [localActualMinutes, setLocalActualMinutes] = useState(Math.floor((task.timeTracked || 0) / 60));
    const [elapsedTime, setElapsedTime] = useState(task.timeTracked || 0);

    // Confirm Modal State
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

    // Reset state when task changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setLocalTitle(task.title);
            setLocalDesc(task.description || '');
            setLocalAssignee(task.assigneeId || '');
            setLocalTags(task.tagIds);
            setLocalAttachments(task.attachments || []);
            setReminderDate(task.reminderAt ? new Date(task.reminderAt).toISOString().slice(0, 16) : '');
            setLocalReminderUsers(task.reminderUserIds || []);
            setShowReminder(!!task.reminderAt);
            setLocalEstimatedMinutes(Math.floor((task.estimatedTime || 0) / 60));
            setLocalActualMinutes(Math.floor((task.timeTracked || 0) / 60));
            setElapsedTime(task.timeTracked || 0);
            // Discussion
            setIsDiscussion(task.isDiscussion || false);
            setDiscussionUsers(task.discussionUserIds || []);
        }
    }, [isOpen, task]);

    // Priority sync - load from task.priority field directly
    useEffect(() => {
        if (isOpen) {
            setLocalPriority(task.priority || '');
        }
    }, [isOpen, task.priority]);

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

        // Recurrence: If newly enabled, ensure next trigger is in the future to avoid immediate duplication
        let finalRecurrence = localRecurrence;
        if (localRecurrence && !task.recurrence) {
            const now = Date.now();
            const interval = localRecurrence.interval || 1;
            let nextTime = now;

            // Simple robust offsets for initial setup
            if (localRecurrence.frequency === 'daily') {
                nextTime += (86400000 * interval);
            } else if (localRecurrence.frequency === 'weekly') {
                nextTime += (604800000 * interval);
            } else if (localRecurrence.frequency === 'monthly') {
                const d = new Date(now);
                d.setMonth(d.getMonth() + interval);
                nextTime = d.getTime();
            } else {
                nextTime += (86400000 * interval);
            }

            finalRecurrence = { ...localRecurrence, nextTriggerAt: nextTime };
        }

        const taskData = {
            title: localTitle,
            description: localDesc,
            assigneeId: localAssignee || undefined,
            tagIds: finalTags,
            priority: localPriority || undefined,
            reminderAt: reminderDate ? new Date(reminderDate).getTime() : null,
            reminderUserIds: reminderDate ? localReminderUsers : undefined,
            attachments: [] as string[], // Placeholder, will be filled below
            estimatedTime: localEstimatedMinutes * 60,
            timeTracked: localActualMinutes * 60,
            // Discussion fields
            isDiscussion: isDiscussion,
            discussionUserIds: isDiscussion ? discussionUsers : [],
            // Recurrence
            recurrence: finalRecurrence
        };

        // 1. Process Uploads (Convert File objects to URLs)
        const finalAttachments: string[] = [];
        for (const item of localAttachments) {
            if (item instanceof File) {
                const url = await uploadFile(item);
                if (url) finalAttachments.push(url);
            } else {
                finalAttachments.push(item as string);
            }
        }
        taskData.attachments = finalAttachments;

        // 2. Process Cleanup (Delete removed files)
        const originalAttachments = task.attachments || [];
        const removedAttachments = originalAttachments.filter(url => !finalAttachments.includes(url));

        // Execute cleanup in background (don't block save)
        removedAttachments.forEach(url => deleteFile(url).catch(console.error));

        if (isCreating && onSaveNew) {
            await onSaveNew(taskData);
            // Note: For new tasks, startDiscussion needs to be called after the task is created
            // The parent component should handle this if needed
        } else {
            await updateTask(task.id, taskData);

            // Send notifications if discussion is being started (was not a discussion before, now is)
            if (isDiscussion && !task.isDiscussion && discussionUsers.length > 0) {
                await startDiscussion(task.id, discussionUsers);
            }
            // Also notify if new participants were added to an existing discussion
            else if (isDiscussion && task.isDiscussion && !task.discussionEnded) {
                const oldParticipants = task.discussionUserIds || [];
                const newParticipants = discussionUsers.filter(uid => !oldParticipants.includes(uid));
                if (newParticipants.length > 0) {
                    await startDiscussion(task.id, newParticipants);
                }
            }
        }
        onClose();
    };

    const handleDelete = async () => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Task',
            message: 'Are you sure you want to delete this task? This action cannot be undone.',
            confirmText: 'Delete',
            isDestructive: true,
            onConfirm: async () => {
                await deleteTask(task.id);
                onClose();
            }
        });
    };

    const handleCreateTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newTagName.trim()) {
            if (editingTagId) {
                await updateTag(editingTagId, newTagName, newTagColor);
                setEditingTagId(null);
            } else {
                const newTag = await createTag(task.projectId, newTagName, newTagColor);
                setLocalTags([...localTags, newTag.id]);
            }
            setNewTagName('');
            setNewTagColor('#3b82f6');
        }
    };

    const startEditingTag = (tag: any) => {
        setNewTagName(tag.name);
        setNewTagColor(tag.color);
        setEditingTagId(tag.id);
    };

    const cancelEditing = () => {
        setNewTagName('');
        setNewTagColor('#3b82f6');
        setEditingTagId(null);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            // DEFERRED UPLOAD: Store the File object directly
            setLocalAttachments([...localAttachments, e.target.files[0]]);
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
        setConfirmModal({
            isOpen: true,
            title: 'Delete Tag',
            message: 'Are you sure you want to permanently delete this tag?',
            confirmText: 'Delete',
            isDestructive: true,
            onConfirm: async () => {
                setLocalTags(prev => prev.filter(id => id !== tagId));
                await deleteTag(tagId);
            }
        });
    };

    const projectTags = tags.filter(t => !t.projectId || t.projectId === task.projectId);
    const priorityTags = projectTags.filter(t => t.type === 'Priority');
    const typeTags = projectTags.filter(t => t.type !== 'Priority');

    return (
        <>
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
                            <div className="relative" ref={assigneeDropdownRef}>
                                <div
                                    onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                                    className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 flex items-center justify-between cursor-pointer hover:border-primary transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        {localAssignee ? (
                                            (() => {
                                                const u = users.find(u => u.id === localAssignee);
                                                return u ? (
                                                    <>
                                                        {u.avatar ? (
                                                            <img src={u.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                                                {u.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <span className="text-sm dark:text-white">{u.name}</span>
                                                    </>
                                                ) : <span className="text-slate-400 text-sm">Unknown User</span>;
                                            })()
                                        ) : (
                                            <span className="text-slate-400 text-sm">Unassigned</span>
                                        )}
                                    </div>
                                    <Users size={14} className="text-slate-400" />
                                </div>

                                {isAssigneeDropdownOpen && (
                                    <>
                                        <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                                            <div
                                                onClick={() => { setLocalAssignee(''); setIsAssigneeDropdownOpen(false); }}
                                                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-500"
                                            >
                                                Unassigned
                                            </div>
                                            {users
                                                .filter(u =>
                                                    !activeProject ? false :
                                                        u.id === activeProject.ownerId ||
                                                        activeProject.leadIds.includes(u.id) ||
                                                        activeProject.resourceIds.includes(u.id)
                                                )
                                                .map(u => (
                                                    <div
                                                        key={u.id}
                                                        onClick={() => { setLocalAssignee(u.id); setIsAssigneeDropdownOpen(false); }}
                                                        className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2"
                                                    >
                                                        {u.avatar ? (
                                                            <img src={u.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                                                {u.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <span className="text-sm text-slate-700 dark:text-slate-200">{u.name}</span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Priority</label>
                            <select
                                value={localPriority}
                                onChange={e => setLocalPriority(e.target.value as 'high' | 'medium' | 'low' | '')}
                                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 appearance-none"
                            >
                                <option value="">None</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                    </div>

                    {/* Time Tracking & Reminder */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Reminder Section */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                                    <Clock size={12} /> Reminder
                                    {!remindersEnabled && <Lock size={12} className="text-amber-500 opacity-70 ml-0.5" />}
                                </label>
                            </div>

                            <div className="space-y-2">
                                <input
                                    type="datetime-local"
                                    value={reminderDate}
                                    onChange={e => setReminderDate(e.target.value)}
                                    disabled={!remindersEnabled}
                                    className={`w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 text-sm ${!remindersEnabled ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900' : ''}`}
                                />
                                {!remindersEnabled && (
                                    <div
                                        onClick={() => setPremiumModalFeature('Reminders')}
                                        className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1.5 rounded border border-amber-200 dark:border-amber-800 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                                    >
                                        <Lock size={12} className="shrink-0" />
                                        <span>Upgrade to enable reminders</span>
                                    </div>
                                )}

                                {/* Multi-Select Recipients */}
                                {remindersEnabled && reminderDate && (
                                    <div className="border rounded dark:border-slate-600 overflow-hidden">
                                        <div className="bg-slate-50 dark:bg-slate-700/50 px-2 py-1.5 border-b border-slate-100 dark:border-slate-600 flex items-center gap-2">
                                            <Users size={12} className="text-slate-400" />
                                            <span className="text-xs font-medium text-slate-500">Notify Members</span>
                                        </div>
                                        <div className="max-h-24 overflow-y-auto p-1.5 space-y-0.5">
                                            {users
                                                .filter(u => activeProject?.ownerId === u.id || activeProject?.leadIds.includes(u.id) || activeProject?.resourceIds.includes(u.id))
                                                .map(user => (
                                                    <label key={user.id} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-slate-300 text-primary focus:ring-primary/20"
                                                            checked={localReminderUsers.includes(user.id)}
                                                            onChange={e => {
                                                                if (e.target.checked) setLocalReminderUsers([...localReminderUsers, user.id]);
                                                                else setLocalReminderUsers(localReminderUsers.filter(id => id !== user.id));
                                                            }}
                                                        />
                                                        <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{user.name} {user.id === currentUser?.id ? '(Me)' : ''}</span>
                                                    </label>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Estimated Time (Hours)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={localEstimatedMinutes > 0 ? (localEstimatedMinutes / 60).toFixed(1).replace(/\.0$/, '') : ''}
                                onChange={e => {
                                    const val = Math.round(parseFloat(e.target.value || '0') * 60);
                                    setLocalEstimatedMinutes(val);
                                }}
                                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 appearance-none"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Actual Time (Hours)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={localActualMinutes > 0 ? (localActualMinutes / 60).toFixed(1).replace(/\.0$/, '') : ''}
                                    onChange={e => {
                                        const val = Math.round(parseFloat(e.target.value || '0') * 60);
                                        setLocalActualMinutes(val);
                                        setElapsedTime(val * 60);
                                    }}
                                    className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 appearance-none"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>


                    {/* Attachments */}
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Attachments</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {localAttachments.map((item, i) => {
                                const url = item instanceof File ? URL.createObjectURL(item) : item;
                                return (
                                    <div key={i} className="relative group w-16 h-16 rounded overflow-hidden border border-slate-200">
                                        <img src={url} alt="Attachment" className="w-full h-full object-cover" onClick={() => setPreviewImage(url)} />
                                        <button
                                            onClick={() => setLocalAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                            className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                );
                            })}
                            {imageUploadEnabled ? (
                                <div className="w-16 h-16 flex items-center justify-center border-2 border-dashed rounded transition-colors border-slate-300 cursor-pointer hover:border-primary hover:text-primary">
                                    <label className="w-full h-full flex items-center justify-center">
                                        <Plus size={20} />
                                        <input type="file" className="hidden" onChange={handleFileUpload} />
                                    </label>
                                </div>
                            ) : (
                                <div
                                    onClick={() => setPremiumModalFeature('Image Uploads')}
                                    className="w-16 h-16 flex items-center justify-center border-2 border-dashed rounded transition-colors border-slate-200 bg-slate-50 cursor-not-allowed"
                                    title="Image Upload Disabled"
                                >
                                    <Lock size={16} className="text-slate-400" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold uppercase text-slate-500 block">Tags</label>
                            <button
                                onClick={() => setIsManagingTags(!isManagingTags)}
                                className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                                {isManagingTags ? 'Done' : 'Manage Tags'}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {typeTags.map(tag => {
                                const isSelected = localTags.includes(tag.id);
                                return (
                                    <div
                                        key={tag.id}
                                        className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-default select-none
                                            ${isSelected
                                                ? 'border-transparent'
                                                : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                                            }`}
                                        style={isSelected ? {
                                            backgroundColor: `${tag.color}20`,
                                            color: tag.color,
                                        } : {}}
                                    >
                                        <button onClick={() => handleTagToggle(tag.id)} className="focus:outline-none">
                                            {tag.name}
                                        </button>

                                        {/* Actions - Only visible when managing */}
                                        {isManagingTags && (
                                            <div className="flex items-center gap-0.5 pl-1 border-l border-current/20 animate-in fade-in zoom-in duration-200">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); startEditingTag(tag); }}
                                                    className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                                                    title="Edit Tag"
                                                >
                                                    <Edit2 size={10} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteTag(tag.id); }}
                                                    className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                                                    title="Delete Tag"
                                                >
                                                    <Trash size={10} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {typeTags.length === 0 && <span className="text-xs text-slate-400 italic">No tags created yet.</span>}
                        </div>

                        {/* Tag Creation Input - Always visible for quick add */}
                        <form onSubmit={handleCreateTag} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="relative flex items-center justify-center w-8 h-8 shrink-0">
                                <label className="cursor-pointer w-6 h-6 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-700 overflow-hidden" style={{ backgroundColor: newTagColor }}>
                                    <input
                                        type="color"
                                        value={newTagColor}
                                        onChange={e => setNewTagColor(e.target.value)}
                                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                        title="Pick Color"
                                    />
                                </label>
                            </div>
                            <input
                                type="text"
                                value={newTagName}
                                onChange={e => setNewTagName(e.target.value)}
                                placeholder={editingTagId ? "Editing tag name..." : "Create new tag..."}
                                className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none min-w-0"
                            />
                            {editingTagId ? (
                                <div className="flex items-center gap-1 pr-1">
                                    <button
                                        type="button"
                                        onClick={cancelEditing}
                                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                        title="Cancel Edit"
                                    >
                                        <X size={16} />
                                    </button>
                                    <button
                                        type="submit"
                                        className="p-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 shadow-sm transition-all"
                                        title="Save Changes"
                                    >
                                        <CheckCircle size={14} strokeWidth={2.5} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={!newTagName.trim()}
                                    className="p-1.5 bg-white dark:bg-slate-700 text-slate-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-slate-600 rounded-md border border-slate-200 dark:border-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed pr-2"
                                    title="Add Tag"
                                >
                                    <Plus size={16} />
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Discussion Task Section */}
                    <div className="border rounded-lg dark:border-slate-600">
                        <div
                            className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${isDiscussion && !task.discussionEnded ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-slate-50 dark:bg-slate-700/50'}`}
                            onClick={() => setIsDiscussion(!isDiscussion)}
                        >
                            <div className="flex items-center gap-2">
                                <MessageCircle size={16} className={isDiscussion ? 'text-primary' : 'text-slate-400'} />
                                <span className={`text-sm font-medium ${isDiscussion ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>
                                    Discussion Task
                                </span>
                                {task.isDiscussion && !task.discussionEnded && (
                                    <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/50 text-primary text-[10px] rounded-full font-bold uppercase">Active</span>
                                )}
                                {task.discussionEnded && (
                                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 text-[10px] rounded-full font-bold uppercase flex items-center gap-1">
                                        <CheckCircle size={10} /> Concluded
                                    </span>
                                )}
                            </div>
                            <div className={`w-9 h-5 rounded-full transition-colors ${isDiscussion ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'} relative`}>
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isDiscussion ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </div>
                        </div>

                        {isDiscussion && (
                            <div className="p-3 border-t border-slate-100 dark:border-slate-600 space-y-3">
                                {/* Participants Selector */}
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block flex items-center gap-1.5">
                                        <Users size={12} /> Discussion Participants
                                    </label>
                                    <div className="relative" ref={discussionDropdownRef}>
                                        <div
                                            onClick={() => setIsDiscussionDropdownOpen(!isDiscussionDropdownOpen)}
                                            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 flex items-center justify-between cursor-pointer hover:border-primary transition-colors min-h-[40px]"
                                        >
                                            <div className="flex flex-wrap gap-1.5">
                                                {discussionUsers.length === 0 ? (
                                                    <span className="text-slate-400 text-sm">Select participants...</span>
                                                ) : (
                                                    discussionUsers.map(uid => {
                                                        const u = users.find(u => u.id === uid);
                                                        return u ? (
                                                            <span key={uid} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/50 text-primary-dark dark:text-orange-300 text-xs rounded-full">
                                                                {u.name}
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setDiscussionUsers(prev => prev.filter(id => id !== uid)); }}
                                                                    className="hover:text-red-500"
                                                                >
                                                                    <X size={10} />
                                                                </button>
                                                            </span>
                                                        ) : null;
                                                    })
                                                )}
                                            </div>
                                            <Users size={14} className="text-slate-400 shrink-0 ml-2" />
                                        </div>

                                        {isDiscussionDropdownOpen && (
                                            <>
                                                <div className="mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm z-[60] overflow-hidden">
                                                    {/* Search Input */}
                                                    <div className="p-2 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
                                                        <input
                                                            type="text"
                                                            placeholder="Search members..."
                                                            value={discussionSearch}
                                                            onChange={(e) => setDiscussionSearch(e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white"
                                                            autoFocus
                                                        />
                                                    </div>
                                                    {/* Members List */}
                                                    <div className="max-h-48 overflow-y-auto overscroll-contain" style={{ overscrollBehavior: 'contain' }}>
                                                        {(() => {
                                                            // Use activeProjectId for new tasks (isCreating), task.projectId for existing tasks
                                                            const projectId = isCreating ? activeProjectId : (task.projectId || activeProjectId);
                                                            const taskProject = projects.find(p => p.id === projectId);
                                                            const projectMembers = users.filter(u =>
                                                                taskProject ? (
                                                                    u.id === taskProject.ownerId ||
                                                                    taskProject.leadIds?.includes(u.id) ||
                                                                    taskProject.resourceIds?.includes(u.id)
                                                                ) : false
                                                            );

                                                            // Filter by search
                                                            const filteredMembers = projectMembers.filter(u =>
                                                                u.name.toLowerCase().includes(discussionSearch.toLowerCase()) ||
                                                                u.email?.toLowerCase().includes(discussionSearch.toLowerCase())
                                                            );

                                                            if (filteredMembers.length === 0) {
                                                                return (
                                                                    <div className="p-3 text-center text-slate-400 text-sm">
                                                                        {projectMembers.length === 0 ? 'No project members found' : 'No matching members'}
                                                                    </div>
                                                                );
                                                            }

                                                            return filteredMembers.map(u => (
                                                                <div
                                                                    key={u.id}
                                                                    onClick={() => {
                                                                        if (discussionUsers.includes(u.id)) {
                                                                            setDiscussionUsers(prev => prev.filter(id => id !== u.id));
                                                                        } else {
                                                                            setDiscussionUsers(prev => [...prev, u.id]);
                                                                        }
                                                                    }}
                                                                    className={`p-2.5 cursor-pointer flex items-center gap-3 border-b border-slate-50 dark:border-slate-700 last:border-0 ${discussionUsers.includes(u.id) ? 'bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={discussionUsers.includes(u.id)}
                                                                        readOnly
                                                                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                                                    />
                                                                    {u.avatar ? (
                                                                        <img src={u.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                                                                    ) : (
                                                                        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                                            {u.name.charAt(0)}
                                                                        </div>
                                                                    )}
                                                                    <span className="text-sm text-slate-700 dark:text-slate-200 truncate">{u.name}</span>
                                                                    {u.id === currentUser?.id && <span className="text-xs text-slate-400 flex-shrink-0">(Me)</span>}
                                                                </div>
                                                            ));
                                                        })()}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* End Discussion Button - Only for creator when discussion is active */}
                                {!isCreating && task.isDiscussion && !task.discussionEnded && task.creatorId === currentUser?.id && (
                                    <button
                                        onClick={async () => {
                                            await endDiscussion(task.id);
                                            onClose();
                                        }}
                                        className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <CheckCircle size={16} />
                                        End Discussion & Notify All
                                    </button>
                                )}

                                {/* Restart Discussion Button - Show when discussion was concluded */}
                                {!isCreating && task.discussionEnded && (
                                    <button
                                        onClick={async () => {
                                            await updateTask(task.id, { discussionEnded: false });
                                            onClose();
                                        }}
                                        className="w-full py-2 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <MessageCircle size={16} />
                                        Restart Discussion
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Recurring Task Section */}
                    <div>
                        <div
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border ${localRecurrence ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-900/30' : 'bg-slate-50 dark:bg-slate-700/50 border-transparent'}`}
                            onClick={() => {
                                if (localRecurrence) setLocalRecurrence(null);
                                else setLocalRecurrence({
                                    frequency: 'weekly',
                                    interval: 1,
                                    nextTriggerAt: Date.now(),
                                    daysOfWeek: [new Date().getDay()] // Default to today
                                });
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <Repeat size={16} className={localRecurrence ? 'text-primary' : 'text-slate-400'} />
                                <span className={`text-sm font-medium ${localRecurrence ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>
                                    Recurring Task
                                </span>
                                {localRecurrence && (
                                    <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/50 text-primary text-[10px] rounded-full font-bold uppercase">Active</span>
                                )}
                            </div>
                            <div className={`w-9 h-5 rounded-full transition-colors ${localRecurrence ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'} relative`}>
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${localRecurrence ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </div>
                        </div>

                        {localRecurrence && (
                            <div className="mt-2 p-3 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3 bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Frequency</label>
                                        <select
                                            value={localRecurrence.frequency}
                                            onChange={e => setLocalRecurrence({ ...localRecurrence, frequency: e.target.value as any })}
                                            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 text-sm"
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="custom">Custom (Days)</option>
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Interval</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                value={localRecurrence.interval}
                                                onChange={e => setLocalRecurrence({ ...localRecurrence, interval: parseInt(e.target.value) || 1 })}
                                                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Weekly Days Selector */}
                                {localRecurrence.frequency === 'weekly' && (
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Repeat On</label>
                                        <div className="flex gap-2">
                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                                                const isSelected = localRecurrence.daysOfWeek?.includes(idx);
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            const currentDays = localRecurrence.daysOfWeek || [];
                                                            const newDays = currentDays.includes(idx)
                                                                ? currentDays.filter(d => d !== idx)
                                                                : [...currentDays, idx];
                                                            setLocalRecurrence({ ...localRecurrence, daysOfWeek: newDays });
                                                        }}
                                                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${isSelected ? 'bg-primary text-white shadow-md scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                                                    >
                                                        {day}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* End Date */}
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Ends On (Optional)</label>
                                    <input
                                        type="date"
                                        value={localRecurrence.endsAt ? new Date(localRecurrence.endsAt).toISOString().split('T')[0] : ''}
                                        onChange={e => {
                                            const date = e.target.value ? new Date(e.target.value).getTime() : undefined;
                                            setLocalRecurrence({
                                                ...localRecurrence,
                                                endsAt: date
                                            });
                                        }}
                                        className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions - Single Line */}
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                        {!isCreating && (
                            <div className="flex gap-2 mr-auto">
                                <button
                                    onClick={handleDelete}
                                    className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg whitespace-nowrap"
                                    title="Delete Task"
                                >
                                    <Trash size={16} className="inline mr-1" />
                                    Delete
                                </button>
                                <button
                                    onClick={() => {
                                        setConfirmModal({
                                            isOpen: true,
                                            title: 'Archive Task',
                                            message: 'Archive this task? It will move to History and can be viewed in the History page.',
                                            confirmText: 'Archive Now',
                                            onConfirm: async () => {
                                                await archiveTaskManually(task.id);
                                                onClose();
                                            }
                                        });
                                    }}
                                    className="px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg flex items-center gap-1 whitespace-nowrap font-medium"
                                    title="Archive Task"
                                >
                                    <Archive size={16} />
                                    Archive
                                </button>
                            </div>
                        )}
                        <div className={`flex gap-2 ${isCreating ? 'w-full justify-end' : ''}`}>
                            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg whitespace-nowrap">
                                Cancel
                            </button>
                            <button onClick={handleSave} className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-blue-600 shadow-sm whitespace-nowrap">
                                {isCreating ? "Create Task" : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div >

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
            </Modal >

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                isDestructive={confirmModal.isDestructive}
                confirmText={confirmModal.confirmText}
            />
            {/* Premium Upsell Modal */}
            {
                premiumModalFeature && (
                    <PremiumModal
                        isOpen={!!premiumModalFeature}
                        onClose={() => setPremiumModalFeature(null)}
                        featureName={premiumModalFeature}
                    />
                )
            }
        </>
    );
};
