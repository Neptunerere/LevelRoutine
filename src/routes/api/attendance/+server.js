import { json } from '@sveltejs/kit';
import { getPool, initProfileDB } from '$lib/server/db.js';

// GET /api/attendance
export async function GET() {
  try {
    await initProfileDB();
    const db = getPool();
    const [rows] = await db.execute('SELECT * FROM attendance WHERE id = 1');
    if (!rows.length) return json(null);
    const r = rows[0];
    return json({
      lastCheckedDate: r.last_checked_date
        ? r.last_checked_date.toISOString().split('T')[0]
        : null,
      streak:    r.streak,
      totalDays: r.total_days,
      history:   r.history
        ? (typeof r.history === 'string' ? JSON.parse(r.history) : r.history)
        : [],
    });
  } catch (e) {
    return json({ error: e.message }, { status: 500 });
  }
}

// POST /api/attendance — upsert
export async function POST({ request }) {
  try {
    await initProfileDB();
    const db = getPool();
    const a = await request.json();
    await db.execute(`
      INSERT INTO attendance (id, last_checked_date, streak, total_days, history)
      VALUES (1, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        last_checked_date = VALUES(last_checked_date),
        streak            = VALUES(streak),
        total_days        = VALUES(total_days),
        history           = VALUES(history)
    `, [a.lastCheckedDate ?? null, a.streak ?? 0,
        a.totalDays ?? 0, JSON.stringify(a.history ?? [])]);
    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, { status: 500 });
  }
}
