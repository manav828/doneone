import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Task, User } from '../types';
import { Modal } from './Modal';
import { ConfirmModal } from './ConfirmModal';
import { PremiumModal } from './PremiumModal';
import { Plus, Trash, Timer, Play, Pause, X, Clock, Image, Archive, Lock, Users, MessageCircle, CheckCircle } from 'lucide-react';

interface TaskEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    isCreating?: boolean;
    onSaveNew?: (task: Partial<Task>) => Promise<void>;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ isOpen, onClose, task, isCreating, onSaveNew }) => {
    const {
        tags, updateTask, deleteTask, createTag, toggleTaskTimer, endDiscussion, startDiscussion,
        users, uploadFile, deleteFile, isOffline, currentUser, projects, activeProjectId, deleteTag, archiveTaskManually
    } = useStore();

    const activeProject = projects.find(p => p.id === activeProjectId);

    // FIXED PERMISSION LOGIC:
    // If I am the manager of this project, use MY settings (always fresh from currentUser)
    // If I am NOT the manager, use the project manager's settings
    const isManager = activeProject?.managerId === currentUser?.id;
    const effectiveManager = isManager ? currentUser : activeProject?.manager;

    const isLead = activeProject?.leadIds.includes(currentUser?.id || '');
    const remindersEnabled = effectiveManager?.remindersEnabled || false;
    const timeTrackingEnabled = effectiveManager?.timeTrackingEnabled || false;
    const imageUploadEnabled = effectiveManager?.imageUploadEnabled || false;

    const [localTitle, setLocalTitle] = useState(task.title);
    const [localDesc, setLocalDesc] = useState(task.description || '');
    const [localAssignee, setLocalAssignee] = useState(task.assigneeId || '');
    const [localTags, setLocalTags] = useState<string[]>(task.tagIds);
    const [newTagName, setNewTagName] = useState('');
    const [localAttachments, setLocalAttachments] = useState<(string | File)[]>(task.attachments || []);
    const [reminderDate, setReminderDate] = useState(task.reminderAt ? new Date(task.reminderAt).toISOString().slice(0, 16) : '');
    const [localReminderUsers, setLocalReminderUsers] = useState<string[]>(task.reminderUserIds || []);
    const [showReminder, setShowReminder] = useState(!!task.reminderAt);
    const [premiumModalFeature, setPremiumModalFeature] = useState<string | null>(null);
    const [localPriority, setLocalPriority] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);

    // Discussion Task State
    const [isDiscussion, setIsDiscussion] = useState(task.isDiscussion || false);
    const [discussionUsers, setDiscussionUsers] = useState<string[]>(task.discussionUserIds || []);
    const [isDiscussionDropdownOpen, setIsDiscussionDropdownOpen] = useState(false);
    const [discussionSearch, setDiscussionSearch] = useState('');

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
            reminderAt: reminderDate ? new Date(reminderDate).getTime() : null,
            reminderUserIds: reminderDate ? localReminderUsers : undefined,
            attachments: [] as string[], // Placeholder, will be filled below
            estimatedTime: localEstimatedMinutes * 60,
            timeTracked: localActualMinutes * 60,
            // Discussion fields
            isDiscussion: isDiscussion,
            discussionUserIds: isDiscussion ? discussionUsers : []
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
            const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const newTag = await createTag(task.projectId, newTagName, randomColor);
            setLocalTags([...localTags, newTag.id]);
            setNewTagName('');
        }
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
                            <div className="relative">
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
                                        <div className="fixed inset-0 z-10" onClick={() => setIsAssigneeDropdownOpen(false)}></div>
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
                                                        u.id === activeProject.managerId ||
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
                            <select value={localPriority} onChange={e => setLocalPriority(e.target.value)} className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 appearance-none">
                                <option value="">None</option>
                                {priorityTags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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
                                                .filter(u => activeProject?.managerId === u.id || activeProject?.leadIds.includes(u.id) || activeProject?.resourceIds.includes(u.id))
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

                    {/* Discussion Task Section */}
                    <div className="border rounded-lg dark:border-slate-600">
                        <div
                            className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${isDiscussion && !task.discussionEnded ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-slate-50 dark:bg-slate-700/50'}`}
                            onClick={() => setIsDiscussion(!isDiscussion)}
                        >
                            <div className="flex items-center gap-2">
                                <MessageCircle size={16} className={isDiscussion ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'} />
                                <span className={`text-sm font-medium ${isDiscussion ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                    Discussion Task
                                </span>
                                {task.isDiscussion && !task.discussionEnded && (
                                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 text-[10px] rounded-full font-bold uppercase">Active</span>
                                )}
                                {task.discussionEnded && (
                                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 text-[10px] rounded-full font-bold uppercase flex items-center gap-1">
                                        <CheckCircle size={10} /> Concluded
                                    </span>
                                )}
                            </div>
                            <div className={`w-9 h-5 rounded-full transition-colors ${isDiscussion ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'} relative`}>
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
                                    <div className="relative">
                                        <div
                                            onClick={() => setIsDiscussionDropdownOpen(!isDiscussionDropdownOpen)}
                                            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 flex items-center justify-between cursor-pointer hover:border-purple-400 transition-colors min-h-[40px]"
                                        >
                                            <div className="flex flex-wrap gap-1.5">
                                                {discussionUsers.length === 0 ? (
                                                    <span className="text-slate-400 text-sm">Select participants...</span>
                                                ) : (
                                                    discussionUsers.map(uid => {
                                                        const u = users.find(u => u.id === uid);
                                                        return u ? (
                                                            <span key={uid} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs rounded-full">
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
                                                <div className="fixed inset-0 z-50" onClick={() => { setIsDiscussionDropdownOpen(false); setDiscussionSearch(''); }}></div>
                                                <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-[60] overflow-hidden">
                                                    {/* Search Input */}
                                                    <div className="p-2 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
                                                        <input
                                                            type="text"
                                                            placeholder="Search members..."
                                                            value={discussionSearch}
                                                            onChange={(e) => setDiscussionSearch(e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
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
                                                                    u.id === taskProject.managerId ||
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
