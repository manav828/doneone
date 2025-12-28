import React from "react";
import { Timeline } from "./ui/timeline";

const TimelineFeatures = () => {
    const data = [
        {
            title: "Kanban Board",
            content: (
                <div>
                    <p className="text-slate-700 text-sm md:text-base font-normal mb-6 max-w-lg">
                        Visualize your workflow with intuitive drag-and-drop Kanban boards.
                        Organize tasks into columns, track progress at a glance, and keep your team aligned.
                    </p>
                    <div className="mb-4">
                        <div className="flex gap-2 items-center text-slate-600 text-xs md:text-sm mb-1.5">
                            <span className="text-orange-500">✓</span> Drag & drop task management
                        </div>
                        <div className="flex gap-2 items-center text-slate-600 text-xs md:text-sm mb-1.5">
                            <span className="text-orange-500">✓</span> Custom columns & workflows
                        </div>
                        <div className="flex gap-2 items-center text-slate-600 text-xs md:text-sm">
                            <span className="text-orange-500">✓</span> Real-time collaboration
                        </div>
                    </div>
                    <div className="rounded-xl overflow-hidden" style={{
                        boxShadow: '0 8px 32px rgba(249, 115, 22, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
                        border: '1px solid rgba(249, 115, 22, 0.08)'
                    }}>
                        <img
                            src="/guide/board-view.png"
                            alt="Kanban Board View"
                            className="w-full h-auto object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=500&fit=crop';
                            }}
                        />
                    </div>
                </div>
            ),
        },
        {
            title: "Time Tracking",
            content: (
                <div>
                    <p className="text-slate-700 text-sm md:text-base font-normal mb-6 max-w-lg">
                        Track time spent on every task with precision. Get insights into productivity,
                        generate reports, and never lose track of billable hours.
                    </p>
                    <div className="mb-4">
                        <div className="flex gap-2 items-center text-slate-600 text-xs md:text-sm mb-1.5">
                            <span className="text-orange-500">✓</span> One-click time tracking
                        </div>
                        <div className="flex gap-2 items-center text-slate-600 text-xs md:text-sm mb-1.5">
                            <span className="text-orange-500">✓</span> Detailed time reports
                        </div>
                        <div className="flex gap-2 items-center text-slate-600 text-xs md:text-sm">
                            <span className="text-orange-500">✓</span> Sleep detection & auto-pause
                        </div>
                    </div>
                    <div className="rounded-xl overflow-hidden" style={{
                        boxShadow: '0 8px 32px rgba(249, 115, 22, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
                        border: '1px solid rgba(249, 115, 22, 0.08)'
                    }}>
                        <img
                            src="/guide/reports-view.png"
                            alt="Time Tracking Reports"
                            className="w-full h-auto object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop';
                            }}
                        />
                    </div>
                </div>
            ),
        },
        {
            title: "Calendar View",
            content: (
                <div>
                    <p className="text-slate-700 text-sm md:text-base font-normal mb-6 max-w-lg">
                        See your tasks on a calendar. Plan your week, set reminders,
                        and never miss a deadline with visual scheduling.
                    </p>
                    <div className="mb-4">
                        <div className="flex gap-2 items-center text-slate-600 text-xs md:text-sm mb-1.5">
                            <span className="text-orange-500">✓</span> Visual task scheduling
                        </div>
                        <div className="flex gap-2 items-center text-slate-600 text-xs md:text-sm mb-1.5">
                            <span className="text-orange-500">✓</span> Due date reminders
                        </div>
                        <div className="flex gap-2 items-center text-slate-600 text-xs md:text-sm">
                            <span className="text-orange-500">✓</span> Week & month views
                        </div>
                    </div>
                    <div className="rounded-xl overflow-hidden" style={{
                        boxShadow: '0 8px 32px rgba(249, 115, 22, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
                        border: '1px solid rgba(249, 115, 22, 0.08)'
                    }}>
                        <img
                            src="/guide/calendar-view.png"
                            alt="Calendar View"
                            className="w-full h-auto object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&h=500&fit=crop';
                            }}
                        />
                    </div>
                </div>
            ),
        },
        {
            title: "Team Collaboration",
            content: (
                <div>
                    <p className="text-slate-700 text-sm md:text-base font-normal mb-6 max-w-lg">
                        Work together seamlessly. Assign tasks, discuss in threads,
                        and keep everyone on the same page with real-time updates.
                    </p>
                    <div className="mb-4">
                        <div className="flex gap-2 items-center text-slate-600 text-xs md:text-sm mb-1.5">
                            <span className="text-orange-500">✓</span> Team member assignments
                        </div>
                        <div className="flex gap-2 items-center text-slate-600 text-xs md:text-sm mb-1.5">
                            <span className="text-orange-500">✓</span> Discussion threads
                        </div>
                        <div className="flex gap-2 items-center text-slate-600 text-xs md:text-sm">
                            <span className="text-orange-500">✓</span> Real-time notifications
                        </div>
                    </div>
                    <div className="rounded-xl overflow-hidden" style={{
                        boxShadow: '0 8px 32px rgba(249, 115, 22, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
                        border: '1px solid rgba(249, 115, 22, 0.08)'
                    }}>
                        <img
                            src="/guide/list-view.png"
                            alt="Team Collaboration"
                            className="w-full h-auto object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=500&fit=crop';
                            }}
                        />
                    </div>
                </div>
            ),
        },
    ];

    return (
        <section id="features-timeline">
            <Timeline data={data} />
        </section>
    );
};

export default TimelineFeatures;
