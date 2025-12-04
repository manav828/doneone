import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ArchiveSettingsModal } from './ArchiveSettingsModal';
import { useStore } from '../store';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { themeMode } = useStore();
  const [isArchiveSettingsOpen, setIsArchiveSettingsOpen] = React.useState(false);

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themeMode]);

  React.useEffect(() => {
    const handleOpenSettings = () => setIsArchiveSettingsOpen(true);
    window.addEventListener('openArchiveSettings', handleOpenSettings);
    return () => window.removeEventListener('openArchiveSettings', handleOpenSettings);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas-light dark:bg-canvas-dark transition-colors duration-200 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <TopBar />
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
      <ArchiveSettingsModal
        isOpen={isArchiveSettingsOpen}
        onClose={() => setIsArchiveSettingsOpen(false)}
      />
    </div>
  );
};