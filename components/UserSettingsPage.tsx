import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import type { ApiKey } from '../store';
import {
  User, Settings, Key, Bell, Shield, ArrowLeft, Copy, Trash2,
  Plus, Eye, EyeOff, Crown, Lock, Moon, Sun, Volume2, VolumeX,
  CheckCircle, AlertTriangle, ExternalLink, Loader2, RefreshCw
} from 'lucide-react';

type SettingsTab = 'profile' | 'preferences' | 'api-keys' | 'notifications' | 'privacy';

export const UserSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser, updateUserProfile, canAccessPremium, uploadFile,
    apiKeys, generateApiKey, listApiKeys, revokeApiKey,
    themeMode, setThemeMode, signOut
  } = useStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [nameInput, setNameInput] = useState(currentUser?.name ?? '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPremium = canAccessPremium();

  useEffect(() => {
    if (currentUser) setNameInput(currentUser.name);
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === 'api-keys' && isPremium) {
      listApiKeys();
    }
  }, [activeTab, isPremium]);

  if (!currentUser) return null;

  // ============================================================
  // Handlers
  // ============================================================
  const handleSaveName = async () => {
    if (!nameInput.trim() || nameInput === currentUser.name) return;
    setIsSavingName(true);
    await updateUserProfile(currentUser.id, { name: nameInput.trim() });
    setIsSavingName(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const url = await uploadFile(file);
    if (url) await updateUserProfile(currentUser.id, { avatar_url: url } as any);
    setIsUploading(false);
  };

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) return;
    setIsGenerating(true);
    const plainKey = await generateApiKey(newKeyName.trim());
    if (plainKey) setRevealedKey(plainKey);
    setNewKeyName('');
    setIsGenerating(false);
  };

  const handleCopyKey = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleRevokeKey = async (keyId: string) => {
    await revokeApiKey(keyId);
    setShowDeleteConfirm(null);
    if (revealedKey) setRevealedKey(null);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // ============================================================
  // Tab Sidebar
  // ============================================================
  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode; premiumOnly?: boolean }[] = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'preferences', label: 'Preferences', icon: <Settings size={16} /> },
    { id: 'api-keys', label: 'API Keys', icon: <Key size={16} />, premiumOnly: true },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'privacy', label: 'Privacy & Data', icon: <Shield size={16} /> }
  ];

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage your account and preferences</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0">
          <nav className="space-y-1 sticky top-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${activeTab === tab.id
                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                {tab.icon}
                {tab.label}
                {tab.premiumOnly && (
                  <span className={`ml-auto flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md
                    ${isPremium ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-400'}`}>
                    <Crown size={8} />
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Profile Information</h2>
                <p className="text-xs text-slate-500 mt-0.5">Update your name and avatar</p>
              </div>
              <div className="p-6 space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-5">
                  <div
                    className="relative w-20 h-20 rounded-2xl cursor-pointer group ring-4 ring-slate-100 dark:ring-slate-700 overflow-hidden shadow-md"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      {isUploading
                        ? <Loader2 size={20} className="text-white animate-spin" />
                        : <span className="text-white text-xs font-medium">Change</span>
                      }
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Profile Photo</p>
                    <p className="text-xs text-slate-500 mt-0.5">Click to upload. JPG, PNG up to 5MB</p>
                    <div className="flex gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] rounded-md uppercase font-bold tracking-wider">
                        {currentUser.role}
                      </span>
                      {isPremium && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400 text-[10px] rounded-md uppercase font-bold tracking-wider">
                          <Crown size={8} /> Premium
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Display Name</label>
                  <div className="flex gap-2">
                    <input
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                      className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      placeholder="Your name"
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={isSavingName || nameInput === currentUser.name}
                      className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {isSavingName ? <Loader2 size={14} className="animate-spin" /> : null}
                      Save
                    </button>
                  </div>
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Email Address</label>
                  <input
                    value={currentUser.email ?? ''}
                    readOnly
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1">Email cannot be changed here. Contact support.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── PREFERENCES TAB ── */}
          {activeTab === 'preferences' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Preferences</h2>
                <p className="text-xs text-slate-500 mt-0.5">Customize your DoneOne experience</p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {/* Theme */}
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {themeMode === 'dark' ? <Moon size={18} className="text-slate-500" /> : <Sun size={18} className="text-yellow-500" />}
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">Theme</p>
                      <p className="text-xs text-slate-500">{themeMode === 'dark' ? 'Dark mode active' : 'Light mode active'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                      ${themeMode === 'dark' ? 'bg-primary' : 'bg-slate-300'}`}
                  >
                    <span className={`${themeMode === 'dark' ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
                  </button>
                </div>

                {/* Multiple In Progress */}
                <div className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">Multiple In Progress</p>
                    <p className="text-xs text-slate-500">Allow more than one task in the "In Progress" column</p>
                  </div>
                  <button
                    onClick={() => updateUserProfile(currentUser.id, { allowMultipleInProgress: !currentUser.allowMultipleInProgress })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                      ${currentUser.allowMultipleInProgress ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span className={`${currentUser.allowMultipleInProgress ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
                  </button>
                </div>

                {/* Sound */}
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {currentUser.soundEnabled !== false ? <Volume2 size={18} className="text-slate-500" /> : <VolumeX size={18} className="text-slate-400" />}
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">Sound Effects</p>
                      <p className="text-xs text-slate-500">Play sounds when moving tasks or completing actions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateUserProfile(currentUser.id, { soundEnabled: currentUser.soundEnabled === false ? true : false })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                      ${currentUser.soundEnabled !== false ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span className={`${currentUser.soundEnabled !== false ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── API KEYS TAB ── */}
          {activeTab === 'api-keys' && (
            <>
              {!isPremium ? (
                /* Premium Gate */
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Crown size={28} className="text-white" fill="currentColor" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Premium Feature</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                      API Keys for AI tool integration (Cursor, Cline, Claude Desktop) are available on the Premium plan.
                    </p>
                    <button
                      onClick={() => navigate('/billing')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
                    >
                      <Crown size={16} fill="currentColor" />
                      Upgrade to Premium
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Info Banner */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <Key size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Connect AI Tools to DoneOne</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        Generate an API key and paste it into Cursor, Cline, or Claude Desktop to control DoneOne with AI.
                        <a href="/help#mcp" className="underline ml-1">Setup guide →</a>
                      </p>
                    </div>
                  </div>

                  {/* Revealed Key Alert */}
                  {revealedKey && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-sm font-semibold text-green-800 dark:text-green-300">Your new API key — copy it now!</span>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-400 mb-3">
                        This key will not be shown again. Store it somewhere safe.
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-white dark:bg-slate-800 border border-green-300 dark:border-green-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 dark:text-white overflow-x-auto">
                          {revealedKey}
                        </code>
                        <button
                          onClick={() => handleCopyKey(revealedKey, 'new')}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex-shrink-0"
                          title="Copy key"
                        >
                          {copiedKeyId === 'new' ? <CheckCircle size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                      <button
                        onClick={() => setRevealedKey(null)}
                        className="mt-3 text-xs text-green-700 dark:text-green-400 underline"
                      >
                        I've saved it, dismiss this
                      </button>
                    </div>
                  )}

                  {/* Generate New Key */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white">Generate API Key</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Maximum 5 active keys per account</p>
                    </div>
                    <div className="p-6 flex gap-3">
                      <input
                        value={newKeyName}
                        onChange={e => setNewKeyName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleGenerateKey()}
                        placeholder='Key name e.g. "Cursor MCP"'
                        className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                      <button
                        onClick={handleGenerateKey}
                        disabled={isGenerating || !newKeyName.trim() || apiKeys.length >= 5}
                        className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        Generate Key
                      </button>
                    </div>
                  </div>

                  {/* Keys List */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Active Keys</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{apiKeys.length} / 5 keys used</p>
                      </div>
                      <button
                        onClick={() => listApiKeys()}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Refresh"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>

                    {apiKeys.length === 0 ? (
                      <div className="p-12 text-center">
                        <Key size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">No API keys yet. Generate one above to get started.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {apiKeys.map(key => (
                          <div key={key.id} className="px-6 py-4 flex items-center gap-4">
                            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                              <Key size={16} className="text-slate-500 dark:text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 dark:text-white">{key.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <code className="text-xs text-slate-400 font-mono">{key.keyPrefix}••••••••••••</code>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="text-xs text-slate-400">Created {formatDate(key.createdAt)}</span>
                                {key.lastUsedAt && (
                                  <>
                                    <span className="text-slate-300 dark:text-slate-600">•</span>
                                    <span className="text-xs text-slate-400">Last used {formatDate(key.lastUsedAt)}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Revoke */}
                            {showDeleteConfirm === key.id ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-red-600 font-medium">Revoke?</span>
                                <button onClick={() => handleRevokeKey(key.id)} className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors">Yes</button>
                                <button onClick={() => setShowDeleteConfirm(null)} className="text-xs px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-300 transition-colors">No</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowDeleteConfirm(key.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Revoke key"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Config Guide */}
                  <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-6 border border-slate-700">
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3">Config for Cursor / Cline / Claude Desktop</p>
                    <pre className="text-xs text-green-400 font-mono leading-relaxed overflow-x-auto whitespace-pre">
{`{
  "mcpServers": {
    "doneone": {
      "type": "http",
      "url": "https://mcp.doneone.app",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}`}
                    </pre>
                    <a
                      href="/help#mcp"
                      className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-4 transition-colors"
                    >
                      <ExternalLink size={12} /> Full setup guide
                    </a>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── NOTIFICATIONS TAB ── */}
          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Notification Preferences</h2>
                <p className="text-xs text-slate-500 mt-0.5">Control what you get notified about</p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {[
                  { label: 'Task assignments', desc: 'When someone assigns a task to you', enabled: true },
                  { label: 'Task reminders', desc: 'When a reminder you set is due', enabled: true },
                  { label: 'Mentions', desc: 'When someone mentions you in a task', enabled: true },
                  { label: 'Project updates', desc: 'When project settings change', enabled: false }
                ].map(item => (
                  <div key={item.label} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <button
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.enabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                      <span className={`${item.enabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PRIVACY TAB ── */}
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Privacy & Data</h2>
                </div>
                <div className="p-6 space-y-4">
                  <button
                    onClick={() => navigate('/billing-history')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">View Billing History</span>
                    <ExternalLink size={14} className="text-slate-400" />
                  </button>
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Data</p>
                    <p className="text-xs text-slate-500">To request a full data export or account deletion, please contact support via "My Support Tickets".</p>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900/50 overflow-hidden">
                <div className="px-6 py-5 border-b border-red-100 dark:border-red-900/30">
                  <h2 className="text-base font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
                </div>
                <div className="p-6">
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
