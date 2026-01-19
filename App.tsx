import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Board } from './components/Board';
import { AdminPanel } from './components/AdminPanel';
import { HistoryPage } from './components/HistoryPage';
import { ReportsPage } from './components/ReportsPage';
import { Guide } from './components/Guide';
import { Login } from './Login';
import { useStore } from './store';
import { Loader2, Clock } from 'lucide-react';
import { CustomAlert } from './components/CustomAlert';
import { WelcomeModal } from './components/WelcomeModal';
import { PricingModal } from './components/PricingModal';
import { CheckoutPage } from './components/CheckoutPage';
import BillingPage from './components/BillingPage';
import ComparePlansPage from './components/ComparePlansPage';
import LandingPage from './components/landing/LandingPage';
import { WorkspaceSettings } from './components/WorkspaceSettings';
import { TermsPage } from './components/TermsPage';

// Wrapper component that handles routing logic
const AppRoutes: React.FC = () => {
  const { init, currentUser, isLoading, tasks } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Super Admin Check (Hardcoded for security, matching AdminPanel)
  const isSuperAdmin = currentUser?.email === 'manavss828@gmail.com';

  useEffect(() => {
    init();

    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  const [showWelcome, setShowWelcome] = React.useState(false);
  const { isPricingModalOpen, setPricingModalOpen } = useStore();

  // Check for Welcome Modal (First Time Trial)
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('doneone_welcome_seen');
    if (!hasSeenWelcome && currentUser && currentUser.createdAt) {
      const isTrial = (Date.now() - currentUser.createdAt < 30 * 24 * 60 * 60 * 1000) && !currentUser.premiumUntil;
      if (isTrial) {
        setShowWelcome(true);
        localStorage.setItem('doneone_welcome_seen', 'true');
      }
    }
  }, [currentUser]);

  // Poll for Reminders
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      const now = Date.now();
      tasks.forEach(task => {
        if (task.reminderAt && !task.description?.includes("[Notified]")) {
          if (task.reminderAt <= now && task.reminderAt > now - 60000) {
            const isRecipient = task.assigneeId === currentUser.id || (task.reminderUserIds && task.reminderUserIds.includes(currentUser.id));

            if (isRecipient && Notification.permission === 'granted') {
              new Notification(`Task Reminder: ${task.title}`, {
                body: `Reminder: You set a reminder for this task.`,
                icon: 'icon128.png'
              });
            }
          }
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [tasks, currentUser]);

  // Redirect to dashboard if already logged in and on /auth
  useEffect(() => {
    if (currentUser && location.pathname === '/auth') {
      navigate('/');
    }
  }, [currentUser, location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-gray-900 text-primary">
        <Loader2 size={48} className="animate-spin" />
      </div>
    );
  }

  // Landing page and auth routes (no Layout wrapper)
  if (!currentUser) {
    return (
      <Routes>
        <Route
          path="/auth"
          element={<Login />}
        />
        <Route
          path="*"
          element={
            <LandingPage
              onLogin={() => navigate('/auth')}
              onRegister={() => navigate('/auth')}
            />
          }
        />
      </Routes>
    );
  }

  // Authenticated routes
  return (
    <>
      <CustomAlert />
      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
      <Layout>
        {/* Waiting Screen for Unassigned Users */}
        {useStore.getState().getJoinedTeams().length === 1 && useStore.getState().getJoinedTeams()[0].name === 'Unassigned' ? (
          <div className="flex-1 h-full flex items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900">
            <div className="max-w-md">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Waiting for Department</h2>
              <p className="text-slate-500 mb-6">
                You have joined the company successfully, but haven't been assigned to a department yet.
                <br /><br />
                Please contact your administrator to get access to a workspace.
              </p>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Board />} />
            {/* PROTECTED ADMIN ROUTE */}
            <Route path="/admin" element={isSuperAdmin ? <AdminPanel /> : <Navigate to="/" replace />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/compare" element={<ComparePlansPage />} />
            <Route path="/workspace" element={<WorkspaceSettings />} />
            <Route path="/workspace/:teamId" element={<WorkspaceSettings />} />
            <Route path="/terms" element={<TermsPage />} />
            {/* Redirect /auth to / when logged in */}
            <Route path="/auth" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </Layout>
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;
