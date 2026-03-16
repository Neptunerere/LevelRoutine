<script>
  import { todos } from '$lib/stores/todos';
  import { createEventDispatcher } from 'svelte';
  import MemberAvatars from './MemberAvatars.svelte';

  export let onAddWithDate = null;

  const dispatch = createEventDispatcher();

  // 보드 컬럼 정의
  const columns = [
    { id: 'todo',       label: '할 일',    icon: '○', color: '#9999bb' },
    { id: 'inprogress', label: '진행 중',  icon: '◐', color: '#5cb4ff' },
    { id: 'done',       label: '완료',     icon: '●', color: '#5cffb0' },
    { id: 'hold',       label: '보류',     icon: '⊘', color: '#ffaa5c' },
  ];

  const categoryColors = { work: '#7c6af5', personal: '#f57cb4', health: '#5cffb0', study: '#5cb4ff', other: '#ffaa5c' };
  const categoryIcons  = { work: '💼', personal: '✨', health: '💚', study: '📚', other: '🎯' };
  const priorityColor  = { high: '#ff5c7c', medium: '#ffaa5c', low: '#5cffb0' };
  const priorityLabel  = { high: '긴급', medium: '보통', low: '여유' };

  // 각 todo의 boardStatus (없으면 completed 기준으로 기본값)
  function getBoardStatus(t) {
    if (t.boardStatus) return t.boardStatus;
    if (t.completed) return 'done';
    return 'todo';
  }

  function moveTo(id, status) {
    todos.update(id, {
      boardStatus: status,
      completed: status === 'done'
    });
  }

  function formatDate(t) {
    const d = t.dueDate || t.startDate;
    if (!d) return null;
    const date = new Date(d);
    const today = new Date(new Date().toDateString());
    const diff = Math.round((date - today) / 86400000);
    if (diff === 0) return '오늘';
    if (diff === 1) return '내일';
    if (diff < 0) return `${Math.abs(diff)}일 전`;
    if (t.scheduleType === 'range' && t.endDate) {
      return `${d.slice(5).replace('-','/')} → ${t.endDate.slice(5).replace('-','/')}`;
    }
    return d.slice(5).replace('-','/');
  }

  function isOverdue(t) {
    if (t.completed || getBoardStatus(t) === 'done') return false;
    const d = t.dueDate || t.endDate;
    return d && d < new Date().toISOString().split('T')[0];
  }

  // 드래그 앤 드롭
  let draggingId = null;
  let dragOverCol = null;

  function onDragStart(e, id) {
    draggingId = id;
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e, colId) {
    e.preventDefault();
    dragOverCol = colId;
  }

  function onDrop(e, colId) {
    e.preventDefault();
    if (draggingId) moveTo(draggingId, colId);
    draggingId = null;
    dragOverCol = null;
  }

  function onDragEnd() {
    draggingId = null;
    dragOverCol = null;
  }

  $: byColumn = columns.reduce((acc, col) => {
    acc[col.id] = $todos.filter(t => getBoardStatus(t) === col.id);
    return acc;
  }, {});
</script>

<div class="board-wrap">
  {#each columns as col}
    <div
      class="col"
      class:drag-over={dragOverCol === col.id}
      on:dragover={(e) => onDragOver(e, col.id)}
      on:drop={(e) => onDrop(e, col.id)}
      on:dragleave={() => dragOverCol = null}
      role="region"
      aria-label={col.label}
    >
      <!-- 컬럼 헤더 -->
      <div class="col-header">
        <div class="col-title">
          <span class="col-icon" style="color:{col.color}">{col.icon}</span>
          <span class="col-label">{col.label}</span>
          <span class="col-count">{byColumn[col.id]?.length ?? 0}</span>
        </div>
        <button class="col-add" on:click={() => onAddWithDate && onAddWithDate('')} title="추가">
          <svg viewBox="0 0 14 14" fill="none" width="12" height="12"><path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>

      <!-- 카드 목록 -->
      <div class="card-list">
        {#each (byColumn[col.id] ?? []) as todo (todo.id)}
          <div
            class="board-card"
            class:dragging={draggingId === todo.id}
            class:overdue={isOverdue(todo)}
            draggable="true"
            on:dragstart={(e) => onDragStart(e, todo.id)}
            on:dragend={onDragEnd}
            role="button"
            tabindex="0"
            on:keydown
          >
            <!-- 카드 상단: 카테고리 + 우선순위 -->
            <div class="card-top">
              <span class="card-cat" style="background: color-mix(in srgb, {categoryColors[todo.category]} 15%, transparent); color:{categoryColors[todo.category]}">
                {categoryIcons[todo.category]} {todo.category === 'work' ? '업무' : todo.category === 'personal' ? '개인' : todo.category === 'health' ? '건강' : todo.category === 'study' ? '학습' : '기타'}
              </span>
              <span class="card-priority" style="background: color-mix(in srgb, {priorityColor[todo.priority]} 12%, transparent); color:{priorityColor[todo.priority]}">
                {priorityLabel[todo.priority]}
              </span>
            </div>

            <!-- 제목 -->
            <p class="card-title">{todo.title}</p>
            {#if todo.description}
              <p class="card-desc">{todo.description}</p>
            {/if}

            <!-- 온라인 배지 + 링크 -->
            {#if todo.meetingType === 'online'}
              <div class="card-online">
                <span class="online-badge">
                  <svg viewBox="0 0 10 10" fill="none" width="8" height="8"><rect x="1" y="2.5" width="8" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M3.5 5h3M5 4v2" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
                  온라인
                </span>
                {#if todo.meetingUrl}
                  <a href={todo.meetingUrl} target="_blank" rel="noopener noreferrer" class="online-link" on:click|stopPropagation>
                    참여 →
                  </a>
                {/if}
              </div>
            {/if}

            <!-- 날짜 -->
            {#if formatDate(todo)}
              <div class="card-date" class:red={isOverdue(todo)}>
                <svg viewBox="0 0 12 12" fill="none" width="10" height="10"><rect x="1.5" y="2" width="9" height="8.5" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M4 1v2M8 1v2M1.5 5.5h9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
                {formatDate(todo)}
                {#if isOverdue(todo)}<span class="overdue-tag">지연</span>{/if}
              </div>
            {/if}

            <!-- 참여자 아바타 -->
            {#if todo.members && todo.members.length > 0}
              <div class="card-members">
                <MemberAvatars members={todo.members} max={4} size={22} />
              </div>
            {/if}

            <!-- 카드 하단: 이동 버튼 -->
            <div class="card-actions">
              <button class="card-edit" on:click|stopPropagation={() => dispatch('edit', todo)}>
                <svg viewBox="0 0 14 14" fill="none" width="11" height="11"><path d="M9.5 1.5l3 3-7 7H2.5v-3l7-7z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
              </button>
              <div class="move-btns">
                {#each columns.filter(c => c.id !== col.id) as target}
                  <button
                    class="move-btn"
                    style="--c:{target.color}"
                    on:click|stopPropagation={() => moveTo(todo.id, target.id)}
                    title={target.label + '로 이동'}
                  >
                    {target.icon}
                  </button>
                {/each}
              </div>
            </div>
          </div>
        {/each}

        <!-- 드롭 힌트 -->
        {#if dragOverCol === col.id && draggingId}
          <div class="drop-hint">여기에 놓기</div>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .board-wrap {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    height: 100%;
    min-height: 0;
    align-items: start;
  }

  /* 컬럼 */
  .col {
    background: var(--bg-3);
    border: 1px solid var(--border);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    gap: 0;
    transition: border-color 0.15s;
    min-height: 200px;
  }
  .col.drag-over {
    border-color: var(--accent);
    background: rgba(124,106,245,0.05);
  }

  .col-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px 10px;
    border-bottom: 1px solid var(--border);
  }
  .col-title { display: flex; align-items: center; gap: 7px; }
  .col-icon { font-size: 14px; }
  .col-label { font-size: 13px; font-weight: 700; color: var(--text); }
  .col-count {
    font-size: 11px; font-weight: 600;
    background: var(--surface-2); color: var(--text-3);
    padding: 1px 7px; border-radius: 99px;
  }
  .col-add {
    width: 26px; height: 26px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-3); transition: all 0.15s; cursor: pointer;
    background: none; border: none;
  }
  .col-add:hover { background: var(--surface-2); color: var(--text); }

  /* 카드 목록 */
  .card-list {
    padding: 10px 10px 10px;
    display: flex; flex-direction: column; gap: 8px;
    min-height: 80px;
  }

  /* 보드 카드 */
  .board-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 14px;
    display: flex; flex-direction: column; gap: 8px;
    cursor: grab;
    transition: all 0.15s;
    animation: cardIn 0.2s ease;
  }
  .board-card:hover {
    border-color: var(--border-hover);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
  }
  .board-card.dragging {
    opacity: 0.4;
    cursor: grabbing;
  }
  .board-card.overdue {
    border-color: rgba(255,92,124,0.3);
  }

  .card-top { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
  .card-cat {
    font-size: 10px; font-weight: 600;
    padding: 2px 8px; border-radius: 99px;
  }
  .card-priority {
    font-size: 10px; font-weight: 600;
    padding: 2px 8px; border-radius: 99px;
  }

  .card-title {
    font-size: 13px; font-weight: 600; color: var(--text); line-height: 1.4;
  }
  .card-desc {
    font-size: 11px; color: var(--text-3); line-height: 1.4;
  }

  /* 온라인 */
  .card-online { display: flex; align-items: center; gap: 6px; }
  .online-badge {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 10px; font-weight: 600; color: var(--low);
    background: rgba(92,255,176,0.1); padding: 2px 7px; border-radius: 99px;
  }
  .online-link {
    font-size: 10px; font-weight: 600; color: var(--low);
    text-decoration: none; opacity: 0.7; transition: opacity 0.15s;
  }
  .online-link:hover { opacity: 1; }

  /* 날짜 */
  .card-date {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; color: var(--text-3); font-weight: 500;
  }
  .card-date.red { color: var(--high); }
  .overdue-tag {
    font-size: 9px; font-weight: 700;
    background: var(--high-bg); color: var(--high);
    padding: 1px 5px; border-radius: 4px;
  }

  /* 카드 액션 */
  .card-actions {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 4px; border-top: 1px solid var(--border);
    opacity: 0; transition: opacity 0.15s;
  }
  .board-card:hover .card-actions { opacity: 1; }

  .card-edit {
    width: 24px; height: 24px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-3); transition: all 0.15s; cursor: pointer;
    background: none; border: none;
  }
  .card-edit:hover { background: rgba(124,106,245,0.15); color: var(--accent); }

  .move-btns { display: flex; gap: 3px; }
  .move-btn {
    width: 24px; height: 24px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: var(--c); cursor: pointer;
    background: color-mix(in srgb, var(--c) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--c) 20%, transparent);
    transition: all 0.15s;
  }
  .move-btn:hover {
    background: color-mix(in srgb, var(--c) 20%, transparent);
    transform: scale(1.1);
  }

  /* 드롭 힌트 */
  .drop-hint {
    border: 2px dashed var(--accent);
    border-radius: 10px; padding: 12px;
    text-align: center; font-size: 12px; color: var(--accent);
    background: rgba(124,106,245,0.05);
    animation: pulse 1s ease infinite alternate;
  }

  /* 참여자 아바타 */
  .card-members {
    padding-top: 4px;
    display: flex;
    align-items: center;
  }

  @keyframes cardIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }
  @keyframes pulse { from { opacity: 0.6; } to { opacity: 1; } }

  /* 반응형 */
  @media (max-width: 1100px) {
    .board-wrap { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 620px) {
    .board-wrap { grid-template-columns: 1fr; }
  }
</style>
