import React, { useState } from 'react';
import { Card } from '../types';
import {
  CloudUser,
  loginToCloud,
  registerToCloud,
  logoutFromCloud,
  SyncState,
} from '../utils/cloudAuth';
import {
  X,
  User,
  Lock,
  Cloud,
  CheckCircle2,
  RefreshCw,
  LogOut,
  AlertCircle,
  Database,
  ArrowRight,
} from 'lucide-react';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CloudUser | null;
  syncState: SyncState;
  onLoginSuccess: (user: CloudUser, cloudCards: Card[] | null) => void;
  onLogout: () => void;
  onManualSync: () => Promise<void>;
  localCards: Card[];
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  syncState,
  onLoginSuccess,
  onLogout,
  onManualSync,
  localCards,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSyncingNow, setIsSyncingNow] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (tab === 'login') {
        const result = await loginToCloud(username, password);
        // ログイン成功後、クラウドからデータを取得する
        const cardsRes = await fetch('/api/cards', {
          headers: { Authorization: `Bearer ${result.token}` },
        });
        const cardsData = await cardsRes.json().catch(() => ({}));
        onLoginSuccess(result.user, cardsData.cards || null);
        onClose();
      } else {
        // 新規登録時、現在のローカルカードをクラウドの初期データとして引き継ぐ
        const result = await registerToCloud(username, password, localCards);
        onLoginSuccess(result.user, localCards);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || '認証エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncClick = async () => {
    setIsSyncingNow(true);
    try {
      await onManualSync();
    } catch (err: any) {
      alert(err.message || '同期エラーが発生しました');
    } finally {
      setIsSyncingNow(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {currentUser ? 'アカウント & クラウド同期' : 'ユーザーアカウント'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentUser
                  ? 'PC・スマホ間でカードを自動リアルタイム同期中'
                  : 'ログインすると複数端末で常に最新データを自動共有'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {currentUser ? (
            /* ログイン中画面 */
            <div className="space-y-6">
              {/* ユーザー情報カード */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-brand-950/40 dark:to-indigo-950/20 border border-brand-200 dark:border-brand-900/40">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                      {currentUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {currentUser.username}
                      </h4>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Vercel Postgres クラウド保存中
                      </span>
                    </div>
                  </div>

                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ログイン中</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-brand-200/60 dark:border-brand-900/40 text-slate-600 dark:text-slate-400">
                  <span>同期ステータス:</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                    {syncState === 'syncing' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>クラウド同期中...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>クラウド自動同期中</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* 操作ボタン */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleSyncClick}
                  disabled={isSyncingNow}
                  className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-md shadow-brand-500/20 flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingNow ? 'animate-spin' : ''}`} />
                  <span>{isSyncingNow ? '最新データを確認中...' : '今すぐ最新データと同期'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('ログアウトしますか？')) {
                      logoutFromCloud();
                      onLogout();
                      onClose();
                    }
                  }}
                  className="w-full py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 text-slate-600 dark:text-slate-400 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ログアウト</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                PCやスマホで同じユーザー名でログインすると、カードの追加や復習の進捗がすべて全自動で同期されます。
              </p>
            </div>
          ) : (
            /* 未ログイン（ログイン / 新規登録）画面 */
            <div>
              {/* Tab Selector */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setErrorMessage(null);
                  }}
                  className={`py-2 rounded-lg transition ${
                    tab === 'login'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  ログイン
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setErrorMessage(null);
                  }}
                  className={`py-2 rounded-lg transition ${
                    tab === 'register'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  新規登録
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    ユーザー名（例: user1）
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="user1"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    パスワード
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <span>{errorMessage}</span>
                      {errorMessage.includes('Postgres') && (
                        <div className="mt-1.5 pt-1.5 border-t border-rose-200 dark:border-rose-800/60 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <Database className="w-3.5 h-3.5 text-brand-500" />
                          <span>Vercel画面の [Storage] タブで Postgres を接続してください</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{tab === 'login' ? 'ログインして同期開始' : 'アカウントを作成して同期開始'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center">
                ※ 登録すると、現在の暗記カードがそのままクラウドに安全に引き継がれます。
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
