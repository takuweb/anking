import React, { useState, useMemo, useRef } from 'react';
import { Card } from '../types';
import { MarkdownView } from './MarkdownView';
import { getTodayDateString } from '../utils/sm2';
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  Download,
  Upload,
  Filter,
  ArrowUpDown,
  Tag,
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  Smartphone,
} from 'lucide-react';

interface CardListProps {
  cards: Card[];
  onOpenCreateModal: () => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (id: string) => void;
  onImportCards: (cards: Card[]) => void;
  onExportCards: () => void;
  onOpenSyncModal: () => void;
}

export const CardList: React.FC<CardListProps> = ({
  cards,
  onOpenCreateModal,
  onEditCard,
  onDeleteCard,
  onImportCards,
  onExportCards,
  onOpenSyncModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'new' | 'learning' | 'mastered'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'dueDate' | 'interval' | 'repetition'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = getTodayDateString();

  // すべてのタグ一覧を抽出
  const allTags = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [cards]);

  // フィルタリングとソート
  const filteredCards = useMemo(() => {
    return cards
      .filter((card) => {
        // 検索クエリ
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchFront = card.front.toLowerCase().includes(q);
          const matchBack = card.back.toLowerCase().includes(q);
          const matchTag = card.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchFront && !matchBack && !matchTag) return false;
        }

        // タグフィルター
        if (selectedTag !== 'all' && !card.tags.includes(selectedTag)) {
          return false;
        }

        // ステータスフィルター
        if (statusFilter === 'due') {
          if (card.dueDate > today) return false;
        } else if (statusFilter === 'new') {
          if (card.repetition !== 0 || card.lastReviewed !== null) return false;
        } else if (statusFilter === 'learning') {
          if ((card.repetition === 0 && card.lastReviewed === null) || card.interval >= 21) return false;
        } else if (statusFilter === 'mastered') {
          if (card.interval < 21) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'updated') {
          diff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        } else if (sortBy === 'dueDate') {
          diff = a.dueDate.localeCompare(b.dueDate);
        } else if (sortBy === 'interval') {
          diff = b.interval - a.interval;
        } else if (sortBy === 'repetition') {
          diff = b.repetition - a.repetition;
        }

        return sortOrder === 'asc' ? -diff : diff;
      });
  }, [cards, searchQuery, selectedTag, statusFilter, sortBy, sortOrder, today]);

  // JSONインポート処理
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          onImportCards(json);
          alert(`${json.length} 件のカードを読み込みました！`);
        } else {
          alert('有効なJSON配列形式ではありません。');
        }
      } catch (err) {
        alert('ファイルの解析に失敗しました。正しいJSONファイルを選択してください。');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getCardStatusBadge = (card: Card) => {
    const isDue = card.dueDate <= today;
    const isNew = card.repetition === 0 && card.lastReviewed === null;
    const isMastered = card.interval >= 21;

    if (isDue) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
          本日復習
        </span>
      );
    }
    if (isNew) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200 dark:border-sky-900">
          新規未学習
        </span>
      );
    }
    if (isMastered) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
          マスター済み
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
        定着進行中
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* 上部ヘッダー & アクションボタン */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">カード管理・自由記述</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            暗記カードの作成・編集・Markdown記述・タグ整理を行えます（全 {cards.length} 件）
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* インポート (隠しinput) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 sm:px-3 sm:py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
            title="JSONからカードを復元"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">インポート</span>
          </button>

          {/* エクスポート */}
          <button
            onClick={onExportCards}
            className="p-2 sm:px-3 sm:py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
            title="JSONバックアップをダウンロード"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">エクスポート</span>
          </button>

          {/* スマホ同期 */}
          <button
            onClick={onOpenSyncModal}
            className="p-2 sm:px-3 sm:py-2 text-xs font-semibold rounded-xl border border-brand-200 dark:border-brand-900 bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 text-brand-700 dark:text-brand-300 transition flex items-center gap-1.5"
            title="スマホとPCのデータ引き継ぎ (QR/コード)"
          >
            <Smartphone className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span className="hidden sm:inline">スマホ同期</span>
          </button>

          {/* 新規カード作成ボタン */}
          <button
            onClick={onOpenCreateModal}
            className="flex-1 sm:flex-none px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-md shadow-brand-500/20 transition active:scale-95 flex items-center justify-center gap-1.5 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>新規カード作成</span>
          </button>
        </div>
      </div>

      {/* 検索 & フィルターバー */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        {/* 検索窓 */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="表面・裏面・タグを全文検索..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              クリア
            </button>
          )}
        </div>

        {/* フィルター＆ソートコントロール */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          {/* ステータスフィルター */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              状態:
            </span>
            {[
              { id: 'all', label: 'すべて' },
              { id: 'due', label: '本日復習' },
              { id: 'new', label: '未学習' },
              { id: 'learning', label: '定着中' },
              { id: 'mastered', label: 'マスター' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-lg transition font-medium ${
                  statusFilter === f.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* ソートセレクタ */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" />
              並び替え:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 outline-none text-xs"
            >
              <option value="updated">更新日時順</option>
              <option value="dueDate">次回复習日順</option>
              <option value="interval">復習間隔（日数）順</option>
              <option value="repetition">反復回数順</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              title={sortOrder === 'asc' ? '昇順' : '降順'}
            >
              {sortOrder === 'asc' ? '▲ 昇順' : '▼ 降順'}
            </button>
          </div>
        </div>

        {/* タグチップリスト */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 overflow-x-auto text-xs pb-1">
            <span className="text-slate-400 flex items-center gap-1 text-[11px] whitespace-nowrap">
              <Tag className="w-3 h-3" />
              タグ:
            </span>
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap transition ${
                selectedTag === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              すべて
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? 'all' : tag)}
                className={`px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap transition ${
                  selectedTag === tag
                    ? 'bg-brand-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-brand-50 hover:text-brand-600'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* カード一覧グリッド */}
      {filteredCards.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">条件に一致するカードがありません</h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">検索条件を変更するか、新しいカードを作成してください。</p>
          <button
            onClick={onOpenCreateModal}
            className="px-5 py-2.5 bg-brand-600 text-white font-semibold rounded-xl text-xs hover:bg-brand-500 transition shadow-md shadow-brand-500/20"
          >
            新規カードを作成
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCards.map((card) => {
            return (
              <div
                key={card.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* ヘッダー: ステータス ＆ アクション */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getCardStatusBadge(card)}
                      {card.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditCard(card)}
                        className="p-1.5 text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="編集"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('このカードを削除してもよろしいですか？')) {
                            onDeleteCard(card.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 表面（問題） */}
                  <div className="mb-3">
                    <span className="text-[10px] font-bold uppercase text-brand-600 dark:text-brand-400 tracking-wider">
                      表面 (Question)
                    </span>
                    <div className="mt-1 text-slate-900 dark:text-slate-100 font-medium text-sm line-clamp-3">
                      <MarkdownView content={card.front} />
                    </div>
                  </div>

                  {/* 裏面（解答） */}
                  {card.back && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                        裏面 (Answer)
                      </span>
                      <div className="mt-1 text-slate-600 dark:text-slate-300 text-xs line-clamp-3">
                        <MarkdownView content={card.back} />
                      </div>
                    </div>
                  )}
                </div>

                {/* フッター: SM-2 間隔情報 */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>次回: {card.dueDate}</span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span>間隔: {card.interval}日</span>
                  </div>
                  <span>反復: {card.repetition}回</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
