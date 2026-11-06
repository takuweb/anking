import React from 'react';
import {
  Brain,
  LayoutDashboard,
  Layers,
  GraduationCap,
  BarChart3,
  Moon,
  Sun,
  Plus,
  Smartphone,
  Lock,
  User,
  Cloud,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { CloudUser, SyncState } from '../utils/cloudAuth';

interface NavbarProps {
  currentTab: 'dashboard' | 'cards' | 'study' | 'stats';
  onSelectTab: (tab: 'dashboard' | 'cards' | 'study' | 'stats') => void;
  dueCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenCreateModal: () => void;
  onOpenSyncModal: () => void;
  onLockApp: () => void;
  currentUser: CloudUser | null;
  syncState: SyncState;
  onOpenAccountModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  dueCount,
  darkMode,
  onToggleDarkMode,
  onOpenCreateModal,
  onOpenSyncModal,
  onLockApp,
  currentUser,
  syncState,
  onOpenAccountModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
              RemindFlow
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300 font-bold uppercase tracking-wider">
                SM-2
              </span>
            </span>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'dashboard'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>ダッシュボード</span>
          </button>

          <button
            onClick={() => onSelectTab('cards')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'cards'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>カード管理</span>
          </button>

          <button
            onClick={() => onSelectTab('study')}
            className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'study'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>学習セッション</span>
            {dueCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse">
                {dueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('stats')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'stats'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>統計 & 分析</span>
          </button>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* User Account / Cloud Sync Button */}
          {currentUser ? (
            <button
              onClick={onOpenAccountModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 dark:hover:bg-brand-900/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-bold transition group"
              title="アカウント設定 & クラウド同期"
            >
              <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-black">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[80px] sm:max-w-[120px] truncate">{currentUser.username}</span>
              {syncState === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-500" />
              ) : syncState === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              )}
            </button>
          ) : (
            <button
              onClick={onOpenAccountModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
              title="アカウントにログイン / 新規登録（複数端末で自動同期）"
            >
              <User className="w-3.5 h-3.5 text-brand-500" />
              <span className="hidden sm:inline">ログイン</span>
            </button>
          )}

          {/* Quick Create Card Button */}
          <button
            onClick={onOpenCreateModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-sm shadow-brand-500/20 transition active:scale-95"
            title="新しいカードを作成"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>作成</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={darkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Lock App Button */}
          <button
            onClick={onLockApp}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            title="画面をロック"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium transition ${
            currentTab === 'dashboard'
              ? 'text-brand-600 dark:text-brand-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>ホーム</span>
        </button>

        <button
          onClick={() => onSelectTab('cards')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium transition ${
            currentTab === 'cards'
              ? 'text-brand-600 dark:text-brand-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>カード</span>
        </button>

        {/* Center Quick Add Mobile Button */}
        <button
          onClick={onOpenCreateModal}
          className="p-2.5 -mt-5 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30 active:scale-95 transition"
          title="新規作成"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenAccountModal}
          className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium text-slate-500 dark:text-slate-400"
          title="アカウント同期"
        >
          <Cloud className={`w-4 h-4 ${currentUser ? 'text-brand-500' : ''}`} />
          <span>{currentUser ? currentUser.username : 'ログイン'}</span>
        </button>

        <button
          onClick={() => onSelectTab('study')}
          className={`relative flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium transition ${
            currentTab === 'study'
              ? 'text-brand-600 dark:text-brand-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>学習</span>
          {dueCount > 0 && (
            <span className="absolute -top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
              {dueCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
