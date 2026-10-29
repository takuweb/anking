import LZString from 'lz-string';
import { Card } from '../types';

export interface SyncPayload {
  version: number;
  timestamp: string;
  cards: Card[];
}

/**
 * カードデータを圧縮文字列に変換（QRコード埋め込み・引き継ぎコード用）
 */
export function compressCards(cards: Card[]): string {
  const payload: SyncPayload = {
    version: 1,
    timestamp: new Date().toISOString(),
    cards,
  };
  const jsonStr = JSON.stringify(payload);
  return LZString.compressToEncodedURIComponent(jsonStr);
}

/**
 * 圧縮文字列からカードデータを復元
 */
export function decompressCards(compressedStr: string): Card[] | null {
  try {
    const jsonStr = LZString.decompressFromEncodedURIComponent(compressedStr.trim());
    if (!jsonStr) return null;
    const payload = JSON.parse(jsonStr) as SyncPayload;
    if (payload && Array.isArray(payload.cards)) {
      return payload.cards;
    }
    if (Array.isArray(payload)) {
      return payload as Card[];
    }
    return null;
  } catch (e) {
    console.error('Failed to decompress cards:', e);
    return null;
  }
}

/**
 * 認証不要グローバルリレー (ntfy.sh) を使った端末間同期
 * スマホとPCが異なるWi-Fiや4G/5Gモバイル回線であってもどこからでも通信可能
 */
const GLOBAL_RELAY_BASE = 'https://ntfy.sh';

/**
 * グローバルリレーへデータを預けて6桁のワンタイム引き継ぎコードを発行
 */
export async function pushDataToSyncServer(cards: Card[]): Promise<{ code: string; expiresIn: number }> {
  // 6桁のランダム数字コード
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const topic = `remindflow-sync-${code}`;
  const compressed = compressCards(cards);

  // 1. グローバルリレー (ntfy.sh) に送信 (別Wi-Fiや外出先でも届く)
  const res = await fetch(`${GLOBAL_RELAY_BASE}/${topic}`, {
    method: 'POST',
    headers: {
      'Title': 'RemindFlow Data Sync',
      'Priority': 'urgent',
    },
    body: compressed,
  });

  if (!res.ok) {
    // グローバルリレーがダメな場合はローカルサーバーへフォールバック
    const localRes = await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { cards } }),
    });
    if (!localRes.ok) {
      throw new Error('同期サーバーへの送信に失敗しました');
    }
    const localData = await localRes.json();
    return { code: localData.code, expiresIn: localData.expiresIn };
  }

  // ローカルサーバーにも念のため送っておく
  fetch('/api/sync/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { cards } }),
  }).catch(() => {});

  return { code, expiresIn: 1800 }; // 30分間有効
}

/**
 * 6桁コードを指定してグローバルリレーまたはローカルサーバーからデータを取得
 */
export async function pullDataFromSyncServer(code: string): Promise<Card[]> {
  const cleanCode = code.trim();
  const topic = `remindflow-sync-${cleanCode}`;

  // 1. まずグローバルリレー (ntfy.sh) から取得を試みる (別Wi-FiでもOK)
  try {
    const res = await fetch(`${GLOBAL_RELAY_BASE}/${topic}/json?poll=1`);
    if (res.ok) {
      const text = await res.text();
      // ntfyは行区切りのJSONを返す場合がある
      const lines = text.trim().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        const msg = JSON.parse(line);
        if (msg.event === 'message' && msg.message) {
          const decompressed = decompressCards(msg.message);
          if (decompressed && decompressed.length > 0) {
            return decompressed;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Global relay pull failed, trying local server:', err);
  }

  // 2. ローカルサーバーから取得を試みる (同一Wi-Fiの場合)
  try {
    const localRes = await fetch(`/api/sync/pull/${cleanCode}`);
    if (localRes.ok) {
      const result = await localRes.json();
      const payload = result.data as SyncPayload;
      if (payload && Array.isArray(payload.cards)) return payload.cards;
      if (Array.isArray(payload)) return payload as Card[];
    }
  } catch (e) {
    // ignore
  }

  throw new Error('引き継ぎコードが見つからないか、有効期限が切れています');
}

/**
 * カードデータのマージ（同一IDは最新更新日時UpdatedAtを優先）
 */
export function mergeCards(existingCards: Card[], importedCards: Card[]): Card[] {
  const cardMap = new Map<string, Card>();

  for (const card of existingCards) {
    cardMap.set(card.id, card);
  }

  for (const imported of importedCards) {
    if (!cardMap.has(imported.id)) {
      cardMap.set(imported.id, imported);
    } else {
      const existing = cardMap.get(imported.id)!;
      const existingTime = new Date(existing.updatedAt || 0).getTime();
      const importedTime = new Date(imported.updatedAt || 0).getTime();
      if (importedTime >= existingTime) {
        cardMap.set(imported.id, imported);
      }
    }
  }

  return Array.from(cardMap.values());
}
