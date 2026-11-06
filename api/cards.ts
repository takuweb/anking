import { getDb, ensureTables, authenticateRequest } from './_db';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  // 認証チェック
  const username = await authenticateRequest(req);
  if (!username) {
    return new Response(
      JSON.stringify({ error: '認証が必要です。ログインしてください。' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    await ensureTables();
    const sql = getDb();

    // GET: カードデータの取得
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT cards, updated_at
        FROM user_cards
        WHERE username = ${username}
        LIMIT 1;
      `;

      if (rows.length === 0) {
        return new Response(
          JSON.stringify({ cards: null, updatedAt: null }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          cards: rows[0].cards,
          updatedAt: rows[0].updated_at,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // POST: カードデータの保存・更新
    if (req.method === 'POST') {
      const body = await req.json();
      const incomingCards = body.cards;

      if (!Array.isArray(incomingCards)) {
        return new Response(
          JSON.stringify({ error: 'カード配列が不正です' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 既存データの取得とスマートマージ
      const rows = await sql`
        SELECT cards FROM user_cards WHERE username = ${username} LIMIT 1;
      `;

      let finalCards = incomingCards;

      if (rows.length > 0 && Array.isArray(rows[0].cards) && body.merge !== false) {
        const existingCards = rows[0].cards;
        const cardMap = new Map<string, any>();

        for (const card of existingCards) {
          cardMap.set(card.id, card);
        }

        for (const card of incomingCards) {
          if (!cardMap.has(card.id)) {
            cardMap.set(card.id, card);
          } else {
            const ex = cardMap.get(card.id);
            const exTime = new Date(ex.updatedAt || 0).getTime();
            const inTime = new Date(card.updatedAt || 0).getTime();
            if (inTime >= exTime) {
              cardMap.set(card.id, card);
            }
          }
        }

        finalCards = Array.from(cardMap.values());
      }

      const jsonStr = JSON.stringify(finalCards);

      await sql`
        INSERT INTO user_cards (username, cards, updated_at)
        VALUES (${username}, ${jsonStr}::jsonb, NOW())
        ON CONFLICT (username)
        DO UPDATE SET
          cards = EXCLUDED.cards,
          updated_at = NOW();
      `;

      return new Response(
        JSON.stringify({
          success: true,
          cards: finalCards,
          updatedAt: new Date().toISOString(),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Cards API error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'カードデータの処理に失敗しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
