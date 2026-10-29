import { Card, DeckStats } from '../types';
import { getTodayDateString } from './sm2';

const STORAGE_KEY_CARDS = 'remindflow_cards_v1';
const STORAGE_KEY_STREAK = 'remindflow_streak_v1';

export const INITIAL_SAMPLE_CARDS: Card[] = [
  {
    id: 'sample-1',
    front: '### エビングハウスの忘却曲線とは？\nどのような実験結果に基づいているか、また間隔反復（Spaced Repetition）の効果は？',
    back: 'ドイツの心理学者ヘルマン・エビングハウスが提唱した、時間の経過に伴う記憶の忘却度合いを示す曲線。\n\n- **忘却のスピード**:\n  - 20分後: 約42%忘却（58%保持）\n  - 1日後: 約67%忘却（33%保持）\n  - 6日後: 約75%忘却（25%保持）\n\n- **間隔反復の効果**:\n  忘れかけた絶妙なタイミングで復習を重ねることで、忘却曲線の傾きが緩やかになり、最小の努力で**長期記憶（大脳皮質）**へ定着させることができます。',
    tags: ['心理学', '学習法'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    repetition: 0,
    interval: 0,
    easeFactor: 2.5,
    dueDate: getTodayDateString(),
    lastReviewed: null,
    history: [],
  },
  {
    id: 'sample-2',
    front: '### JavaScriptの `const`, `let`, `var` の主な違いは？',
    back: '| 宣言 | スコープ | 再代入 | 再宣言 | ホイスティング |\n| :--- | :--- | :--- | :--- | :--- |\n| `var` | 関数 | ○ | ○ | 初期化前 `undefined` |\n| `let` | ブロックスコープ | ○ | ✕ | 初期化前 TDZ（参照不可） |\n| `const` | ブロックスコープ | ✕ | ✕ | 初期化前 TDZ（参照不可） |\n\n> 基本は `const` を使い、再代入が必要な場合のみ `let` を使用します。`var` は現代のJavaScriptでは使用を避けます。',
    tags: ['プログラミング', 'JavaScript'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    repetition: 0,
    interval: 0,
    easeFactor: 2.5,
    dueDate: getTodayDateString(),
    lastReviewed: null,
    history: [],
  },
  {
    id: 'sample-3',
    front: '### 英語フレーズ:\n「～に慣れている（状態）」と「～に慣れる（動作・変化）」の使い分けは？',
    back: '1. **be used to ~ (名詞/動名詞)**: ～に慣れている（状態）\n   - *I am used to getting up early.* (早起きに慣れている)\n\n2. **get used to ~ (名詞/動名詞)**: ～に慣れる（プロセスの変化）\n   - *You will soon get used to the new job.* (すぐに新しい仕事に慣れるよ)\n\n*(注意)*: `used to + 動詞の原形` は「かつて～したものだ（過去の習慣）」を表す全く別の構文です！',
    tags: ['英語', '語学'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    repetition: 0,
    interval: 0,
    easeFactor: 2.5,
    dueDate: getTodayDateString(),
    lastReviewed: null,
    history: [],
  },
  {
    id: 'sample-4',
    front: '### REST API の主要なHTTPメソッドと役割は？',
    back: '- `GET`: リソースの取得（安全・冪等）\n- `POST`: 新しいリソースの作成（非冪等）\n- `PUT`: リソースの全体置換（冪等）\n- `PATCH`: リソースの部分更新（冪等でない場合もある）\n- `DELETE`: リソースの削除（冪等）\n\n```http\nPOST /api/cards HTTP/1.1\nContent-Type: application/json\n\n{\n  "front": "質問",\n  "back": "答え"\n}\n```',
    tags: ['Web開発', 'プログラミング'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    repetition: 0,
    interval: 0,
    easeFactor: 2.5,
    dueDate: getTodayDateString(),
    lastReviewed: null,
    history: [],
  },
  {
    id: 'sample-5',
    front: '### ポモドーロ・テクニック（Pomodoro Technique）の基本サイクルとは？',
    back: '集中力を持続させるための時間管理術：\n\n1. **25分間の作業（集中）**\n2. **5分間の短い休憩**\n3. これを4セット繰り返す（約2時間）\n4. 4セット終了後に **15〜30分の長い休憩** を取る\n\nタイマーで時間を区切ることで先延ばしを防ぎ、マルチタスクを排除してシングルタスクに没頭できます。',
    tags: ['生産性', '学習法'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    repetition: 0,
    interval: 0,
    easeFactor: 2.5,
    dueDate: getTodayDateString(),
    lastReviewed: null,
    history: [],
  }
];

export function loadCards(): Card[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CARDS);
    if (!raw) {
      saveCards(INITIAL_SAMPLE_CARDS);
      return INITIAL_SAMPLE_CARDS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // 必須フィールドの補完
      return parsed.map((card: any) => ({
        ...card,
        tags: Array.isArray(card.tags) ? card.tags : [],
        repetition: typeof card.repetition === 'number' ? card.repetition : 0,
        interval: typeof card.interval === 'number' ? card.interval : 0,
        easeFactor: typeof card.easeFactor === 'number' ? card.easeFactor : 2.5,
        dueDate: card.dueDate || getTodayDateString(),
        lastReviewed: card.lastReviewed || null,
        history: Array.isArray(card.history) ? card.history : [],
      }));
    }
    return INITIAL_SAMPLE_CARDS;
  } catch (e) {
    console.error('Failed to load cards from localStorage:', e);
    return INITIAL_SAMPLE_CARDS;
  }
}

export function saveCards(cards: Card[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to save cards to localStorage:', e);
  }
}

export interface StreakInfo {
  streakDays: number;
  lastStudyDate: string | null;
}

export function loadStreak(): StreakInfo {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STREAK);
    if (!raw) return { streakDays: 0, lastStudyDate: null };
    return JSON.parse(raw);
  } catch {
    return { streakDays: 0, lastStudyDate: null };
  }
}

export function recordStudyActivity(): StreakInfo {
  const today = getTodayDateString();
  const current = loadStreak();

  if (current.lastStudyDate === today) {
    return current;
  }

  let newStreak = 1;
  if (current.lastStudyDate) {
    // 昨日の日付を計算してチェック
    const lastDate = new Date(current.lastStudyDate);
    const todayDate = new Date(today);
    const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 1) {
      newStreak = current.streakDays + 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    } else {
      newStreak = current.streakDays;
    }
  }

  const updated: StreakInfo = {
    streakDays: newStreak,
    lastStudyDate: today,
  };
  localStorage.setItem(STORAGE_KEY_STREAK, JSON.stringify(updated));
  return updated;
}

export function calculateDeckStats(cards: Card[]): DeckStats {
  const today = getTodayDateString();
  const streak = loadStreak();

  let dueCards = 0;
  let newCards = 0;
  let learningCards = 0;
  let masteredCards = 0;

  for (const card of cards) {
    if (card.repetition === 0 && card.lastReviewed === null) {
      newCards++;
    } else if (card.interval >= 21) {
      masteredCards++;
    } else {
      learningCards++;
    }

    if (card.dueDate <= today) {
      dueCards++;
    }
  }

  return {
    totalCards: cards.length,
    dueCards,
    newCards,
    learningCards,
    masteredCards,
    streakDays: streak.streakDays,
    lastStudyDate: streak.lastStudyDate,
  };
}

export function exportCardsAsJson(cards: Card[]): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cards, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `remindflow_backup_${getTodayDateString()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
