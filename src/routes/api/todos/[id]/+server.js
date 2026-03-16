import { json } from '@sveltejs/kit';
import { getPool, initDB, rowToTodo, todoToRow } from '$lib/server/db.js';

// PATCH /api/todos/:id — 수정 (부분 업데이트)
export async function PATCH({ params, request }) {
  try {
    await initDB();
    const db = getPool();
    const data = await request.json();

    // 기존 row 가져오기
    const [rows] = await db.execute('SELECT * FROM todos WHERE id = ?', [params.id]);
    if (!rows.length) return json({ error: 'not found' }, { status: 404 });

    const existing = rowToTodo(rows[0]);
    const merged = { ...existing, ...data };
    const row = todoToRow(merged);

    await db.execute(
      `UPDATE todos SET
        title=?, description=?, completed=?, priority=?, category=?,
        schedule_type=?, meeting_type=?, meeting_url=?, board_status=?,
        due_date=?, start_time=?, end_time=?, start_date=?, end_date=?, members=?,
        repeat_type=?, repeat_until=?
       WHERE id=?`,
      [row.title, row.description, row.completed, row.priority, row.category,
       row.schedule_type, row.meeting_type, row.meeting_url, row.board_status,
       row.due_date, row.start_time, row.end_time, row.start_date, row.end_date,
       row.members, row.repeat_type, row.repeat_until, params.id]
    );
    return json(merged);
  } catch (e) {
    console.error('PATCH /api/todos error:', e);
    return json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/todos/:id — 삭제
export async function DELETE({ params }) {
  try {
    await initDB();
    const db = getPool();
    await db.execute('DELETE FROM todos WHERE id = ?', [params.id]);
    return json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/todos error:', e);
    return json({ error: e.message }, { status: 500 });
  }
}
