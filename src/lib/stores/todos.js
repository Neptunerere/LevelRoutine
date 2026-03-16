import { writable, derived, get } from 'svelte/store';
import { profile } from './profile.js';
import { t } from '$lib/i18n/index.js';

/**
 * @typedef {'low' | 'medium' | 'high'} Priority
 * @typedef {'work' | 'personal' | 'health' | 'study' | 'other'} Category
 * @typedef {'single' | 'timed' | 'range'} ScheduleType
 * @typedef {'online' | 'offline'} MeetingType
 * @typedef {'todo' | 'inprogress' | 'done' | 'hold'} BoardStatus
 *
 * @typedef {Object} Todo
 * @property {string} id
 * @property {string} title
 * @property {string} [description]
 * @property {boolean} completed
 * @property {Priority} priority
 * @property {Category} category
 * @property {ScheduleType} scheduleType
 * @property {MeetingType} [meetingType]
 * @property {string} [meetingUrl]
 * @property {BoardStatus} [boardStatus]
 * @property {string} [dueDate]
 * @property {string} [startTime]
 * @property {string} [endTime]
 * @property {string} [startDate]
 * @property {string} [endDate]
 * @property {Array} [members]
 * @property {string} createdAt
 */

// ── 내부 writable ──────────────────────────────────────────
const _todos   = writable([]);
export const loading = writable(true);
export const dbError = writable(null);

// ── API 호출 헬퍼 ──────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── 스토어 초기 로드 ──────────────────────────────────────
export async function loadTodos() {
  loading.set(true);
  dbError.set(null);
  try {
    const data = await apiFetch('/api/todos');
    _todos.set(data);
  } catch (e) {
    console.error('loadTodos error:', e);
    dbError.set(e.message);
  } finally {
    loading.set(false);
  }
}

// ── todos 스토어 (외부에서 $todos로 읽기) ─────────────────
export const todos = {
  subscribe: _todos.subscribe,

  async add(todo) {
    const newTodo = {
      ...todo,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      boardStatus: todo.boardStatus || 'todo',
    };
    // 낙관적 업데이트
    _todos.update(list => [...list, newTodo]);
    try {
      const saved = await apiFetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify(newTodo)
      });
      // id 등 서버 응답으로 교체
      _todos.update(list => list.map(t => t.id === newTodo.id ? saved : t));
    } catch (e) {
      // 실패 시 롤백
      _todos.update(list => list.filter(t => t.id !== newTodo.id));
      dbError.set(e.message);
    }
  },

  async toggle(id) {
    const current = get(_todos).find(t => t.id === id);
    if (!current) return;
    const completing = !current.completed;
    const next = {
      completed: completing,
      boardStatus: completing ? 'done' : 'todo'
    };
    _todos.update(list => list.map(t => t.id === id ? { ...t, ...next } : t));
    try {
      await apiFetch(`/api/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(next)
      });

      // ── XP 지급 ──────────────────────────────────────────
      if (completing && profile.isLoaded()) {
        // 기본 XP
        let xp = 10;
        const _t = get(t);
        let reason = `"${current.title}" ${_t.common.add === 'Add' ? 'completed' : '완료'}`;

        // 우선순위 보너스
        if (current.priority === 'high')   { xp += 15; reason += _t.common.add === 'Add' ? ' (urgent bonus)' : ' (긴급 보너스)'; }
        else if (current.priority === 'medium') { xp += 5; }

        profile.addXp(xp, reason);

        // 오늘 전체 완료 보너스
        const allTodos = get(_todos);
        const todayStr = new Date().toISOString().split('T')[0];
        const todayTodos = allTodos.filter(t =>
          t.dueDate === todayStr || t.startDate === todayStr
        );
        const allDone = todayTodos.length > 0 && todayTodos.every(t =>
          t.id === id ? completing : t.completed
        );
        if (allDone) {
          profile.addXp(30, get(t).common.add === 'Add' ? 'All tasks done today 🎉' : '오늘 할일 전체 완료 보너스 🎉');
        }
      } else if (!completing && profile.isLoaded()) {
        // 완료 취소 시 XP 차감
        let xp = current.priority === 'high' ? -15 : -10;
        const _t2 = get(t);
        profile.addXp(xp, `"${current.title}" ${_t2.common.add === 'Add' ? 'uncompleted' : '완료 취소'}`);
      }
    } catch (e) {
      _todos.update(list => list.map(t => t.id === id ? current : t));
      dbError.set(e.message);
    }
  },

  async remove(id) {
    const backup = get(_todos).find(t => t.id === id);
    _todos.update(list => list.filter(t => t.id !== id));
    try {
      await apiFetch(`/api/todos/${id}`, { method: 'DELETE' });
    } catch (e) {
      if (backup) _todos.update(list => [...list, backup]);
      dbError.set(e.message);
    }
  },

  async update(id, data) {
    const current = get(_todos).find(t => t.id === id);
    if (!current) return;
    const merged = { ...current, ...data };
    _todos.update(list => list.map(t => t.id === id ? merged : t));
    try {
      await apiFetch(`/api/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    } catch (e) {
      _todos.update(list => list.map(t => t.id === id ? current : t));
      dbError.set(e.message);
    }
  }
};

// ── 파생 스토어 ───────────────────────────────────────────
export const filter          = writable('active');
export const selectedCategory = writable('all');
export const searchQuery      = writable('');

export const filteredTodos = derived(
  [_todos, filter, selectedCategory, searchQuery],
  ([$t, $f, $c, $q]) => $t
    .filter(t => $f === 'all' ? true : $f === 'active' ? !t.completed : t.completed)
    .filter(t => $c === 'all' || t.category === $c)
    .filter(t => !$q || t.title.toLowerCase().includes($q.toLowerCase()) || t.description?.toLowerCase().includes($q.toLowerCase()))
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return ({ high: 0, medium: 1, low: 2 }[a.priority]) - ({ high: 0, medium: 1, low: 2 }[b.priority]);
    })
);

export const stats = derived(_todos, $t => ({
  total:        $t.length,
  completed:    $t.filter(t => t.completed).length,
  active:       $t.filter(t => !t.completed).length,
  highPriority: $t.filter(t => t.priority === 'high' && !t.completed).length
}));

export function getTodosForDate(todos, dateStr) {
  return todos.filter(t => {
    if (t.scheduleType === 'range') return t.startDate && t.endDate && t.startDate <= dateStr && dateStr <= t.endDate;
    return t.dueDate === dateStr;
  });
}
