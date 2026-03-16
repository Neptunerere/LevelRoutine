<script>
  import { todos } from '$lib/stores/todos';
  import { createEventDispatcher } from 'svelte';
  import MemberAvatars from './MemberAvatars.svelte';
  import { t } from '$lib/i18n/index.js';

  export let todo;
  const dispatch = createEventDispatcher();

  $: priorityLabels = $t.card.priorities;
  $: _tCard = $t.card; // 함수 안에서 쓰기 위한 변수
  $: categoryLabels = $t.card.categories;
  const categoryIcons  = { work: '💼', personal: '✨', health: '💚', study: '📚', other: '🎯' };
  const typeIcon       = { single: '◎', timed: '⏱', range: '↔' };
  $: typeLabel = $t.card.typeLabels;

  function formatDateRange(t) {
    if (t.scheduleType === 'range' && t.startDate && t.endDate) {
      const days = Math.round((new Date(t.endDate) - new Date(t.startDate)) / 86400000) + 1;
      return `${t.startDate.slice(5).replace('-','/')} → ${t.endDate.slice(5).replace('-','/')} (${days}일)`;
    }
    if (t.scheduleType === 'timed' && t.dueDate) {
      const timeStr = t.startTime ? `${t.startTime}${t.endTime ? ' ~ ' + t.endTime : ''}` : '';
      return `${t.dueDate.slice(5).replace('-','/')} ${timeStr}`;
    }
    if (t.dueDate) {
      const d = new Date(t.dueDate);
      const today = new Date(new Date().toDateString());
      const diff = Math.round((d - today) / 86400000);
      if (diff === 0) return _tCard ? _tCard.today : '오늘';
      if (diff === 1) return _tCard ? _tCard.tomorrow : '내일';
      if (diff < 0) return _tCard ? _tCard.daysAgo(Math.abs(diff)) : `${Math.abs(diff)}일 전`;
      return _tCard ? _tCard.daysLater(diff) : `${diff}일 후`;
    }
    return null;
  }

  function isOverdue(t) {
    if (t.completed) return false;
    if (t.scheduleType === 'range') return t.endDate && t.endDate < new Date().toISOString().split('T')[0];
    return t.dueDate && t.dueDate < new Date().toISOString().split('T')[0];
  }

  let removing = false;
  function handleRemove() { removing = true; setTimeout(() => todos.remove(todo.id), 280); }
</script>

<div class="card" class:completed={todo.completed} class:removing>
  <button class="check-btn" class:checked={todo.completed} on:click={() => todos.toggle(todo.id)}>
    {#if todo.completed}
      <svg viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    {/if}
  </button>

  <div class="body">
    <div class="meta">
      <span class="cat-dot" style="background:var(--{todo.category})"></span>
      <span class="cat">{categoryIcons[todo.category]} {categoryLabels[todo.category]}</span>
      <span class="type-badge type-{todo.scheduleType ?? 'single'}">{typeIcon[todo.scheduleType ?? 'single']} {typeLabel[todo.scheduleType ?? 'single']}</span>

      <!-- 온라인/오프라인 배지 -->
      {#if todo.meetingType === 'online'}
        <span class="meeting-badge online">
          <svg viewBox="0 0 10 10" fill="none" width="8" height="8"><rect x="1" y="2.5" width="8" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M3.5 5h3M5 4v2" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
          {$t.card.online}
        </span>
      {:else if todo.meetingType === 'offline'}
        <span class="meeting-badge offline">
          <svg viewBox="0 0 10 10" fill="none" width="8" height="8"><path d="M5 1C3.62 1 2.5 2.12 2.5 3.5c0 2.08 2.5 5.5 2.5 5.5s2.5-3.42 2.5-5.5C7.5 2.12 6.38 1 5 1z" stroke="currentColor" stroke-width="1.2" fill="currentColor" fill-opacity="0.15"/><circle cx="5" cy="3.5" r="1" stroke="currentColor" stroke-width="1"/></svg>
          {$t.card.offline}
        </span>
      {/if}

      <span class="priority priority-{todo.priority}">{priorityLabels[todo.priority]}</span>
      {#if todo.repeatType && todo.repeatType !== 'none'}
        <span class="repeat-badge">{repeatIcon[todo.repeatType]}</span>
      {/if}
    </div>

    <p class="title">{todo.title}</p>
    {#if todo.description}<p class="desc">{todo.description}</p>{/if}

    <!-- 온라인 링크 -->
    {#if todo.meetingType === 'online' && todo.meetingUrl}
      <a class="meeting-link" href={todo.meetingUrl} target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 12 12" fill="none" width="10" height="10"><path d="M4.5 7.5a3 3 0 004.24 0l1.5-1.5a3 3 0 00-4.24-4.24L5 2.76" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M7.5 4.5a3 3 0 00-4.24 0L1.76 6a3 3 0 004.24 4.24L7 9.24" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        참여 링크
        <svg viewBox="0 0 10 10" fill="none" width="8" height="8"><path d="M2 8l6-6M4.5 2H8v3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
    {/if}

    {#if formatDateRange(todo)}
      <span class="date-label" class:overdue={isOverdue(todo)}>
        {#if todo.scheduleType === 'timed'}
          <svg viewBox="0 0 12 12" fill="none" width="10" height="10"><circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.4"/><path d="M6 3.5V6l1.5 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        {:else if todo.scheduleType === 'range'}
          <svg viewBox="0 0 12 12" fill="none" width="10" height="10"><path d="M1 6h10M8 3l3 3-3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        {:else}
          <svg viewBox="0 0 12 12" fill="none" width="10" height="10"><rect x="1.5" y="2" width="9" height="8.5" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M4 1v2M8 1v2M1.5 5.5h9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        {/if}
        {formatDateRange(todo)}
      </span>
    {/if}
  </div>

  {#if todo.members && todo.members.length > 0}
    <div class="card-members">
      <MemberAvatars members={todo.members} max={3} size={20} />
    </div>
  {/if}

  <div class="actions">
    <button class="act edit" on:click={() => dispatch('edit', todo)}>
      <svg viewBox="0 0 14 14" fill="none" width="13" height="13"><path d="M9.5 1.5l3 3-7 7H2.5v-3l7-7z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
    </button>
    <button class="act del" on:click={handleRemove}>
      <svg viewBox="0 0 14 14" fill="none" width="13" height="13"><path d="M2 3.5h10M5 3.5V2h4v1.5M4.5 3.5l.5 8h4l.5-8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </div>
</div>

<style>
  .card {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 18px; background: var(--surface);
    border: 1px solid var(--border); border-radius: 14px;
    transition: all 0.2s ease; animation: in 0.25s ease;
  }
  .card:hover { border-color: var(--border-hover); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.25); }
  .card.completed { opacity: 0.45; }
  .card.removing { animation: out 0.28s ease forwards; }

  .check-btn {
    width: 20px; height: 20px; min-width: 20px; border-radius: 50%;
    border: 1.5px solid var(--border-hover); display: flex; align-items: center;
    justify-content: center; color: #fff; transition: all 0.15s; background: none; cursor: pointer;
  }
  .check-btn:hover { border-color: var(--accent); background: var(--accent-glow); }
  .check-btn.checked { background: var(--accent); border-color: var(--accent); }
  .check-btn svg { width: 10px; height: 10px; }

  .body { flex: 1; min-width: 0; overflow: hidden; }
  .meta { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap; }
  .cat-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .cat { font-size: 12px; color: var(--text-3); }

  .type-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 99px; letter-spacing: 0.02em; }
  .type-single { background: rgba(255,255,255,0.06); color: var(--text-3); }
  .type-timed  { background: rgba(92,180,255,0.12); color: #5cb4ff; }
  .type-range  { background: rgba(255,170,92,0.12); color: var(--other); }

  /* 온라인/오프라인 배지 */
  .meeting-badge {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 99px;
  }
  .meeting-badge.online  { background: rgba(92,255,176,0.12); color: var(--low); }
  .repeat-badge {
    font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 99px;
    background: rgba(92,180,255,0.1); color: #5cb4ff; border: 1px solid rgba(92,180,255,0.25);
  }
  .meeting-badge.offline { background: rgba(245,124,180,0.12); color: var(--personal); }

  /* 미팅 링크 */
  .meeting-link {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 600; color: var(--low);
    text-decoration: none; margin-top: 5px;
    padding: 3px 9px; border-radius: 6px;
    background: rgba(92,255,176,0.08); border: 1px solid rgba(92,255,176,0.2);
    transition: all 0.15s;
  }
  .meeting-link:hover { background: rgba(92,255,176,0.15); border-color: rgba(92,255,176,0.4); }

  .priority { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 99px; }
  .priority-high   { background: var(--high-bg);   color: var(--high); }
  .priority-medium { background: var(--medium-bg); color: var(--medium); }
  .priority-low    { background: var(--low-bg);    color: var(--low); }

  .title { font-size: 14px; font-weight: 600; color: var(--text); line-height: 1.4; }
  .completed .title { text-decoration: line-through; color: var(--text-3); }
  .desc { font-size: 12px; color: var(--text-2); margin-top: 2px; }

  .date-label {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; color: var(--text-3); margin-top: 5px;
  }
  .date-label.overdue { color: var(--high); }

  .card-members { display: flex; align-items: center; margin-top: 4px; overflow: hidden; max-width: 100%; }

  .actions { display: flex; gap: 2px; opacity: 0; transition: opacity 0.15s; }
  .card:hover .actions { opacity: 1; }
  .act {
    width: 28px; height: 28px; border-radius: 7px; display: flex;
    align-items: center; justify-content: center; color: var(--text-3);
    transition: all 0.15s; cursor: pointer; background: none; border: none;
  }
  .act.edit:hover { background: rgba(124,106,245,0.15); color: var(--accent); }
  .act.del:hover  { background: var(--high-bg); color: var(--high); }

  @keyframes in  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @keyframes out { to   { opacity: 0; transform: translateX(-16px) scale(0.97); } }
</style>
