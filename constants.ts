
import { Tag } from './types';

// Default tags to seed for new users if needed, or just UI constants
export const DEFAULT_TAGS: Tag[] = [
  { id: 't1', name: 'High', color: '#ef4444', type: 'Priority' },
  { id: 't2', name: 'Medium', color: '#f59e0b', type: 'Priority' },
  { id: 't3', name: 'Low', color: '#10b981', type: 'Priority' },
  { id: 't4', name: 'Bug', color: '#ec4899', type: 'Type' },
  { id: 't5', name: 'Feature', color: '#3b82f6', type: 'Type' },
  { id: 't6', name: 'Meeting', color: '#8b5cf6', type: 'Type' },
  { id: 't7', name: 'Call', color: '#10b981', type: 'Type' },
  { id: 't8', name: 'Discussion', color: '#f59e0b', type: 'Type' },
];
