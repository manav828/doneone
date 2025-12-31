
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useStore } from './store';
import { Loader2, Lock, Mail, User, Eye, EyeOff, Check, ArrowRight, Zap, Clock, Users, Shield } from 'lucide-react';

export const Login: React.FC = () => {
  const { init } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [regOpen, setRegOpen] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    checkRegStatus();
  }, []);

  const checkRegStatus = async () => {
    const { data } = await supabase.from('system_settings').select('value').eq('key', 'registration_open').single();
    if (data) setRegOpen(data.value);
  };

  const hasMinLength = password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let session = null;
      let user = null;

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        session = data.session;
        user = data.user;
      } else {
        if (!regOpen) {
          setError("Registration is currently closed.");
          setLoading(false);
          return;
        }
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;

        user = authData.user;
        session = authData.session;

        if (user && !session) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (!signInError && signInData.session) session = signInData.session;
        }

        if (user && session) {
          // Create profile with email, 30-day premium trial, and all required fields
          await supabase.from('profiles').upsert({
            id: user.id,
            name: name || email.split('@')[0],
            email: email, // FIXED: Include email in profile
            role: 'Resource',
            avatar_url: '',
            is_premium: true, // FIXED: Enable 30-day trial
            premium_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            max_projects: 0,
            max_leads: 0,
            max_resources: 0,
            notifications_enabled: true,
            reminders_enabled: true,
            time_tracking_enabled: true,
            image_upload_enabled: true,
            max_attachments_per_task: 0
          });
        } else if (user && !session) {
          setError("Account created! Check your email to confirm.");
          setLoading(false);
          return;
        }
      }

      if (session) await init();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Left Side - Form */}
      <div className="w-full lg:w-[45%] flex flex-col px-8 lg:px-12 xl:px-16 py-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <a href="/" className="cursor-pointer">
            <img src="/logo.png" alt="DoneOne" className="h-9 w-auto hover:opacity-80 transition-opacity" />
          </a>
          <div className="text-sm text-slate-500">
            {isLogin ? "New here? " : "Have an account? "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          {/* Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-sm text-slate-500">
              {isLogin ? 'Enter your credentials to continue' : 'Start your free trial today'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm"
                  placeholder="Full Name"
                  required={!isLogin}
                />
                {name && <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
              </div>
            )}

            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm"
                placeholder="Email Address"
                required
              />
              {email && email.includes('@') && <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
            </div>

            <div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm"
                  placeholder="Password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {!isLogin && password && (
                <p className={`text-xs mt-1.5 ${hasMinLength ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {hasMinLength ? '✓ Password is valid' : 'At least 6 characters required'}
                </p>
              )}
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-600 text-xs">
                {error}
              </div>
            )}

            {!isLogin && !regOpen && (
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 text-xs flex items-center gap-1.5">
                <Lock size={12} /> Registration closed
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!isLogin && !regOpen)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : (
                <>{isLogin ? 'Sign In' : 'Create Account'}<ArrowRight size={16} /></>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">or continue with</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Google Login */}
            <button
              type="button"
              onClick={async () => {
                // Use clean origin URL (removes any trailing slashes or paths)
                const redirectUrl = window.location.origin.replace(/\/$/, '');
                await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: redirectUrl
                  }
                });
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </form>

          {/* Footer */}
          <p className="mt-4 text-center text-xs text-slate-400">
            By continuing, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>

      {/* Right Side - Soft Orange Theme */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 50%, #FED7AA 100%)' }}>
        {/* Decorative Circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full" style={{ background: 'rgba(251, 146, 60, 0.15)' }} />
        <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full" style={{ background: 'rgba(249, 115, 22, 0.1)' }} />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 rounded-full" style={{ background: 'rgba(234, 88, 12, 0.08)' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-10 xl:px-16 w-full">
          {/* Feature Cards */}
          <div className="space-y-3 mb-8">
            {/* Stats Card */}
            <div className="bg-white rounded-xl p-4 shadow-lg shadow-orange-100/50 max-w-[240px] ml-auto border border-orange-100/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Zap className="text-orange-500" size={18} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wide">Tasks Done</div>
                  <div className="text-lg font-bold text-slate-800">1,247</div>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className="bg-white rounded-xl p-4 shadow-lg shadow-orange-100/50 max-w-[260px] border border-orange-100/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Shield className="text-emerald-500" size={18} />
                </div>
                <div>
                  <div className="font-medium text-slate-800 text-sm">Secure & Private</div>
                  <div className="text-xs text-slate-500">Your data is encrypted</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Text */}
          <div className="max-w-sm">
            <h2 className="text-2xl xl:text-3xl font-bold text-slate-800 mb-3 leading-tight">
              Project management made simple
            </h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Collaborate with your team, track progress, and deliver projects on time.
            </p>

            {/* Features */}
            <div className="space-y-2">
              {[
                { icon: Users, text: "Team Collaboration" },
                { icon: Clock, text: "Time Tracking" },
                { icon: Zap, text: "Real-time Sync" }
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-orange-100 flex items-center justify-center">
                    <f.icon size={12} className="text-orange-600" />
                  </div>
                  <span className="text-slate-700 text-sm">{f.text}</span>
                </div>
              ))}
            </div>

            {/* Badge */}
            <div className="mt-6 inline-flex items-center gap-1.5 bg-white/80 rounded-full px-3 py-1.5 border border-orange-200/50">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-slate-600 text-xs font-medium">30-Day Free Trial</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
