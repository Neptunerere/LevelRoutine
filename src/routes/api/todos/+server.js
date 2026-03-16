import { json } from '@sveltejs/kit';
import { getPool, initDB, rowToTodo, todoToRow } from '$lib/server/db.js';
import { randomUUID } from 'crypto';

// GET /api/todos — 전체 조회
export async function GET() {
  try {
    await initDB();
    const db = getPool();
    const [rows] = await db.execute('SELECT * FROM todos ORDER BY created_at ASC');
    return json(rows.map(rowToTodo));
  } catch (e) {
    console.error('GET /api/todos error:', e);
    return json({ error: e.message }, { status: 500 });
  }
}

// POST /api/todos — 새 일정 추가
export async function POST({ request }) {
  try {
    await initDB();
    const db = getPool();
    const todo = await request.json();
    todo.id = todo.id || randomUUID();
    todo.createdAt = todo.createdAt || new Date().toISOString();
    const row = todoToRow(todo);
    await db.execute(
      `INSERT INTO todos (id, title, description, completed, priority, category,
        schedule_type, meeting_type, meeting_url, board_status,
        due_date, start_time, end_time, start_date, end_date, members, repeat_type, repeat_until, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [row.id, row.title, row.description, row.completed, row.priority, row.category,
       row.schedule_type, row.meeting_type, row.meeting_url, row.board_status,
       row.due_date, row.start_time, row.end_time, row.start_date, row.end_date,
       row.members, row.repeat_type, row.repeat_until, row.created_at]
    );
    return json({ ...todo, id: row.id });
  } catch (e) {
    console.error('POST /api/todos error:', e);
    return json({ error: e.message }, { status: 500 });
  }
}
