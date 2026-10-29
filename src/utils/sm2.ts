import { Card, Grade } from '../types';

/**
 * 今日の日付を YYYY-MM-DD 形式で取得（ローカルタイム基準）
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 基準日に指定した日数を足した YYYY-MM-DD 形式の日付を返す
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const parts = dateStr.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * カードが今日復習すべき期日を迎えているか判定
 */
export function isCardDueToday(card: Card, todayStr: string = getTodayDateString()): boolean {
  // 未学習カードはdueDateに関わらず復習期日とは区別できるが、学習対象
  return card.dueDate <= todayStr;
}

/**
 * カードが未学習（まだ一度も復習したことがない）か判定
 */
export function isNewCard(card: Card): boolean {
  return card.repetition === 0 && card.lastReviewed === null;
}

export interface NextReviewCalculation {
  repetition: number;
  interval: number;
  easeFactor: number;
  dueDate: string;
}

/**
 * SM-2アルゴリズムに基づいて、選択されたGradeに応じた次回のパラメータを計算
 */
export function calculateSM2(card: Card, grade: Grade, todayStr: string = getTodayDateString()): NextReviewCalculation {
  const currentRep = card.repetition || 0;
  const currentInterval = card.interval || 0;
  const currentEF = card.easeFactor || 2.5;

  let newRep = currentRep;
  let newInterval = 1;
  let newEF = currentEF;

  // Gradeごとの品質値 Q
  // again: 1, hard: 3, good: 4, easy: 5
  let quality = 4;
  switch (grade) {
    case 'again':
      quality = 1;
      break;
    case 'hard':
      quality = 3;
      break;
    case 'good':
      quality = 4;
      break;
    case 'easy':
      quality = 5;
      break;
  }

  // Ease Factorの更新計算 (SM-2 標準式)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const deltaEF = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  newEF = Math.max(1.3, Number((currentEF + deltaEF).toFixed(2)));

  if (grade === 'again') {
    // 忘れた場合：リセット
    newRep = 0;
    newInterval = 1; // 翌日（または当日）再復習
  } else {
    // 正解した場合
    if (currentRep === 0) {
      newRep = 1;
      newInterval = grade === 'easy' ? 4 : 1;
    } else if (currentRep === 1) {
      newRep = 2;
      newInterval = grade === 'easy' ? 10 : grade === 'hard' ? 3 : 6;
    } else {
      newRep = currentRep + 1;
      const base = currentInterval > 0 ? currentInterval : 1;
      if (grade === 'hard') {
        newInterval = Math.max(base + 1, Math.round(base * 1.2));
      } else if (grade === 'good') {
        newInterval = Math.max(base + 1, Math.round(base * newEF));
      } else if (grade === 'easy') {
        newInterval = Math.max(base + 2, Math.round(base * newEF * 1.3));
      }
    }
  }

  const dueDate = addDaysToDate(todayStr, newInterval);

  return {
    repetition: newRep,
    interval: newInterval,
    easeFactor: newEF,
    dueDate,
  };
}

/**
 * 各評価ボタンに表示する次回までの目安期間ラベル
 */
export function getGradeEstimateLabel(card: Card, grade: Grade): string {
  const next = calculateSM2(card, grade);
  if (next.interval === 0) return '今日中';
  if (next.interval === 1) return '1日後';
  if (next.interval < 30) return `${next.interval}日後`;
  const months = Math.round(next.interval / 30);
  return `${months}ヶ月後`;
}
