import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ArchiveSettingsModal } from './ArchiveSettingsModal';
import { MobileSidebarDrawer } from './MobileSidebarDrawer';
import { BottomNav } from './BottomNav';
import { useStore } from '../store';
import { useIsMobile } from '../hooks/useMediaQuery';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { themeMode } = useStore();
  const [isArchiveSettingsOpen, setIsArchiveSettingsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

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
      {/* Desktop Sidebar - Hidden on mobile */}
      {!isMobile && <Sidebar />}

      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <MobileSidebarDrawer
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        >
          <Sidebar />
        </MobileSidebarDrawer>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <TopBar onMenuClick={() => setIsMobileSidebarOpen(true)} />
        <main className={`flex-1 overflow-hidden relative ${isMobile ? 'mb-16' : ''}`}>
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && <BottomNav />}
      </div>

      <ArchiveSettingsModal
        isOpen={isArchiveSettingsOpen}
        onClose={() => setIsArchiveSettingsOpen(false)}
      />
    </div>
  );
};