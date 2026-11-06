import { neon } from '@neondatabase/serverless';

// Vercel Postgres / Neon から自動注入される接続文字列を取得
export function getDbUrl(): string | null {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    null
  );
}

// データベースクライアントの取得
export function getDb() {
  const url = getDbUrl();
  if (!url) {
    throw new Error(
      'Vercel Postgres が接続されていません。Vercelダッシュボードの [Storage] タブから Postgres データベースを接続してください。'
    );
  }
  return neon(url);
}

// テーブルの自動作成（初回アクセス時に自動実行）
let isInitialized = false;
export async function ensureTables() {
  if (isInitialized) return;
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      username VARCHAR(50) PRIMARY KEY,
      password_hash VARCHAR(64) NOT NULL,
      salt VARCHAR(32) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS user_cards (
      username VARCHAR(50) PRIMARY KEY REFERENCES users(username) ON DELETE CASCADE,
      cards JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  isInitialized = true;
}

// 安全なソルト生成
export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// パスワード + ソルトのSHA-256ハッシュ計算
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt + 'remindflow_secret_pepper_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// トークン用のシークレットキー
const TOKEN_SECRET = process.env.AUTH_SECRET || 'remindflow_token_secret_salt_8659';

// セッショントークン生成（有効期限30日）
export async function createSessionToken(username: string): Promise<string> {
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const payload = `${username}:${exp}`;
  const encoder = new TextEncoder();
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(TOKEN_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const sigHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
    
  // Base64URL 形式のトークン
  const token = btoa(`${payload}:${sigHex}`);
  return token;
}

// セッショントークンの検証
export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const raw = atob(token);
    const parts = raw.split(':');
    if (parts.length < 3) return null;
    
    const username = parts[0];
    const exp = parseInt(parts[1], 10);
    const sigHex = parts.slice(2).join(':');
    
    if (Date.now() > exp) return null; // 期限切れ
    
    const payload = `${username}:${exp}`;
    const encoder = new TextEncoder();
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(TOKEN_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const sigBytes = new Uint8Array(
      sigHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      encoder.encode(payload)
    );
    
    return isValid ? username : null;
  } catch {
    return null;
  }
}

// リクエストヘッダーから認証済みユーザー名を取得
export async function authenticateRequest(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  return verifySessionToken(token);
}
