import { getDb, ensureTables, hashPassword, createSessionToken } from '../_db';

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

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'ユーザー名とパスワードを入力してください' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await ensureTables();
    const sql = getDb();

    // ユーザー情報の取得
    const rows = await sql`
      SELECT username, password_hash, salt
      FROM users
      WHERE username = ${username}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'ユーザー名またはパスワードが正しくありません' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = rows[0];
    const expectedHash = await hashPassword(password, user.salt);

    if (expectedHash !== user.password_hash) {
      return new Response(
        JSON.stringify({ error: 'ユーザー名またはパスワードが正しくありません' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = await createSessionToken(user.username);

    return new Response(
      JSON.stringify({
        success: true,
        user: { username: user.username },
        token,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Login error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'ログイン処理に失敗しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
