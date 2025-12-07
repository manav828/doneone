
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useStore } from './store';
import { FolderKanban, Loader2, Lock } from 'lucide-react';

export const Login: React.FC = () => {
  const { init } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [regOpen, setRegOpen] = useState(true);

  useEffect(() => {
    checkRegStatus();
  }, []);

  const checkRegStatus = async () => {
    const { data } = await supabase.from('system_settings').select('value').eq('key', 'registration_open').single();
    if (data) setRegOpen(data.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let session = null;
      let user = null;

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        session = data.session;
        user = data.user;
      } else {
        if (!regOpen) {
          setError("Registration is currently closed by Admin.");
          setLoading(false);
          return;
        }
        // Sign Up
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (authError) throw authError;

        user = authData.user;
        session = authData.session;

        // Handle case where signUp was successful but no session returned (auto-confirm might be off, or just delay)
        if (user && !session) {
          // Attempt immediate sign-in to force a session
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (!signInError && signInData.session) {
            session = signInData.session;
          }
        }

        // ONLY create profile if we have a valid session (RLS requirement)
        if (user && session) {
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: user.id,
            name: name || email.split('@')[0],
            role: 'Resource', // FIXED: Default role is now Resource
            avatar_url: ''
          });

          if (profileError) {
            console.error("Profile creation failed (ignoring, self-healing will catch it):", profileError);
          }
        } else if (user && !session) {
          // If we still don't have a session, we can't write to DB.
          setError("Account created! Please check your email to confirm, or try logging in.");
          setLoading(false);
          return;
        }
      }

      // Initialize store after successful auth
      if (session) {
        await init();
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-primary rounded-xl text-white mb-3">
            <FolderKanban size={32} />
          </div>
          <h1 className="text-2xl font-bold">FlowBoard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Project Management Extension</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="John Doe"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary outline-none transition-all"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2.5 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary outline-none transition-all"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-medium">
              {error}
            </div>
          )}

          {!isLogin && !regOpen && (
            <div className="p-3 rounded bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 text-xs font-medium flex items-center gap-2">
              <Lock size={14} /> New registration is currently closed by Admin.
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (!isLogin && !regOpen)}
            className="w-full py-2.5 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-semibold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
};
