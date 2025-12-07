// Universal Board Templates for FlowBoard
// Templates for all professions, not just IT

export interface BoardTemplate {
    id: string;
    name: string;
    category: 'Business' | 'Creative' | 'Personal' | 'Education' | 'Tech';
    description: string;
    icon: string; // emoji
    columns: Array<{
        title: string;
        color: string;
        orderIndex: number;
    }>;
    defaultTags: Array<{
        name: string;
        color: string;
        type: 'Priority' | 'Type' | 'Custom';
    }>;
    roles: {
        manager: string;
        lead: string;
        resource: string;
    };
    isPremium: boolean;
}

// ==========================================
// BUSINESS TEMPLATES (1 free, 4 premium)
// ==========================================

export const BUSINESS_TEMPLATES: BoardTemplate[] = [
    {
        id: 'business-project-management',
        name: 'Project Management',
        category: 'Business',
        description: 'Classic project workflow for any business project',
        icon: '📊',
        columns: [
            { title: 'Backlog', color: '#94a3b8', orderIndex: 0 },
            { title: 'In Progress', color: '#3b82f6', orderIndex: 1 },
            { title: 'Review', color: '#f59e0b', orderIndex: 2 },
            { title: 'Done', color: '#10b981', orderIndex: 3 }
        ],
        defaultTags: [
            { name: 'High Priority', color: '#ef4444', type: 'Priority' },
            { name: 'Medium Priority', color: '#f59e0b', type: 'Priority' },
            { name: 'Low Priority', color: '#10b981', type: 'Priority' }
        ],
        roles: { manager: 'Project Manager', lead: 'Team Lead', resource: 'Team Member' },
        isPremium: false // FREE
    },
    {
        id: 'business-sales-pipeline',
        name: 'Sales Pipeline',
        category: 'Business',
        description: 'Track leads from first contact to closed deals',
        icon: '💰',
        columns: [
            { title: 'Lead', color: '#94a3b8', orderIndex: 0 },
            { title: 'Contacted', color: '#6366f1', orderIndex: 1 },
            { title: 'Proposal', color: '#8b5cf6', orderIndex: 2 },
            { title: 'Negotiation', color: '#f59e0b', orderIndex: 3 },
            { title: 'Closed Won', color: '#10b981', orderIndex: 4 },
            { title: 'Closed Lost', color: '#ef4444', orderIndex: 5 }
        ],
        defaultTags: [
            { name: 'Hot Lead', color: '#ef4444', type: 'Priority' },
            { name: 'Warm Lead', color: '#f59e0b', type: 'Priority' },
            { name: 'Cold Lead', color: '#3b82f6', type: 'Priority' }
        ],
        roles: { manager: 'Sales Manager', lead: 'Sales Lead', resource: 'Sales Rep' },
        isPremium: false // FREE
    },
    {
        id: 'business-marketing-campaign',
        name: 'Marketing Campaign',
        category: 'Business',
        description: 'Plan and execute marketing campaigns',
        icon: '📱',
        columns: [
            { title: 'Ideas', color: '#a78bfa', orderIndex: 0 },
            { title: 'Planning', color: '#6366f1', orderIndex: 1 },
            { title: 'Creating', color: '#3b82f6', orderIndex: 2 },
            { title: 'Scheduled', color: '#f59e0b', orderIndex: 3 },
            { title: 'Published', color: '#10b981', orderIndex: 4 },
            { title: 'Analyzing', color: '#8b5cf6', orderIndex: 5 }
        ],
        defaultTags: [
            { name: 'Social Media', color: '#3b82f6', type: 'Type' },
            { name: 'Email', color: '#8b5cf6', type: 'Type' },
            { name: 'Content', color: '#10b981', type: 'Type' }
        ],
        roles: { manager: 'Marketing Manager', lead: 'Campaign Lead', resource: 'Marketer' },
        isPremium: false // FREE
    },
    {
        id: 'business-hiring-pipeline',
        name: 'Hiring Pipeline',
        category: 'Business',
        description: 'Manage recruitment from application to hire',
        icon: '👥',
        columns: [
            { title: 'Applied', color: '#94a3b8', orderIndex: 0 },
            { title: 'Phone Screen', color: '#6366f1', orderIndex: 1 },
            { title: 'Interview', color: '#3b82f6', orderIndex: 2 },
            { title: 'Offer', color: '#f59e0b', orderIndex: 3 },
            { title: 'Hired', color: '#10b981', orderIndex: 4 },
            { title: 'Rejected', color: '#ef4444', orderIndex: 5 }
        ],
        defaultTags: [
            { name: 'Engineering', color: '#3b82f6', type: 'Type' },
            { name: 'Design', color: '#8b5cf6', type: 'Type' },
            { name: 'Marketing', color: '#f59e0b', type: 'Type' }
        ],
        roles: { manager: 'HR Manager', lead: 'Recruiter', resource: 'Interviewer' },
        isPremium: false // FREE
    },
    {
        id: 'business-customer-support',
        name: 'Customer Support',
        category: 'Business',
        description: 'Track and resolve customer support tickets',
        icon: '🎧',
        columns: [
            { title: 'New', color: '#ef4444', orderIndex: 0 },
            { title: 'In Progress', color: '#3b82f6', orderIndex: 1 },
            { title: 'Waiting', color: '#f59e0b', orderIndex: 2 },
            { title: 'Escalated', color: '#8b5cf6', orderIndex: 3 },
            { title: 'Resolved', color: '#10b981', orderIndex: 4 }
        ],
        defaultTags: [
            { name: 'Urgent', color: '#ef4444', type: 'Priority' },
            { name: 'Bug', color: '#f59e0b', type: 'Type' },
            { name: 'Feature Request', color: '#3b82f6', type: 'Type' }
        ],
        roles: { manager: 'Support Manager', lead: 'Support Lead', resource: 'Support Agent' },
        isPremium: false // FREE
    }
];

// ==========================================
// CREATIVE TEMPLATES (1 free, 4 premium)
// ==========================================

export const CREATIVE_TEMPLATES: BoardTemplate[] = [
    {
        id: 'creative-content-creation',
        name: 'Content Creation',
        category: 'Creative',
        description: 'Manage content from idea to publication',
        icon: '✍️',
        columns: [
            { title: 'Ideas', color: '#a78bfa', orderIndex: 0 },
            { title: 'Research', color: '#6366f1', orderIndex: 1 },
            { title: 'Drafting', color: '#3b82f6', orderIndex: 2 },
            { title: 'Editing', color: '#f59e0b', orderIndex: 3 },
            { title: 'Published', color: '#10b981', orderIndex: 4 }
        ],
        defaultTags: [
            { name: 'Blog Post', color: '#3b82f6', type: 'Type' },
            { name: 'Video', color: '#ef4444', type: 'Type' },
            { name: 'Social Media', color: '#8b5cf6', type: 'Type' }
        ],
        roles: { manager: 'Content Director', lead: 'Editor', resource: 'Writer' },
        isPremium: false // FREE
    },
    {
        id: 'creative-design-workflow',
        name: 'Design Workflow',
        category: 'Creative',
        description: 'Design projects from brief to final delivery',
        icon: '🎨',
        columns: [
            { title: 'Brief', color: '#94a3b8', orderIndex: 0 },
            { title: 'Concept', color: '#a78bfa', orderIndex: 1 },
            { title: 'Design', color: '#8b5cf6', orderIndex: 2 },
            { title: 'Review', color: '#f59e0b', orderIndex: 3 },
            { title: 'Finalized', color: '#10b981', orderIndex: 4 }
        ],
        defaultTags: [
            { name: 'UI/UX', color: '#3b82f6', type: 'Type' },
            { name: 'Branding', color: '#8b5cf6', type: 'Type' },
            { name: 'Print', color: '#f59e0b', type: 'Type' }
        ],
        roles: { manager: 'Design Lead', lead: 'Senior Designer', resource: 'Designer' },
        isPremium: false // FREE
    },
    {
        id: 'creative-video-production',
        name: 'Video Production',
        category: 'Creative',
        description: 'Produce videos from planning to publishing',
        icon: '🎬',
        columns: [
            { title: 'Planning', color: '#6366f1', orderIndex: 0 },
            { title: 'Filming', color: '#3b82f6', orderIndex: 1 },
            { title: 'Editing', color: '#8b5cf6', orderIndex: 2 },
            { title: 'Review', color: '#f59e0b', orderIndex: 3 },
            { title: 'Published', color: '#10b981', orderIndex: 4 }
        ],
        defaultTags: [
            { name: 'YouTube', color: '#ef4444', type: 'Type' },
            { name: 'Tutorial', color: '#3b82f6', type: 'Type' },
            { name: 'Vlog', color: '#8b5cf6', type: 'Type' }
        ],
        roles: { manager: 'Producer', lead: 'Director', resource: 'Editor' },
        isPremium: false // FREE
    },
    {
        id: 'creative-social-media',
        name: 'Social Media Calendar',
        category: 'Creative',
        description: 'Plan and schedule social media content',
        icon: '📲',
        columns: [
            { title: 'Ideas', color: '#a78bfa', orderIndex: 0 },
            { title: 'Created', color: '#3b82f6', orderIndex: 1 },
            { title: 'Scheduled', color: '#f59e0b', orderIndex: 2 },
            { title: 'Posted', color: '#10b981', orderIndex: 3 },
            { title: 'Analyzing', color: '#8b5cf6', orderIndex: 4 }
        ],
        defaultTags: [
            { name: 'Instagram', color: '#8b5cf6', type: 'Type' },
            { name: 'Twitter', color: '#3b82f6', type: 'Type' },
            { name: 'LinkedIn', color: '#0ea5e9', type: 'Type' }
        ],
        roles: { manager: 'Social Media Manager', lead: 'Content Lead', resource: 'Creator' },
        isPremium: false // FREE
    },
    {
        id: 'creative-music-production',
        name: 'Music Production',
        category: 'Creative',
        description: 'Track music projects from concept to release',
        icon: '🎵',
        columns: [
            { title: 'Concept', color: '#a78bfa', orderIndex: 0 },
            { title: 'Writing', color: '#6366f1', orderIndex: 1 },
            { title: 'Recording', color: '#3b82f6', orderIndex: 2 },
            { title: 'Mixing', color: '#8b5cf6', orderIndex: 3 },
            { title: 'Mastering', color: '#f59e0b', orderIndex: 4 },
            { title: 'Released', color: '#10b981', orderIndex: 5 }
        ],
        defaultTags: [
            { name: 'Single', color: '#ef4444', type: 'Type' },
            { name: 'Album', color: '#8b5cf6', type: 'Type' },
            { name: 'Collaboration', color: '#3b82f6', type: 'Type' }
        ],
        roles: { manager: 'Producer', lead: 'Engineer', resource: 'Artist' },
        isPremium: false // FREE
    }
];

// ==========================================
// PERSONAL TEMPLATES (1 free, 4 premium)
// ==========================================

export const PERSONAL_TEMPLATES: BoardTemplate[] = [
    {
        id: 'personal-tasks',
        name: 'Personal Tasks',
        category: 'Personal',
        description: 'Simple to-do list for daily tasks',
        icon: '✅',
        columns: [
            { title: 'To Do', color: '#94a3b8', orderIndex: 0 },
            { title: 'Doing', color: '#3b82f6', orderIndex: 1 },
            { title: 'Done', color: '#10b981', orderIndex: 2 }
        ],
        defaultTags: [
            { name: 'Urgent', color: '#ef4444', type: 'Priority' },
            { name: 'Home', color: '#8b5cf6', type: 'Type' },
            { name: 'Work', color: '#3b82f6', type: 'Type' }
        ],
        roles: { manager: 'Self', lead: 'Self', resource: 'Self' },
        isPremium: false // FREE
    },
    {
        id: 'personal-home-renovation',
        name: 'Home Renovation',
        category: 'Personal',
        description: 'Plan and track home improvement projects',
        icon: '🏠',
        columns: [
            { title: 'Planning', color: '#6366f1', orderIndex: 0 },
            { title: 'Shopping', color: '#f59e0b', orderIndex: 1 },
            { title: 'In Progress', color: '#3b82f6', orderIndex: 2 },
            { title: 'Completed', color: '#10b981', orderIndex: 3 }
        ],
        defaultTags: [
            { name: 'Kitchen', color: '#f59e0b', type: 'Type' },
            { name: 'Bathroom', color: '#3b82f6', type: 'Type' },
            { name: 'Living Room', color: '#8b5cf6', type: 'Type' }
        ],
        roles: { manager: 'Homeowner', lead: 'Homeowner', resource: 'Helper' },
        isPremium: false // FREE
    },
    {
        id: 'personal-event-planning',
        name: 'Event Planning',
        category: 'Personal',
        description: 'Organize weddings, parties, or events',
        icon: '🎉',
        columns: [
            { title: 'Ideas', color: '#a78bfa', orderIndex: 0 },
            { title: 'Planning', color: '#6366f1', orderIndex: 1 },
            { title: 'Booking', color: '#f59e0b', orderIndex: 2 },
            { title: 'Preparation', color: '#3b82f6', orderIndex: 3 },
            { title: 'Event Day', color: '#ef4444', orderIndex: 4 },
            { title: 'Done', color: '#10b981', orderIndex: 5 }
        ],
        defaultTags: [
            { name: 'Venue', color: '#8b5cf6', type: 'Type' },
            { name: 'Catering', color: '#f59e0b', type: 'Type' },
            { name: 'Guests', color: '#3b82f6', type: 'Type' }
        ],
        roles: { manager: 'Organizer', lead: 'Organizer', resource: 'Helper' },
        isPremium: false // FREE
    },
    {
        id: 'personal-fitness-goals',
        name: 'Fitness & Health Goals',
        category: 'Personal',
        description: 'Track workout plans and health goals',
        icon: '💪',
        columns: [
            { title: 'Goals', color: '#a78bfa', orderIndex: 0 },
            { title: 'This Week', color: '#6366f1', orderIndex: 1 },
            { title: 'In Progress', color: '#3b82f6', orderIndex: 2 },
            { title: 'Completed', color: '#10b981', orderIndex: 3 }
        ],
        defaultTags: [
            { name: 'Cardio', color: '#ef4444', type: 'Type' },
            { name: 'Strength', color: '#8b5cf6', type: 'Type' },
            { name: 'Nutrition', color: '#10b981', type: 'Type' }
        ],
        roles: { manager: 'Self', lead: 'Self', resource: 'Workout Buddy' },
        isPremium: false // FREE
    },
    {
        id: 'personal-meal-planning',
        name: 'Meal Planning',
        category: 'Personal',
        description: 'Plan weekly meals and grocery shopping',
        icon: '🍳',
        columns: [
            { title: 'Recipes', color: '#a78bfa', orderIndex: 0 },
            { title: 'Shopping List', color: '#f59e0b', orderIndex: 1 },
            { title: 'Prep', color: '#3b82f6', orderIndex: 2 },
            { title: 'Cooked', color: '#10b981', orderIndex: 3 }
        ],
        defaultTags: [
            { name: 'Breakfast', color: '#f59e0b', type: 'Type' },
            { name: 'Lunch', color: '#3b82f6', type: 'Type' },
            { name: 'Dinner', color: '#8b5cf6', type: 'Type' }
        ],
        roles: { manager: 'Chef', lead: 'Chef', resource: 'Helper' },
        isPremium: false // FREE
    }
];

// ==========================================
// EDUCATION TEMPLATES (1 free, 4 premium)
// ==========================================

export const EDUCATION_TEMPLATES: BoardTemplate[] = [
    {
        id: 'education-course-planning',
        name: 'Course Planning',
        category: 'Education',
        description: 'Organize curriculum and lesson plans',
        icon: '📚',
        columns: [
            { title: 'Planning', color: '#6366f1', orderIndex: 0 },
            { title: 'Creating Materials', color: '#3b82f6', orderIndex: 1 },
            { title: 'Ready to Teach', color: '#10b981', orderIndex: 2 },
            { title: 'Taught', color: '#94a3b8', orderIndex: 3 }
        ],
        defaultTags: [
            { name: 'Lecture', color: '#3b82f6', type: 'Type' },
            { name: 'Lab', color: '#8b5cf6', type: 'Type' },
            { name: 'Assignment', color: '#f59e0b', type: 'Type' }
        ],
        roles: { manager: 'Department Head', lead: 'Lead Teacher', resource: 'Teacher' },
        isPremium: false // FREE
    },
    {
        id: 'education-student-research',
        name: 'Research Project',
        category: 'Education',
        description: 'Track student or academic research projects',
        icon: '🔬',
        columns: [
            { title: 'Topic Selection', color: '#a78bfa', orderIndex: 0 },
            { title: 'Research', color: '#6366f1', orderIndex: 1 },
            { title: 'Analysis', color: '#3b82f6', orderIndex: 2 },
            { title: 'Writing', color: '#8b5cf6', orderIndex: 3 },
            { title: 'Review', color: '#f59e0b', orderIndex: 4 },
            { title: 'Submitted', color: '#10b981', orderIndex: 5 }
        ],
        defaultTags: [
            { name: 'Literature Review', color: '#6366f1', type: 'Type' },
            { name: 'Data Collection', color: '#3b82f6', type: 'Type' },
            { name: 'Analysis', color: '#8b5cf6', type: 'Type' }
        ],
        roles: { manager: 'Advisor', lead: 'Research Lead', resource: 'Researcher' },
        isPremium: false // FREE
    },
    {
        id: 'education-thesis',
        name: 'Thesis/Dissertation',
        category: 'Education',
        description: 'Manage thesis or dissertation writing',
        icon: '🎓',
        columns: [
            { title: 'Proposal', color: '#a78bfa', orderIndex: 0 },
            { title: 'Literature Review', color: '#6366f1', orderIndex: 1 },
            { title: 'Methodology', color: '#3b82f6', orderIndex: 2 },
            { title: 'Data Collection', color: '#8b5cf6', orderIndex: 3 },
            { title: 'Analysis & Writing', color: '#f59e0b', orderIndex: 4 },
            { title: 'Defense', color: '#10b981', orderIndex: 5 }
        ],
        defaultTags: [
            { name: 'Chapter', color: '#3b82f6', type: 'Type' },
            { name: 'Feedback', color: '#f59e0b', type: 'Type' },
            { name: 'Revision', color: '#ef4444', type: 'Type' }
        ],
        roles: { manager: 'Advisor', lead: 'Committee Member', resource: 'Student' },
        isPremium: false // FREE
    },
    {
        id: 'education-online-course',
        name: 'Online Course Creation',
        category: 'Education',
        description: 'Create and launch online courses',
        icon: '💻',
        columns: [
            { title: 'Outline', color: '#a78bfa', orderIndex: 0 },
            { title: 'Recording', color: '#3b82f6', orderIndex: 1 },
            { title: 'Editing', color: '#8b5cf6', orderIndex: 2 },
            { title: 'Platform Setup', color: '#f59e0b', orderIndex: 3 },
            { title: 'Launched', color: '#10b981', orderIndex: 4 }
        ],
        defaultTags: [
            { name: 'Video', color: '#ef4444', type: 'Type' },
            { name: 'Quiz', color: '#3b82f6', type: 'Type' },
            { name: 'Resource', color: '#10b981', type: 'Type' }
        ],
        roles: { manager: 'Course Creator', lead: 'Instructor', resource: 'Assistant' },
        isPremium: false // FREE
    },
    {
        id: 'education-student-assignments',
        name: 'Student Assignments',
        category: 'Education',
        description: 'Track student homework and grading',
        icon: '📝',
        columns: [
            { title: 'Assigned', color: '#6366f1', orderIndex: 0 },
            { title: 'In Progress', color: '#3b82f6', orderIndex: 1 },
            { title: 'Submitted', color: '#f59e0b', orderIndex: 2 },
            { title: 'Graded', color: '#10b981', orderIndex: 3 }
        ],
        defaultTags: [
            { name: 'Essay', color: '#3b82f6', type: 'Type' },
            { name: 'Problem Set', color: '#8b5cf6', type: 'Type' },
            { name: 'Project', color: '#f59e0b', type: 'Type' }
        ],
        roles: { manager: 'Teacher', lead: 'TA', resource: 'Student' },
        isPremium: false // FREE
    }
];

// ==========================================
// TECH TEMPLATES (1 free, 4 premium)
// ==========================================

export const TECH_TEMPLATES: BoardTemplate[] = [
    {
        id: 'tech-software-development',
        name: 'Software Development (Agile)',
        category: 'Tech',
        description: 'Agile development workflow for software teams',
        icon: '💻',
        columns: [
            { title: 'Backlog', color: '#94a3b8', orderIndex: 0 },
            { title: 'Sprint Ready', color: '#6366f1', orderIndex: 1 },
            { title: 'In Progress', color: '#3b82f6', orderIndex: 2 },
            { title: 'Code Review', color: '#8b5cf6', orderIndex: 3 },
            { title: 'Testing', color: '#f59e0b', orderIndex: 4 },
            { title: 'Done', color: '#10b981', orderIndex: 5 }
        ],
        defaultTags: [
            { name: 'Bug', color: '#ef4444', type: 'Type' },
            { name: 'Feature', color: '#3b82f6', type: 'Type' },
            { name: 'Tech Debt', color: '#f59e0b', type: 'Type' }
        ],
        roles: { manager: 'Product Manager', lead: 'Tech Lead', resource: 'Developer' },
        isPremium: false // FREE
    },
    {
        id: 'tech-bug-tracking',
        name: 'Bug Tracking',
        category: 'Tech',
        description: 'Track and fix software bugs',
        icon: '🐛',
        columns: [
            { title: 'Reported', color: '#ef4444', orderIndex: 0 },
            { title: 'Confirmed', color: '#f59e0b', orderIndex: 1 },
            { title: 'In Progress', color: '#3b82f6', orderIndex: 2 },
            { title: 'Fixed', color: '#10b981', orderIndex: 3 },
            { title: 'Verified', color: '#94a3b8', orderIndex: 4 }
        ],
        defaultTags: [
            { name: 'Critical', color: '#ef4444', type: 'Priority' },
            { name: 'High', color: '#f59e0b', type: 'Priority' },
            { name: 'Low', color: '#10b981', type: 'Priority' }
        ],
        roles: { manager: 'QA Manager', lead: 'QA Lead', resource: 'Developer' },
        isPremium: false // FREE
    },
    {
        id: 'tech-devops-pipeline',
        name: 'DevOps Pipeline',
        category: 'Tech',
        description: 'Manage infrastructure and deployment tasks',
        icon: '⚙️',
        columns: [
            { title: 'Planned', color: '#6366f1', orderIndex: 0 },
            { title: 'Development', color: '#3b82f6', orderIndex: 1 },
            { title: 'Testing', color: '#f59e0b', orderIndex: 2 },
            { title: 'Staging', color: '#8b5cf6', orderIndex: 3 },
            { title: 'Production', color: '#10b981', orderIndex: 4 }
        ],
        defaultTags: [
            { name: 'Infrastructure', color: '#3b82f6', type: 'Type' },
            { name: 'CI/CD', color: '#8b5cf6', type: 'Type' },
            { name: 'Monitoring', color: '#f59e0b', type: 'Type' }
        ],
        roles: { manager: 'DevOps Manager', lead: 'DevOps Lead', resource: 'DevOps Engineer' },
        isPremium: false // FREE
    },
    {
        id: 'tech-product-roadmap',
        name: 'Product Roadmap',
        category: 'Tech',
        description: 'Plan product features and releases',
        icon: '🗺️',
        columns: [
            { title: 'Ideas', color: '#a78bfa', orderIndex: 0 },
            { title: 'Research', color: '#6366f1', orderIndex: 1 },
            { title: 'Planned', color: '#3b82f6', orderIndex: 2 },
            { title: 'In Dev', color: '#8b5cf6', orderIndex: 3 },
            { title: 'Released', color: '#10b981', orderIndex: 4 }
        ],
        defaultTags: [
            { name: 'Q1', color: '#3b82f6', type: 'Custom' },
            { name: 'Q2', color: '#8b5cf6', type: 'Custom' },
            { name: 'Q3', color: '#f59e0b', type: 'Custom' }
        ],
        roles: { manager: 'Product Manager', lead: 'Product Lead', resource: 'Product Owner' },
        isPremium: false // FREE
    },
    {
        id: 'tech-api-development',
        name: 'API Development',
        category: 'Tech',
        description: 'Build and document APIs',
        icon: '🔌',
        columns: [
            { title: 'Design', color: '#a78bfa', orderIndex: 0 },
            { title: 'Development', color: '#3b82f6', orderIndex: 1 },
            { title: 'Testing', color: '#f59e0b', orderIndex: 2 },
            { title: 'Documentation', color: '#8b5cf6', orderIndex: 3 },
            { title: 'Deployed', color: '#10b981', orderIndex: 4 }
        ],
        defaultTags: [
            { name: 'REST', color: '#3b82f6', type: 'Type' },
            { name: 'GraphQL', color: '#8b5cf6', type: 'Type' },
            { name: 'WebSocket', color: '#f59e0b', type: 'Type' }
        ],
        roles: { manager: 'API Lead', lead: 'Backend Lead', resource: 'Developer' },
        isPremium: false // FREE
    }
];

// ==========================================
// ALL TEMPLATES (25 total: 5 free, 20 premium)
// ==========================================

export const ALL_TEMPLATES: BoardTemplate[] = [
    ...BUSINESS_TEMPLATES,
    ...CREATIVE_TEMPLATES,
    ...PERSONAL_TEMPLATES,
    ...EDUCATION_TEMPLATES,
    ...TECH_TEMPLATES
];

// Helper functions
export const getTemplatesByCategory = (category: BoardTemplate['category']) => {
    return ALL_TEMPLATES.filter(t => t.category === category);
};

export const getTemplateById = (id: string) => {
    return ALL_TEMPLATES.find(t => t.id === id);
};

export const getFreeTemplates = () => {
    return ALL_TEMPLATES.filter(t => !t.isPremium);
};

export const getPremiumTemplates = () => {
    return ALL_TEMPLATES.filter(t => t.isPremium);
};
