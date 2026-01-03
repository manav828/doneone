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
import { Loader2, Clock } from 'lucide-react';
import { CustomAlert } from './components/CustomAlert';
import { WelcomeModal } from './components/WelcomeModal';
import { PricingModal } from './components/PricingModal';
import { CheckoutPage } from './components/CheckoutPage';
import BillingPage from './components/BillingPage';
import LandingPage from './components/landing/LandingPage';
import { WorkspaceSettings } from './components/WorkspaceSettings';

const App: React.FC = () => {
  const { init, currentUser, isLoading, tasks, projects } = useStore();
  const [showLoginForm, setShowLoginForm] = React.useState(false);

  useEffect(() => {
    init();

    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    // Check for Welcome Modal (First Time Trial)
    const hasSeenWelcome = localStorage.getItem('doneone_welcome_seen');
    if (!hasSeenWelcome && currentUser && currentUser.createdAt) {
      // Only show if account is created recently (e.g. within last 24 hours) OR just trust the flag?
      // Let's check if they are in trial.
      const isTrial = (Date.now() - currentUser.createdAt < 30 * 24 * 60 * 60 * 1000) && !currentUser.premiumUntil;
      if (isTrial) {
        setShowWelcome(true);
        localStorage.setItem('doneone_welcome_seen', 'true');
      }
    }
  }, []); // Run only on mount

  const [showWelcome, setShowWelcome] = React.useState(false);
  const { isPricingModalOpen, setPricingModalOpen } = useStore();

  // Poll for Reminders
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      const now = Date.now();
      tasks.forEach(task => {
        if (task.reminderAt && !task.description?.includes("[Notified]")) {
          if (task.reminderAt <= now && task.reminderAt > now - 60000) {
            // Send Notification ONLY if tasked to me or in reminder list
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

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-gray-900 text-primary">
        <Loader2 size={48} className="animate-spin" />
      </div>
    );
  }

  // Show Login form if user clicked login/register from landing page
  if (!currentUser && showLoginForm) {
    return <Login />;
  }

  // Show Landing Page when not logged in
  if (!currentUser) {
    return (
      <LandingPage
        onLogin={() => setShowLoginForm(true)}
        onRegister={() => setShowLoginForm(true)}
      />
    );
  }

  return (
    <Router>
      <CustomAlert />
      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
      {/* PricingModal is also in TopBar, but having it here handles global store state triggers better if TopBar unmounts? TopBar is always mounted in Layout. 
          However, TopBar has the local import. UseStore state is global.
          TopBar renders it. Only ONE instance should render. 
          I added it to TopBar in previous step. 
          If I add it here, I might duplicate it?
          Wait, TopBar IS inside Layout.
          Let's NOT add PricingModal here if TopBar has it.
          Check Logic: I edited TopBar to render PricingModal based on isPricingModalOpen.
          So I don't need it here.
      */}
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
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/workspace" element={<WorkspaceSettings />} />
            <Route path="/workspace/:teamId" element={<WorkspaceSettings />} />
          </Routes>
        )}
      </Layout>
    </Router>
  );
};

export default App;
