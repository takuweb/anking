import { Card } from '../types';

const STORAGE_KEY_AUTH_USER = 'remindflow_cloud_user_v1';
const STORAGE_KEY_AUTH_TOKEN = 'remindflow_cloud_token_v1';

export interface CloudUser {
  username: string;
}

export type SyncState = 'synced' | 'syncing' | 'error' | 'offline' | 'local_only';

/**
 * 現在ログイン中のユーザー情報を取得
 */
export function getSavedCloudUser(): CloudUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * 保存された認証トークンを取得
 */
export function getSavedCloudToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
}

/**
 * ログイン
 */
export async function loginToCloud(username: string, password: string): Promise<{ user: CloudUser; token: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'ログインに失敗しました');
  }

  localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(data.user));
  localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, data.token);

  return { user: data.user, token: data.token };
}

/**
 * 新規アカウント登録
 */
export async function registerToCloud(
  username: string,
  password: string,
  initialCards?: Card[]
): Promise<{ user: CloudUser; token: string }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, initialCards }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'アカウント作成に失敗しました');
  }

  localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(data.user));
  localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, data.token);

  return { user: data.user, token: data.token };
}

/**
 * ログアウト
 */
export function logoutFromCloud(): void {
  localStorage.removeItem(STORAGE_KEY_AUTH_USER);
  localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
}

/**
 * クラウドから最新カードを取得
 */
export async function fetchCardsFromCloud(): Promise<Card[] | null> {
  const token = getSavedCloudToken();
  if (!token) return null;

  const res = await fetch('/api/cards', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      logoutFromCloud();
      throw new Error('セッションの有効期限が切れました。再度ログインしてください。');
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'クラウドデータの取得に失敗しました');
  }

  const result = await res.json();
  return result.cards || null;
}

/**
 * クラウドへカード一覧を保存・同期
 */
export async function saveCardsToCloud(cards: Card[]): Promise<Card[]> {
  const token = getSavedCloudToken();
  if (!token) {
    return cards;
  }

  const res = await fetch('/api/cards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ cards }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      logoutFromCloud();
      throw new Error('セッションの有効期限が切れました。再度ログインしてください。');
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'クラウドへの同期に失敗しました');
  }

  const result = await res.json();
  return result.cards || cards;
}
