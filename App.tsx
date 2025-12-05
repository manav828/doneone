import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Board } from './components/Board';
import { AdminPanel } from './components/AdminPanel';
import { HistoryPage } from './components/HistoryPage';
import { ReportsPage } from './components/ReportsPage';
import { Guide } from './components/Guide';
import { Login } from './Login';
import { useStore } from './store';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const { init, currentUser, isLoading, tasks, projects } = useStore();

  useEffect(() => {
    init();

    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Poll for Reminders
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      const now = Date.now();
      tasks.forEach(task => {
        if (task.reminderAt && !task.description?.includes("[Notified]")) {
          if (task.reminderAt <= now && task.reminderAt > now - 60000) {
            // Send Notification
            if (Notification.permission === 'granted') {
              new Notification(`Task Reminder: ${task.title}`, {
                body: `This task is due now!`,
                icon: 'icon128.png'
              });
            }
          }
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [tasks, currentUser]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-gray-900 text-primary">
        <Loader2 size={48} className="animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Board />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
