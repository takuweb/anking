import React, { useState, useEffect, useMemo } from 'react';
import { Card, DeckStats } from './types';
import {
  loadCards,
  saveCards,
  calculateDeckStats,
  recordStudyActivity,
  exportCardsAsJson,
  INITIAL_SAMPLE_CARDS,
} from './utils/storage';
import { getTodayDateString } from './utils/sm2';
import { mergeCards, decompressCards, pullDataFromSyncServer } from './utils/sync';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CardList } from './components/CardList';
import { StudySession } from './components/StudySession';
import { StatsView } from './components/StatsView';
import { CardEditorModal } from './components/CardEditorModal';
import { DeviceSyncModal } from './components/DeviceSyncModal';
import { logout } from './components/AuthGate';

export const App: React.FC = () => {
  const [cards, setCards] = useState<Card[]>(() => loadCards());
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'cards' | 'study' | 'stats'>('dashboard');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  // 学習セッション設定
  const [studyFilter, setStudyFilter] = useState<'due' | 'new' | 'all' | 'tag'>('due');
  const [studyTag, setStudyTag] = useState<string | undefined>(undefined);

  // ダークモード
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('remindflow_dark_mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // ダークモード変更時のDOM反映
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('remindflow_dark_mode', String(darkMode));
  }, [darkMode]);

  // URLパラメーターからの自動引き継ぎ検知
  useEffect(() => {
    const checkUrlParams = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const syncCode = urlParams.get('sync_code');

        if (syncCode) {
          if (confirm(`引き継ぎコード [${syncCode}] が検出されました。データを取り込みますか？`)) {
            const pulled = await pullDataFromSyncServer(syncCode);
            handleImportSyncedCards(pulled, true);
            alert(`${pulled.length} 件のカードを取り込みました！`);
            // URLパラメータをクリア
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          return;
        }

        const hash = window.location.hash;
        if (hash.startsWith('#data=')) {
          const compressed = hash.replace('#data=', '');
          const decompressed = decompressCards(compressed);
          if (decompressed && decompressed.length > 0) {
            if (confirm(`引き継ぎデータ（${decompressed.length}件）が検出されました。データを取り込みますか？`)) {
              handleImportSyncedCards(decompressed, true);
              alert(`${decompressed.length} 件のカードを取り込みました！`);
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        }
      } catch (err) {
        console.error('Auto sync check error:', err);
      }
    };

    checkUrlParams();
  }, []);

  // カード変更時の永続化
  const handleUpdateCards = (newCards: Card[]) => {
    setCards(newCards);
    saveCards(newCards);
  };

  // 端末同期によるインポート
  const handleImportSyncedCards = (importedCards: Card[], merge: boolean) => {
    if (merge) {
      const merged = mergeCards(cards, importedCards);
      handleUpdateCards(merged);
    } else {
      handleUpdateCards(importedCards);
    }
  };

  // 統計情報計算
  const deckStats: DeckStats = useMemo(() => {
    return calculateDeckStats(cards);
  }, [cards]);

  // すべてのタグ一覧
  const existingTags = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [cards]);

  // 学習対象カードの抽出
  const studySessionCards = useMemo(() => {
    const today = getTodayDateString();

    if (studyFilter === 'due') {
      const due = cards.filter((c) => c.dueDate <= today);
      if (due.length > 0) return due;
      return cards.filter((c) => c.repetition === 0);
    } else if (studyFilter === 'new') {
      return cards.filter((c) => c.repetition === 0 && c.lastReviewed === null);
    } else if (studyFilter === 'tag' && studyTag) {
      return cards.filter((c) => c.tags.includes(studyTag));
    } else {
      return cards;
    }
  }, [cards, studyFilter, studyTag]);

  // 学習開始アクション
  const handleStartStudy = (filterType: 'due' | 'new' | 'all' | 'tag', tag?: string) => {
    setStudyFilter(filterType);
    setStudyTag(tag);
    setCurrentTab('study');
  };

  // カード作成・編集保存
  const handleSaveCard = (cardData: Partial<Card>) => {
    if (editingCard) {
      const updated = cards.map((c) => (c.id === editingCard.id ? ({ ...c, ...cardData } as Card) : c));
      handleUpdateCards(updated);
    } else {
      const newCard = cardData as Card;
      handleUpdateCards([newCard, ...cards]);
    }
    setEditingCard(null);
  };

  // カード削除
  const handleDeleteCard = (cardId: string) => {
    const updated = cards.filter((c) => c.id !== cardId);
    handleUpdateCards(updated);
  };

  // 学習セッション完了ハンドラ
  const handleFinishStudySession = (updatedReviewedCards: Card[]) => {
    const map = new Map<string, Card>(updatedReviewedCards.map((c) => [c.id, c]));
    const newCards = cards.map((c) => (map.has(c.id) ? map.get(c.id)! : c));

    recordStudyActivity();
    handleUpdateCards(newCards);
    setCurrentTab('dashboard');
  };

  // サンプルデータへのリセット
  const handleResetToSample = () => {
    handleUpdateCards(INITIAL_SAMPLE_CARDS);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* ナビゲーションバー */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        dueCount={deckStats.dueCards}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenCreateModal={() => {
          setEditingCard(null);
          setIsEditorOpen(true);
        }}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onLockApp={logout}
      />

      {/* メインコンテンツエリア */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {currentTab === 'dashboard' && (
          <Dashboard
            cards={cards}
            stats={deckStats}
            onStartStudy={handleStartStudy}
            onOpenCreateModal={() => {
              setEditingCard(null);
              setIsEditorOpen(true);
            }}
            onNavigateToCards={() => setCurrentTab('cards')}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
          />
        )}

        {currentTab === 'cards' && (
          <CardList
            cards={cards}
            onOpenCreateModal={() => {
              setEditingCard(null);
              setIsEditorOpen(true);
            }}
            onEditCard={(card) => {
              setEditingCard(card);
              setIsEditorOpen(true);
            }}
            onDeleteCard={handleDeleteCard}
            onImportCards={(imported) => handleImportSyncedCards(imported, true)}
            onExportCards={() => exportCardsAsJson(cards)}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
          />
        )}

        {currentTab === 'study' && (
          <div>
            {studySessionCards.length === 0 ? (
              <div className="max-w-md mx-auto text-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                <span className="text-4xl mb-4 block">🎉</span>
                <h3 className="text-xl font-bold mb-2">学習対象のカードがありません</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  今日の復習期日のカードはすべて復習済みです。新しいカードを作成するか、全カードの任意復習を行いましょう。
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => handleStartStudy('all')}
                    className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-500 transition"
                  >
                    全カードから復習
                  </button>
                  <button
                    onClick={() => {
                      setEditingCard(null);
                      setIsEditorOpen(true);
                    }}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    新規カードを作成
                  </button>
                </div>
              </div>
            ) : (
              <StudySession
                cards={studySessionCards}
                onFinishSession={handleFinishStudySession}
                onExit={() => setCurrentTab('dashboard')}
                onEditCard={(card) => {
                  setEditingCard(card);
                  setIsEditorOpen(true);
                }}
              />
            )}
          </div>
        )}

        {currentTab === 'stats' && (
          <StatsView
            cards={cards}
            stats={deckStats}
            onResetToSample={handleResetToSample}
          />
        )}
      </main>

      {/* カード作成・編集モーダル */}
      <CardEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveCard}
        initialCard={editingCard}
        existingTags={existingTags}
      />

      {/* 端末間データ引き継ぎモーダル */}
      <DeviceSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        cards={cards}
        onImportCards={handleImportSyncedCards}
      />
    </div>
  );
};

export default App;
