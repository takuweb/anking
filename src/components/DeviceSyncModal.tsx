import React, { useState, useEffect } from 'react';
import { Card } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import {
  compressCards,
  decompressCards,
  pushDataToSyncServer,
  pullDataFromSyncServer,
} from '../utils/sync';
import {
  X,
  Smartphone,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  Globe2,
  Sparkles,
} from 'lucide-react';

interface DeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Card[];
  onImportCards: (newCards: Card[], merge: boolean) => void;
}

export const DeviceSyncModal: React.FC<DeviceSyncModalProps> = ({
  isOpen,
  onClose,
  cards,
  onImportCards,
}) => {
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');
  const [syncCode, setSyncCode] = useState<string | null>(null);
  const [codeExpiresIn, setCodeExpiresIn] = useState<number>(0);
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [compressedText, setCompressedText] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // 受信側ステート
  const [inputCode, setInputCode] = useState('');
  const [inputText, setInputText] = useState('');
  const [isReceiving, setIsReceiving] = useState(false);
  const [mergeOption, setMergeOption] = useState<'merge' | 'overwrite'>('merge');

  // モーダルが開いたときの初期化
  useEffect(() => {
    if (isOpen) {
      const comp = compressCards(cards);
      setCompressedText(comp);
      generateSyncCode();
    }
  }, [isOpen]);

  // カウントダウンタイマー
  useEffect(() => {
    if (codeExpiresIn <= 0) return;
    const timer = setInterval(() => {
      setCodeExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [codeExpiresIn]);

  if (!isOpen) return null;

  // 送信用6桁コードを発行（グローバルリレーで別Wi-Fi・4G回線も対応）
  const generateSyncCode = async () => {
    setIsLoadingCode(true);
    try {
      const res = await pushDataToSyncServer(cards);
      setSyncCode(res.code);
      setCodeExpiresIn(res.expiresIn);
    } catch (err: any) {
      console.warn('Sync code generation error:', err);
    } finally {
      setIsLoadingCode(false);
    }
  };

  // クリップボードへコピー
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 6桁コードでデータを受信
  const handleReceiveByCode = async () => {
    if (!inputCode.trim()) {
      alert('6桁の引き継ぎコードを入力してください');
      return;
    }
    setIsReceiving(true);
    try {
      const pulledCards = await pullDataFromSyncServer(inputCode);
      onImportCards(pulledCards, mergeOption === 'merge');
      alert(`${pulledCards.length} 件の暗記カードを引き継ぎました！`);
      onClose();
    } catch (err: any) {
      alert(err.message || 'データの受信に失敗しました。コードをご確認ください。');
    } finally {
      setIsReceiving(false);
    }
  };

  // テキストコードから復元
  const handleReceiveByText = () => {
    if (!inputText.trim()) {
      alert('引き継ぎコードを貼り付けてください');
      return;
    }
    const decompressed = decompressCards(inputText);
    if (!decompressed || decompressed.length === 0) {
      alert('無効な引き継ぎコードです。正しいコードを貼り付けてください。');
      return;
    }
    onImportCards(decompressed, mergeOption === 'merge');
    alert(`${decompressed.length} 件の暗記カードを引き継ぎました！`);
    onClose();
  };

  // QRコードに埋め込むURL
  const currentOrigin = window.location.origin;
  const syncUrlWithCode = syncCode ? `${currentOrigin}?sync_code=${syncCode}` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                端末間データ引き継ぎ (スマホ ⇄ PC)
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                  <Globe2 className="w-3 h-3" />
                  別Wi-Fi・4G回線も対応
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                アカウント不要！6桁コードかQRコードでどこからでもデータを引き継げます
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

        {/* Send / Receive Main Tab Switcher */}
        <div className="grid grid-cols-2 p-2 bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition ${
              activeTab === 'send'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>この端末から送る（引き継ぎ元）</span>
          </button>

          <button
            onClick={() => setActiveTab('receive')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition ${
              activeTab === 'receive'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>この端末で受け取る（引き継ぎ先）</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: SEND (この端末から送る) */}
          {activeTab === 'send' && (
            <div className="space-y-5 text-center">
              <div className="p-5 bg-gradient-to-b from-brand-50/60 to-slate-50 dark:from-brand-950/20 dark:to-slate-800/30 border border-brand-200 dark:border-brand-900/40 rounded-2xl space-y-4">
                <span className="text-xs text-brand-700 dark:text-brand-300 font-semibold block">
                  別の端末で下記の6桁コードを入力するか、スマホの標準カメラでスキャン
                </span>

                {/* 6桁コードの大きな表示 */}
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">
                    ワンタイム引き継ぎコード (30分間有効)
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-4xl sm:text-5xl font-black tracking-widest text-brand-600 dark:text-brand-400 px-5 py-2.5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-brand-200 dark:border-brand-800 shadow-sm">
                      {syncCode || '------'}
                    </span>
                    <button
                      onClick={generateSyncCode}
                      disabled={isLoadingCode}
                      className="p-3 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition"
                      title="新しいコードを再発行"
                    >
                      <RefreshCw className={`w-5 h-5 ${isLoadingCode ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  {codeExpiresIn > 0 && (
                    <span className="text-[11px] text-slate-400 mt-2 font-mono">
                      有効期限: 残り {Math.floor(codeExpiresIn / 60)}分 {codeExpiresIn % 60}秒
                    </span>
                  )}
                </div>

                {/* QR Code */}
                {syncUrlWithCode && (
                  <div className="pt-2">
                    <div className="inline-block p-3.5 bg-white rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                      <QRCodeSVG value={syncUrlWithCode} size={160} level="M" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                      スマホの標準カメラアプリでかざすだけで一発起動
                    </p>
                  </div>
                )}
              </div>

              {/* テキストコードのコピー */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-left">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  LINEやメールで送りたい場合:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={compressedText}
                    className="flex-1 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-400 outline-none truncate"
                  />
                  <button
                    onClick={() => handleCopy(compressedText)}
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'コピー済' : 'コードコピー'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RECEIVE (この端末で受け取る) */}
          {activeTab === 'receive' && (
            <div className="space-y-6">
              {/* 6桁コード入力 */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-4">
                <div>
                  <span className="text-sm font-bold text-slate-800 dark:text-white block mb-1">
                    送信側の画面に表示された 6桁コード を入力
                  </span>
                  <span className="text-xs text-slate-500 block">
                    同一Wi-Fiでなくても（4G/5G回線や外出先でも）データを取得できます
                  </span>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="text-center font-mono text-4xl font-black tracking-widest px-4 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-60 mx-auto outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />

                <div>
                  <button
                    onClick={handleReceiveByCode}
                    disabled={isReceiving || inputCode.length !== 6}
                    className="w-full sm:w-auto px-8 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-md shadow-brand-500/20 active:scale-95 flex items-center justify-center gap-2 mx-auto"
                  >
                    {isReceiving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>データ受信中...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>データを取り込む</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* テキストコード貼り付け */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  または、コピーした引き継ぎコードを貼り付け:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="引き継ぎコードを貼り付け..."
                    className="flex-1 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 outline-none focus:border-brand-500"
                  />
                  <button
                    onClick={handleReceiveByText}
                    className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition shrink-0"
                  >
                    取り込む
                  </button>
                </div>
              </div>

              {/* 取り込み時のマージオプション */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">取り込み方法:</span>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mergeOption"
                      checked={mergeOption === 'merge'}
                      onChange={() => setMergeOption('merge')}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      <strong>マージ（推奨）</strong>: 既存カードと統合（更新日時が新しい方を採用）
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mergeOption"
                      checked={mergeOption === 'overwrite'}
                      onChange={() => setMergeOption('overwrite')}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      <strong>上書き</strong>: 現在のデータをすべて置き換える
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>ユーザー認証・会員登録不要（データはブラウザLocalStorageに安全保存）</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
