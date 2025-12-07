import React, { useState } from 'react';
import { ALL_TEMPLATES, BoardTemplate, getTemplatesByCategory } from '../templates/templates';

interface TemplateSelectorProps {
    onSelectTemplate: (template: BoardTemplate) => void;
    onClose: () => void;
    userIsPremium: boolean;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelectTemplate, onClose, userIsPremium }) => {
    const [activeCategory, setActiveCategory] = useState<BoardTemplate['category']>('Business');
    const [searchQuery, setSearchQuery] = useState('');

    const categories: BoardTemplate['category'][] = ['Business', 'Creative', 'Personal', 'Education', 'Tech'];

    const filteredTemplates = getTemplatesByCategory(activeCategory).filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectTemplate = (template: BoardTemplate) => {
        // Since all templates are now free, we removed the premium check, 
        // but keeping logic here just in case we need it later or if data isn't reloaded yet.
        if (template.isPremium && !userIsPremium) {
            alert('This is a premium template. Please upgrade to use it.');
            return;
        }
        onSelectTemplate(template);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose a Template</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>

                {/* Category Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700 px-6">
                    <div className="flex gap-2 overflow-x-auto">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeCategory === category
                                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Templates Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTemplates.map(template => (
                            <div
                                key={template.id}
                                onClick={() => handleSelectTemplate(template)}
                                className={`relative p-5 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${template.isPremium && !userIsPremium
                                    ? 'border-gray-200 dark:border-gray-700 opacity-75'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400'
                                    }`}
                            >
                                {/* Premium Badge */}
                                {template.isPremium && (
                                    <div className="absolute top-3 right-3">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                                            🔒 Premium
                                        </span>
                                    </div>
                                )}

                                {/* Icon & Title */}
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="text-3xl">{template.icon}</div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{template.name}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
                                    </div>
                                </div>

                                {/* Columns Preview */}
                                <div className="flex flex-wrap gap-1 mt-4">
                                    {template.columns.slice(0, 4).map((col, idx) => (
                                        <span
                                            key={idx}
                                            className="text-xs px-2 py-1 rounded"
                                            style={{ backgroundColor: col.color + '20', color: col.color }}
                                        >
                                            {col.title}
                                        </span>
                                    ))}
                                    {template.columns.length > 4 && (
                                        <span className="text-xs px-2 py-1 text-gray-500">+{template.columns.length - 4}</span>
                                    )}
                                </div>

                                {/* Tags Count */}
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                                    {template.defaultTags.length} default tags
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredTemplates.length === 0 && (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            No templates found. Try a different search term.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
