import React, { useState, useEffect, useCallback } from 'react';
import { Card, Grade } from '../types';
import { calculateSM2, getGradeEstimateLabel } from '../utils/sm2';
import { MarkdownView } from './MarkdownView';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Sparkles,
  ArrowRight,
  Edit2,
  X,
  Volume2,
  CheckCircle2,
  Clock,
  Layers,
  Award,
} from 'lucide-react';

interface StudySessionProps {
  cards: Card[];
  onFinishSession: (updatedCards: Card[], results: { again: number; hard: number; good: number; easy: number }) => void;
  onExit: () => void;
  onEditCard: (card: Card) => void;
}

export const StudySession: React.FC<StudySessionProps> = ({
  cards,
  onFinishSession,
  onExit,
  onEditCard,
}) => {
  const [queue, setQueue] = useState<Card[]>(cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [reviewedCards, setReviewedCards] = useState<Card[]>([]);
  const [stats, setStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  const currentCard = queue[currentIndex];

  // キーボードショートカット
  const handleAnswer = useCallback(
    (grade: Grade) => {
      if (!currentCard || !isFlipped) return;

      const sm2Result = calculateSM2(currentCard, grade);
      const updatedCard: Card = {
        ...currentCard,
        repetition: sm2Result.repetition,
        interval: sm2Result.interval,
        easeFactor: sm2Result.easeFactor,
        dueDate: sm2Result.dueDate,
        lastReviewed: new Date().toISOString(),
        history: [
          ...(currentCard.history || []),
          {
            date: new Date().toISOString(),
            grade,
            interval: sm2Result.interval,
            easeFactor: sm2Result.easeFactor,
          },
        ],
      };

      setStats((prev) => ({
        ...prev,
        [grade]: prev[grade] + 1,
      }));

      // 「もう一度 (Again)」の場合、セッションの最後に再度出題キューへ追加するか？
      // 間隔反復の効果として、今日中に再学習できるようキュー末尾に追加する動作
      if (grade === 'again') {
        setQueue((prevQueue) => [...prevQueue, updatedCard]);
      }

      setReviewedCards((prev) => {
        // 重複を除いて最新の状態で更新
        const filtered = prev.filter((c) => c.id !== updatedCard.id);
        return [...filtered, updatedCard];
      });

      // 次のカードへ
      if (currentIndex + 1 < queue.length) {
        setIsFlipped(false);
        setCurrentIndex((prev) => prev + 1);
      } else {
        // 完了！
        setSessionCompleted(true);
        triggerConfetti();
      }
    },
    [currentCard, isFlipped, currentIndex, queue.length]
  );

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore if canvas-confetti fails
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 入力フォーム等の場合は除外
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (!isFlipped) {
          setIsFlipped(true);
        }
      } else if (isFlipped) {
        if (e.key === '1') {
          e.preventDefault();
          handleAnswer('again');
        } else if (e.key === '2') {
          e.preventDefault();
          handleAnswer('hard');
        } else if (e.key === '3') {
          e.preventDefault();
          handleAnswer('good');
        } else if (e.key === '4') {
          e.preventDefault();
          handleAnswer('easy');
        }
      }

      if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, handleAnswer, onExit]);

  // 音声読み上げ（Web Speech API）
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // マークダウン記号などを簡単に除去
      const cleanText = text.replace(/[#*`_[\]()]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = /[a-zA-Z]{4,}/.test(cleanText) ? 'en-US' : 'ja-JP';
      window.speechSynthesis.speak(utterance);
    }
  };

  // セッション完了画面
  if (sessionCompleted || queue.length === 0) {
    const totalAnswered = stats.again + stats.hard + stats.good + stats.easy;
    const rememberedCount = stats.good + stats.easy;
    const accuracy = totalAnswered > 0 ? Math.round((rememberedCount / totalAnswered) * 100) : 0;

    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-xl">
          <div className="inline-flex p-4 rounded-3xl bg-amber-100 dark:bg-amber-950/50 text-amber-500 mb-6">
            <Award className="w-16 h-16 animate-bounce" />
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
            学習セッション完了！
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            忘却曲線のタイミングに合わせた復習が記録されました。記憶の定着が着実に進んでいます！
          </p>

          {/* セッション統計グリッド */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 text-center">
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">もう一度</span>
              <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">{stats.again}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 text-center">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">難しい</span>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{stats.hard}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-4 text-center">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">普通</span>
              <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">{stats.good}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4 text-center">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">簡単</span>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{stats.easy}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-8">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">合計回答数</span>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{totalAnswered} 回</p>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">定着率 (普通・簡単)</span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{accuracy}%</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onFinishSession(reviewedCards, stats)}
              className="w-full sm:w-auto px-8 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>ダッシュボードに戻る</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round((currentIndex / queue.length) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
          <span>中断して戻る (Esc)</span>
        </button>

        {/* Progress Display */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Layers className="w-4 h-4 text-brand-500" />
            <span>
              {currentIndex + 1} / {queue.length} 枚
            </span>
          </div>
          <div className="w-28 sm:w-36 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Edit Current Card Button */}
        <button
          onClick={() => onEditCard(currentCard)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          title="このカードを編集"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">編集</span>
        </button>
      </div>

      {/* Main Flashcard Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden transition-all duration-300">
        {/* Card Header (Tags & Interval Badge) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 text-xs">
          <div className="flex flex-wrap gap-1.5">
            {currentCard.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-full font-medium bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-200 dark:border-brand-900"
              >
                #{tag}
              </span>
            ))}
            {currentCard.tags.length === 0 && (
              <span className="text-slate-400 italic">タグなし</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {currentCard.repetition === 0
                ? '新規カード'
                : `間隔: ${currentCard.interval}日 (反復: ${currentCard.repetition}回)`}
            </span>
          </div>
        </div>

        {/* Question Area (Front) */}
        <div className="p-8 sm:p-10 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500"></span>
              問題 (Question)
            </span>
            <button
              onClick={() => handleSpeak(currentCard.front)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="読み上げ"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <div className="min-h-[100px] text-lg sm:text-xl text-slate-900 dark:text-slate-100 font-medium">
            <MarkdownView content={currentCard.front} />
          </div>
        </div>

        {/* Answer Area (Back) or "Show Answer" Prompt */}
        {!isFlipped ? (
          <div className="p-8 sm:p-12 text-center bg-slate-50/50 dark:bg-slate-900/50">
            <button
              onClick={() => setIsFlipped(true)}
              className="w-full max-w-sm py-4 px-6 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition-all duration-200 active:scale-98 flex items-center justify-center gap-2 mx-auto text-base group"
            >
              <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
              <span>答えを表示 (Space)</span>
            </button>
            <p className="text-xs text-slate-400 mt-3">頭の中で答えを思い浮かべてから確認しましょう</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Back (Answer Content) */}
            <div className="p-8 sm:p-10 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  解答・解説 (Answer)
                </span>
                <button
                  onClick={() => handleSpeak(currentCard.back)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="読み上げ"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="min-h-[80px] text-slate-800 dark:text-slate-200">
                <MarkdownView content={currentCard.back || '（解答・解説の登録がありません）'} />
              </div>
            </div>

            {/* 4-grade Rating Buttons */}
            <div className="p-6 bg-white dark:bg-slate-900">
              <p className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
                記憶の定着度を選択してください（数字キー 1〜4 でも回答可能）
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. もう一度 (Again) */}
                <button
                  onClick={() => handleAnswer('again')}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 transition-all active:scale-95 group"
                >
                  <span className="text-xs text-rose-500/80 font-mono mb-0.5">キー 1</span>
                  <span className="text-sm font-bold">もう一度</span>
                  <span className="text-[11px] font-medium text-rose-600/70 dark:text-rose-400/70 mt-1">
                    {getGradeEstimateLabel(currentCard, 'again')}
                  </span>
                </button>

                {/* 2. 難しい (Hard) */}
                <button
                  onClick={() => handleAnswer('hard')}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 transition-all active:scale-95 group"
                >
                  <span className="text-xs text-amber-500/80 font-mono mb-0.5">キー 2</span>
                  <span className="text-sm font-bold">難しい</span>
                  <span className="text-[11px] font-medium text-amber-600/70 dark:text-amber-400/70 mt-1">
                    {getGradeEstimateLabel(currentCard, 'hard')}
                  </span>
                </button>

                {/* 3. 普通 (Good) */}
                <button
                  onClick={() => handleAnswer('good')}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 transition-all active:scale-95 group"
                >
                  <span className="text-xs text-blue-500/80 font-mono mb-0.5">キー 3</span>
                  <span className="text-sm font-bold">普通</span>
                  <span className="text-[11px] font-medium text-blue-600/70 dark:text-blue-400/70 mt-1">
                    {getGradeEstimateLabel(currentCard, 'good')}
                  </span>
                </button>

                {/* 4. 簡単 (Easy) */}
                <button
                  onClick={() => handleAnswer('easy')}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 transition-all active:scale-95 group"
                >
                  <span className="text-xs text-emerald-500/80 font-mono mb-0.5">キー 4</span>
                  <span className="text-sm font-bold">簡単</span>
                  <span className="text-[11px] font-medium text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                    {getGradeEstimateLabel(currentCard, 'easy')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Helpful Shortcuts Reminder */}
      <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-600 dark:text-slate-400">
        <span>ショートカット:</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px]">Space</kbd> 答え表示
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px]">1 - 4</kbd> 定着度評価
        </span>
      </div>
    </div>
  );
};
