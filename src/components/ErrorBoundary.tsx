import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center shadow-2xl">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl inline-block mb-4">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold mb-2">画面の表示中に問題が発生しました</h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              ブラウザのデータ不整合またはスクリプトエラーが検知されました。
            </p>

            <div className="p-3 bg-slate-950 rounded-xl text-left font-mono text-[11px] text-rose-300 mb-6 overflow-auto max-h-32">
              {this.state.error?.message || 'Unknown error'}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ページを再読み込み</span>
              </button>

              <button
                onClick={this.handleReset}
                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ストレージを初期化して修復</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
