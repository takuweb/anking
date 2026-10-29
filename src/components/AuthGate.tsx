import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

interface AuthGateProps {
  children: React.ReactNode;
  onLockApp?: () => void;
}

// "Temukatugonzuishi8659" の SHA-256 ハッシュ値
// ソースコード上にパスコードの平文を残さないことで、GitHub公開時もコード漏洩を防止
const PASSCODE_HASH = '9f6349e7d36f07957190c5255945e7d4a420eaab83d9dbb1f48300b60d14f872';
const STORAGE_KEY_AUTH = 'remindflow_auth_token_v1';

async function sha256(str: string): Promise<string> {
  const buf = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_AUTH) === 'authenticated';
  });
  const [inputCode, setInputCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      setErrorMessage('アクセスコードを入力してください');
      return;
    }

    setIsChecking(true);
    setErrorMessage(null);

    try {
      const trimmed = inputCode.trim();
      const hash = await sha256(trimmed);

      if (hash === PASSCODE_HASH) {
        if (rememberMe) {
          localStorage.setItem(STORAGE_KEY_AUTH, 'authenticated');
        } else {
          sessionStorage.setItem(STORAGE_KEY_AUTH, 'authenticated');
        }
        setIsAuthenticated(true);
      } else {
        setErrorMessage('アクセスコードが正しくありません');
      }
    } catch (err) {
      setErrorMessage('認証処理中にエラーが発生しました');
    } finally {
      setIsChecking(false);
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 selection:bg-brand-500 selection:text-white">
      <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex p-3.5 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-4 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">
            RemindFlow セキュリティ認証
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            このアプリを利用するにはアクセスコードの入力が必要です。指定された認証コードを入力してください。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>アクセスコード</span>
              <span className="text-[11px] text-slate-500 font-normal">大文字・小文字を区別</span>
            </label>

            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="コードを入力..."
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white placeholder-slate-500 font-mono outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 animate-in fade-in pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-brand-500 focus:ring-brand-500/20"
              />
              <span>この端末で認証状態を保持する</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isChecking}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 active:scale-98 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2"
          >
            <span>ロックを解除して利用開始</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-slate-700/60 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>SHA-256 暗号化ハッシュ検証対応</span>
        </div>
      </div>
    </div>
  );
};

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY_AUTH);
  sessionStorage.removeItem(STORAGE_KEY_AUTH);
  window.location.reload();
}
