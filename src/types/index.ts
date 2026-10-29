export type Grade = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewHistoryEntry {
  date: string;       // ISO 8601
  grade: Grade;
  interval: number;   // days
  easeFactor: number;
}

export interface Card {
  id: string;
  front: string;              // 問題・キーワード（Markdown対応）
  back: string;               // 解答・解説（Markdown対応）
  tags: string[];             // タグ一覧
  createdAt: string;          // ISO 8601
  updatedAt: string;          // ISO 8601

  // SM-2 間隔反復アルゴリズム用パラメータ
  repetition: number;         // 連続正解回数 (0: 未学習または忘却)
  interval: number;           // 次回までの間隔（日数）
  easeFactor: number;         // 難易度係数（デフォルト: 2.5, 下限: 1.3）
  dueDate: string;            // 次回复習予定日 (YYYY-MM-DD)
  lastReviewed: string | null;// 最終復習日時 (ISO 8601)
  history: ReviewHistoryEntry[];
}

export type StudyFilter = 'all' | 'due' | 'new' | 'tag';

export interface StudySessionState {
  cards: Card[];
  currentIndex: number;
  isFlipped: boolean;
  reviewedCardsCount: number;
  sessionStartTime: number;
  results: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
}

export interface DeckStats {
  totalCards: number;
  dueCards: number;
  newCards: number;
  learningCards: number;  // 連続正解1~2回、またはinterval < 21
  masteredCards: number;  // interval >= 21
  streakDays: number;
  lastStudyDate: string | null;
}
