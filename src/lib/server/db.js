import mysql from 'mysql2/promise';
import { env } from '$env/dynamic/private';

let pool;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host:               env.DB_HOST     || 'localhost',
      database:           env.DB_NAME     || 'levelroutine',
      user:               env.DB_USER     || 'root',
      password:           env.DB_PASSWORD || '',
      waitForConnections: true,
      connectionLimit:    10,
      timezone:           '+09:00',
    });
  }
  return pool;
}

export async function initDB() {
  const db = getPool();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS todos (
      id            VARCHAR(36)  PRIMARY KEY,
      title         VARCHAR(500) NOT NULL,
      description   TEXT,
      completed     TINYINT(1)   NOT NULL DEFAULT 0,
      priority      ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
      category      ENUM('work','personal','health','study','other') NOT NULL DEFAULT 'personal',
      schedule_type ENUM('single','timed','range') NOT NULL DEFAULT 'single',
      meeting_type  ENUM('online','offline') DEFAULT 'offline',
      meeting_url   VARCHAR(1000),
      board_status  ENUM('todo','inprogress','done','hold') DEFAULT 'todo',
      due_date      DATE,
      start_time    TIME,
      end_time      TIME,
      start_date    DATE,
      end_date      DATE,
      members       JSON,
      repeat_type   ENUM('none','daily','weekly','monthly') DEFAULT 'none',
      repeat_until  DATE,
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

export async function initProfileDB() {
  const db = getPool();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS profile (
      id         INT PRIMARY KEY DEFAULT 1,
      nickname   VARCHAR(100),
      avatar_url LONGTEXT,
      level      INT DEFAULT 1,
      xp         INT DEFAULT 0,
      total_xp   INT DEFAULT 0,
      max_xp     INT DEFAULT 175,
      title      VARCHAR(100),
      xp_log     JSON,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS attendance (
      id                INT PRIMARY KEY DEFAULT 1,
      last_checked_date DATE,
      streak            INT DEFAULT 0,
      total_days        INT DEFAULT 0,
      history           JSON,
      updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

// MySQL DATE → YYYY-MM-DD 변환 (UTC 오프셋 문제 방지)
function toDateStr(val) {
  if (!val) return undefined;
  if (typeof val === 'string') return val.split('T')[0];
  // Date 객체면 로컬 날짜로 변환
  const y = val.getFullYear();
  const m = String(val.getMonth() + 1).padStart(2, '0');
  const d = String(val.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function rowToTodo(row) {
  return {
    id:           row.id,
    title:        row.title,
    description:  row.description || undefined,
    completed:    row.completed === 1,
    priority:     row.priority,
    category:     row.category,
    scheduleType: row.schedule_type,
    meetingType:  row.meeting_type  || undefined,
    meetingUrl:   row.meeting_url   || undefined,
    boardStatus:  row.board_status  || 'todo',
    dueDate:      toDateStr(row.due_date),
    startTime:    row.start_time || undefined,
    endTime:      row.end_time   || undefined,
    startDate:    toDateStr(row.start_date),
    endDate:      toDateStr(row.end_date),
    members:      row.members ? (typeof row.members === 'string' ? JSON.parse(row.members) : row.members) : undefined,
    repeatType:   row.repeat_type   || 'none',
    repeatUntil:  toDateStr(row.repeat_until),
    createdAt:    row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

export function todoToRow(todo) {
  return {
    id:            todo.id,
    title:         todo.title,
    description:   todo.description  || null,
    completed:     todo.completed ? 1 : 0,
    priority:      todo.priority     || 'medium',
    category:      todo.category     || 'personal',
    schedule_type: todo.scheduleType || 'single',
    meeting_type:  todo.meetingType  || 'offline',
    meeting_url:   todo.meetingUrl   || null,
    board_status:  todo.boardStatus  || 'todo',
    due_date:      todo.dueDate      || null,
    start_time:    todo.startTime    || null,
    end_time:      todo.endTime      || null,
    start_date:    todo.startDate    || null,
    end_date:      todo.endDate      || null,
    members:       todo.members?.length ? JSON.stringify(todo.members) : null,
    repeat_type:   todo.repeatType  || 'none',
    repeat_until:  todo.repeatUntil || null,
    created_at:    (todo.createdAt || new Date().toISOString()).replace('T', ' ').replace('Z', '').split('.')[0],
  };
}
