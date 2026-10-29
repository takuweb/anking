import React from 'react';
import { Card, DeckStats } from '../types';
import { getTodayDateString, addDaysToDate } from '../utils/sm2';
import {
  Flame,
  Brain,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  TrendingUp,
  Tag,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

interface DashboardProps {
  cards: Card[];
  stats: DeckStats;
  onStartStudy: (filterType: 'due' | 'new' | 'all' | 'tag', tag?: string) => void;
  onOpenCreateModal: () => void;
  onNavigateToCards: () => void;
  onOpenSyncModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  cards,
  stats,
  onStartStudy,
  onOpenCreateModal,
  onNavigateToCards,
  onOpenSyncModal,
}) => {
  const today = getTodayDateString();

  // 直近7日間の復習予測（今日〜6日後）
  const upcomingSchedule = Array.from({ length: 7 }).map((_, i) => {
    const targetDate = addDaysToDate(today, i);
    const count = cards.filter((c) => c.dueDate === targetDate).length;
    const dateObj = new Date(targetDate);
    const dayName = i === 0 ? '今日' : i === 1 ? '明日' : `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
    return {
      date: targetDate,
      label: dayName,
      count,
    };
  });

  const maxUpcoming = Math.max(1, ...upcomingSchedule.map((s) => s.count));

  // タグ集計
  const tagCounts: { [tag: string]: number } = {};
  cards.forEach((c) => {
    c.tags.forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* ヒーローセクション: 今日の学習ステータス & CTA */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900 text-white p-8 sm:p-10 shadow-2xl shadow-brand-500/20">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide text-brand-100 mb-4">
            <Brain className="w-3.5 h-3.5" />
            <span>エビングハウスの忘却曲線・間隔反復エンジン</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            {stats.dueCards > 0 ? (
              <>
                今日復習すべきカードが <span className="underline decoration-amber-400 decoration-wavy underline-offset-4">{stats.dueCards} 枚</span> あります！
              </>
            ) : (
              '本日の復習はすべて完了しています！🎉'
            )}
          </h1>

          <p className="text-brand-100 text-sm sm:text-base leading-relaxed mb-8 max-w-xl">
            適切なタイミングで反復することで、忘却曲線を克服し、最小の学習時間で知識を長期記憶へ定着させます。
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {stats.dueCards > 0 ? (
              <button
                onClick={() => onStartStudy('due')}
                className="px-6 py-3.5 bg-white text-brand-700 hover:bg-brand-50 font-bold rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 text-sm sm:text-base group"
              >
                <span>今日の復習を開始する ({stats.dueCards}枚)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : stats.newCards > 0 ? (
              <button
                onClick={() => onStartStudy('new')}
                className="px-6 py-3.5 bg-white text-brand-700 hover:bg-brand-50 font-bold rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 text-sm sm:text-base group"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>新規カードを学習する ({stats.newCards}枚)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={() => onStartStudy('all')}
                className="px-6 py-3.5 bg-white text-brand-700 hover:bg-brand-50 font-bold rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 text-sm sm:text-base group"
              >
                <span>全カードを任意復習する</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            <button
              onClick={onOpenCreateModal}
              className="px-5 py-3.5 bg-brand-500/30 hover:bg-brand-500/40 border border-white/20 text-white font-semibold rounded-2xl backdrop-blur-md transition-all active:scale-95 flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>カードを追加</span>
            </button>

            <button
              onClick={onOpenSyncModal}
              className="px-5 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-2xl backdrop-blur-md transition-all active:scale-95 flex items-center gap-2 text-sm"
              title="スマホとPCのデータ引き継ぎ"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>スマホに引き継ぐ</span>
            </button>
          </div>
        </div>

        {/* 背景装飾 */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none select-none">
          <Brain className="w-96 h-96 text-white" />
        </div>
      </div>

      {/* 4つの主要メトリクスカード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 今日の復習待ち */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">復習待ち</span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.dueCards}</span>
            <span className="text-xs text-slate-400">枚</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">今日までに期日到来</p>
        </div>

        {/* 習得中カード */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">定着中</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.learningCards}</span>
            <span className="text-xs text-slate-400">枚</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">反復学習で定着中</p>
        </div>

        {/* 完全定着 (マスター) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">マスター済み</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.masteredCards}</span>
            <span className="text-xs text-slate-400">枚</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">復習間隔 21日以上</p>
        </div>

        {/* 学習ストリーク */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">連続学習</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-500">{stats.streakDays}</span>
            <span className="text-xs text-slate-400">日連続</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">毎日の習慣化が記憶のカギ</p>
        </div>
      </div>

      {/* 2カラムレイアウト: 忘却曲線の仕組み ＆ 今後の復習スケジュール予測 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 忘却曲線と間隔反復のビジュアル図解 */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <Brain className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  忘却曲線 vs 間隔反復（Spaced Repetition）
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              一度覚えた知識は1日後には約67%忘却されます。しかし、<strong>忘れかけたタイミング（1日後、3日後、7日後...）</strong>で復習を繰り返すと、記憶の忘却速度が大幅に緩やかになり、強固な長期記憶になります。
            </p>

            {/* SVG 忘却曲線比較図 */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                <span>記憶定着率 (%)</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-rose-500">
                    <span className="w-2.5 h-0.5 bg-rose-500 inline-block"></span>復習なし
                  </span>
                  <span className="flex items-center gap-1 text-emerald-500">
                    <span className="w-2.5 h-0.5 bg-emerald-500 inline-block"></span>間隔反復
                  </span>
                </div>
              </div>

              <svg viewBox="0 0 400 160" className="w-full h-36">
                {/* グリッド線 */}
                <line x1="40" y1="20" x2="380" y2="20" stroke="currentColor" strokeDasharray="3 3" className="text-slate-200 dark:text-slate-700" />
                <line x1="40" y1="65" x2="380" y2="65" stroke="currentColor" strokeDasharray="3 3" className="text-slate-200 dark:text-slate-700" />
                <line x1="40" y1="110" x2="380" y2="110" stroke="currentColor" strokeDasharray="3 3" className="text-slate-200 dark:text-slate-700" />
                <line x1="40" y1="140" x2="380" y2="140" stroke="currentColor" className="text-slate-300 dark:text-slate-600" />

                {/* Y軸ラベル */}
                <text x="15" y="24" className="text-[10px] fill-slate-400">100%</text>
                <text x="20" y="69" className="text-[10px] fill-slate-400">50%</text>
                <text x="25" y="114" className="text-[10px] fill-slate-400">20%</text>
                <text x="30" y="144" className="text-[10px] fill-slate-400">0%</text>

                {/* 忘却曲線（復習なし：急激に下降） */}
                <path
                  d="M 40 20 Q 80 110, 380 135"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />

                {/* 間隔反復曲線（反復ごとにベースアップ） */}
                <path
                  d="M 40 20 Q 70 80, 90 90 L 90 25 Q 130 65, 170 70 L 170 25 Q 230 50, 270 50 L 270 25 Q 330 35, 380 35"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                />

                {/* 復習ポイントのマーカー */}
                <circle cx="90" cy="25" r="4" fill="#10b981" />
                <circle cx="170" cy="25" r="4" fill="#10b981" />
                <circle cx="270" cy="25" r="4" fill="#10b981" />

                {/* X軸ラベル */}
                <text x="40" y="154" className="text-[10px] fill-slate-400">初日</text>
                <text x="85" y="154" className="text-[10px] fill-emerald-500 font-bold">1日後</text>
                <text x="165" y="154" className="text-[10px] fill-emerald-500 font-bold">3日後</text>
                <text x="265" y="154" className="text-[10px] fill-emerald-500 font-bold">7日後</text>
                <text x="360" y="154" className="text-[10px] fill-slate-400">30日後</text>
              </svg>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-brand-500" />
            <span>当アプリはSuperMemo SM-2アルゴリズムで個々の定着度に合わせ次回復習日を最適計算します。</span>
          </div>
        </div>

        {/* 今後7日間の復習スケジュール予測グラフ */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Calendar className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  今後7日間の復習予定予測
                </h3>
              </div>
              <span className="text-xs text-slate-400">自動スケジューリング</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
              SM-2アルゴリズムで分散配置された復習カードの枚数です。負荷が集中せず無理なく継続できます。
            </p>

            {/* バーグラフ */}
            <div className="grid grid-cols-7 gap-2 items-end h-40 pt-6 px-2">
              {upcomingSchedule.map((item, idx) => {
                const heightPercent = maxUpcoming > 0 ? Math.round((item.count / maxUpcoming) * 100) : 0;
                const isToday = idx === 0;

                return (
                  <div key={item.date} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 opacity-90 group-hover:scale-110 transition-transform">
                      {item.count}
                    </span>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-xl overflow-hidden flex flex-col justify-end h-28">
                      <div
                        className={`w-full rounded-t-xl transition-all duration-500 ${
                          isToday
                            ? 'bg-rose-500'
                            : item.count > 0
                            ? 'bg-brand-500'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                        style={{ height: `${Math.max(item.count > 0 ? 15 : 4, heightPercent)}%` }}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-medium truncate max-w-full text-center ${
                        isToday ? 'text-rose-500 font-bold' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">登録済み総カード数: <strong className="text-slate-800 dark:text-white">{stats.totalCards} 枚</strong></span>
            <button
              onClick={onNavigateToCards}
              className="text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>一覧・管理へ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* タグ別特訓セクション */}
      {sortedTags.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Tag className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                タグ・ジャンル別集中特訓
              </h3>
            </div>
            <span className="text-xs text-slate-400">クリックしてそのタグのみ学習</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {sortedTags.map(([tag, count]) => (
              <button
                key={tag}
                onClick={() => onStartStudy('tag', tag)}
                className="group flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-brand-50 hover:border-brand-300 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all text-xs font-medium"
              >
                <span>#{tag}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-brand-200 group-hover:text-brand-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition">
                  {count}枚
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
