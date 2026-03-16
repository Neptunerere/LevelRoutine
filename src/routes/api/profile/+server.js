import { json } from '@sveltejs/kit';
import { getPool, initProfileDB } from '$lib/server/db.js';

export async function GET() {
  try {
    await initProfileDB();
    const db = getPool();
    const [rows] = await db.execute('SELECT * FROM profile WHERE id = 1');
    if (!rows.length) return json(null);
    const r = rows[0];
    return json({
      nickname:  r.nickname,
      avatarUrl: r.avatar_url,
      level:     r.level,
      xp:        r.xp,
      totalXp:   r.total_xp,
      maxXp:     r.max_xp,
      title:     r.title,
      xpLog:     r.xp_log ? (typeof r.xp_log === 'string' ? JSON.parse(r.xp_log) : r.xp_log) : [],
    });
  } catch (e) {
    return json({ error: e.message }, { status: 500 });
  }
}

export async function POST({ request }) {
  try {
    await initProfileDB();
    const db = getPool();
    const p = await request.json();
    await db.execute(`
      INSERT INTO profile (id, nickname, avatar_url, level, xp, total_xp, max_xp, title, xp_log)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nickname   = VALUES(nickname),
        avatar_url = VALUES(avatar_url),
        level      = VALUES(level),
        xp         = VALUES(xp),
        total_xp   = VALUES(total_xp),
        max_xp     = VALUES(max_xp),
        title      = VALUES(title),
        xp_log     = VALUES(xp_log)
    `, [
      p.nickname  ?? null,
      p.avatarUrl ?? null,
      p.level     ?? 1,
      p.xp        ?? 0,
      p.totalXp   ?? p.xp ?? 0,
      p.maxXp     ?? 175,
      p.title     ?? null,
      JSON.stringify(p.xpLog ?? []),
    ]);
    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, { status: 500 });
  }
}
