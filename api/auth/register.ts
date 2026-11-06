import { getDb, ensureTables, generateSalt, hashPassword, createSessionToken } from '../_db';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const username = (body.username || '').trim().toLowerCase();
    const password = body.password || '';

    // バリデーション
    if (!username || username.length < 3 || username.length > 30) {
      return new Response(
        JSON.stringify({ error: 'ユーザー名は3〜30文字の英数字・アンダースコアで入力してください' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return new Response(
        JSON.stringify({ error: 'ユーザー名には半角英数字、ハイフン、アンダースコアのみ使用できます' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!password || password.length < 4) {
      return new Response(
        JSON.stringify({ error: 'パスワードは4文字以上で設定してください' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await ensureTables();
    const sql = getDb();

    // 既存ユーザーの重複チェック
    const existing = await sql`
      SELECT username FROM users WHERE username = ${username} LIMIT 1;
    `;

    if (existing.length > 0) {
      return new Response(
        JSON.stringify({ error: `ユーザー名「${username}」は既に使われています` }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // パスワードのハッシュ化と保存
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);

    await sql`
      INSERT INTO users (username, password_hash, salt)
      VALUES (${username}, ${passwordHash}, ${salt});
    `;

    // 初期カードデータがあれば保存（任意）
    if (body.initialCards && Array.isArray(body.initialCards) && body.initialCards.length > 0) {
      await sql`
        INSERT INTO user_cards (username, cards, updated_at)
        VALUES (${username}, ${JSON.stringify(body.initialCards)}::jsonb, NOW())
        ON CONFLICT (username) DO NOTHING;
      `;
    }

    const token = await createSessionToken(username);

    return new Response(
      JSON.stringify({
        success: true,
        user: { username },
        token,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Registration error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'アカウント作成に失敗しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
