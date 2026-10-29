import React from 'react';
import { Card, DeckStats } from '../types';
import { Brain, Award, Clock, Flame, BarChart3, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

interface StatsViewProps {
  cards: Card[];
  stats: DeckStats;
  onResetToSample: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  cards,
  stats,
  onResetToSample,
}) => {
  // 記憶定着段階の分類
  const stageNew = cards.filter((c) => c.repetition === 0 && c.lastReviewed === null).length;
  const stageEarly = cards.filter((c) => c.interval > 0 && c.interval <= 7).length;
  const stageMid = cards.filter((c) => c.interval > 7 && c.interval < 21).length;
  const stageMastered = cards.filter((c) => c.interval >= 21).length;

  const total = cards.length || 1;
  const percentNew = Math.round((stageNew / total) * 100);
  const percentEarly = Math.round((stageEarly / total) * 100);
  const percentMid = Math.round((stageMid / total) * 100);
  const percentMastered = Math.round((stageMastered / total) * 100);

  // 全履歴の集計
  let countAgain = 0;
  let countHard = 0;
  let countGood = 0;
  let countEasy = 0;
  let totalReviews = 0;

  cards.forEach((card) => {
    (card.history || []).forEach((h) => {
      totalReviews++;
      if (h.grade === 'again') countAgain++;
      else if (h.grade === 'hard') countHard++;
      else if (h.grade === 'good') countGood++;
      else if (h.grade === 'easy') countEasy++;
    });
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">学習統計 & 忘却曲線分析</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          記憶の定着ステージの可視化と、間隔反復アルゴリズムの効果を分析します
        </p>
      </div>

      {/* 記憶定着ステージの内訳 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2 flex items-center gap-2">
          <Brain className="w-5 h-5 text-brand-500" />
          <span>記憶の定着ステージ分布</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          間隔反復を重ねることで、カードは「新規」から「初期定着」「中期定着」を経て、21日以上の「長期記憶マスター」へと昇格します。
        </p>

        {/* スタックバー */}
        <div className="w-full h-5 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 mb-6">
          <div
            style={{ width: `${percentMastered}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`長期定着マスター: ${stageMastered}枚 (${percentMastered}%)`}
          />
          <div
            style={{ width: `${percentMid}%` }}
            className="bg-blue-500 transition-all duration-500"
            title={`中期定着 (8~20日): ${stageMid}枚 (${percentMid}%)`}
          />
          <div
            style={{ width: `${percentEarly}%` }}
            className="bg-amber-500 transition-all duration-500"
            title={`初期定着 (1~7日): ${stageEarly}枚 (${percentEarly}%)`}
          />
          <div
            style={{ width: `${percentNew}%` }}
            className="bg-slate-400 transition-all duration-500"
            title={`未学習: ${stageNew}枚 (${percentNew}%)`}
          />
        </div>

        {/* 凡例 & カードグリッド */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              長期マスター (21日+)
            </div>
            <p className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-2">{stageMastered} 枚</p>
            <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">{percentMastered}%</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              中期定着 (8〜20日)
            </div>
            <p className="text-2xl font-black text-blue-800 dark:text-blue-300 mt-2">{stageMid} 枚</p>
            <span className="text-[11px] text-blue-600/80 dark:text-blue-400/80">{percentMid}%</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              初期定着 (1〜7日)
            </div>
            <p className="text-2xl font-black text-amber-800 dark:text-amber-300 mt-2">{stageEarly} 枚</p>
            <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80">{percentEarly}%</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              未学習カード
            </div>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-2">{stageNew} 枚</p>
            <span className="text-[11px] text-slate-500">{percentNew}%</span>
          </div>
        </div>
      </div>

      {/* 復習履歴の回答傾向 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          <span>これまでの回答傾向・品質評価</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          総復習回数: <strong className="text-slate-800 dark:text-white">{totalReviews} 回</strong>
        </p>

        {totalReviews === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            まだ学習セッションの履歴がありません。学習を開始するとここに実績が反映されます。
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">もう一度</span>
              <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">{countAgain} 回</p>
              <span className="text-[11px] text-slate-400">{Math.round((countAgain / totalReviews) * 100)}%</span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">難しい</span>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{countHard} 回</p>
              <span className="text-[11px] text-slate-400">{Math.round((countHard / totalReviews) * 100)}%</span>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">普通</span>
              <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">{countGood} 回</p>
              <span className="text-[11px] text-slate-400">{Math.round((countGood / totalReviews) * 100)}%</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">簡単</span>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{countEasy} 回</p>
              <span className="text-[11px] text-slate-400">{Math.round((countEasy / totalReviews) * 100)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* サンプルデータリセットエリア */}
      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-slate-500" />
            サンプルデータの復元
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            アプリの初期サンプルカード（忘却曲線、JavaScript、英語など）を再ロードします（現在のデータは上書きされます）。
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm('初期サンプルデータにリセットしますか？作成したカードは消去されます。')) {
              onResetToSample();
            }
          }}
          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
        >
          サンプルデータを復元
        </button>
      </div>
    </div>
  );
};
