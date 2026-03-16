<script>
  import { filteredTodos, todos, filter, selectedCategory, searchQuery, stats, loadTodos, loading, dbError } from '$lib/stores/todos';
  import { loadProfile } from '$lib/stores/profile';
  import { loadAttendance } from '$lib/stores/attendance';
  import { initNotifications, startNotificationChecker } from '$lib/stores/notifications';
  import { onMount } from 'svelte';

  onMount(async () => {
    await loadProfile();
    await loadAttendance();
    await loadTodos();
    await initNotifications();
    startNotificationChecker();
  });
  import TodoCard from '$lib/components/TodoCard.svelte';
  import AddTodoModal from '$lib/components/AddTodoModal.svelte';
  import CalendarView from '$lib/components/CalendarView.svelte';
  import BoardView from '$lib/components/BoardView.svelte';
  import ProfilePanel from '$lib/components/ProfilePanel.svelte';
  import AttendancePanel from '$lib/components/AttendancePanel.svelte';

  let showModal = false;
  let editTodo = null;
  let activeView = 'list'; // 'list' | 'calendar' | 'board'
  let presetDate = '';

  function openEdit(todo) { editTodo = todo; showModal = true; }
  function closeModal() { showModal = false; editTodo = null; presetDate = ''; }
  function openAddWithDate(date) { presetDate = date; showModal = true; }

  const today = new Date();
  const dayNames = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const categories = [
    { value: 'all',      label: '전체', icon: '◉' },
    { value: 'personal', label: '개인', icon: '✨' },
    { value: 'work',     label: '업무', icon: '💼' },
    { value: 'health',   label: '건강', icon: '💚' },
    { value: 'study',    label: '학습', icon: '📚' },
    { value: 'other',    label: '기타', icon: '🎯' }
  ];

  $: todayStr = today.toISOString().split('T')[0];
  $: todayTodos = $todos.filter(t => t.dueDate === todayStr);
  $: todayDone = todayTodos.filter(t => t.completed).length;
</script>

<svelte:head><title>LevelRoutine</title></svelte:head>

<div class="app">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-mark">◈</span>
      <span class="brand-name">LevelRoutine</span>
    </div>

    <div class="today-card">
      <div class="today-top">
        <div class="today-date">
          <span class="today-num">{today.getDate()}</span>
          <div>
            <div class="today-month">{months[today.getMonth()]} {today.getFullYear()}</div>
            <div class="today-day">{dayNames[today.getDay()]}</div>
          </div>
        </div>
        {#if todayTodos.length > 0}
          <div class="today-ring">
            <svg viewBox="0 0 36 36" width="44" height="44">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="3"/>
              <circle cx="18" cy="18" r="15" fill="none" stroke="#fff" stroke-width="3"
                stroke-dasharray="{(todayDone / todayTodos.length) * 94.2} 94.2"
                stroke-linecap="round" transform="rotate(-90 18 18)"
              />
            </svg>
            <span class="ring-text">{todayDone}/{todayTodos.length}</span>
          </div>
        {/if}
      </div>
      {#if todayTodos.length > 0}
        <div class="today-progress">
          <div class="today-bar">
            <div class="today-fill" style="width: {todayTodos.length ? (todayDone/todayTodos.length*100) : 0}%"></div>
          </div>
          <span class="today-pct">{todayTodos.length ? Math.round(todayDone/todayTodos.length*100) : 0}%</span>
        </div>
      {:else}
        <p class="today-empty">오늘 일정 없음</p>
      {/if}
    </div>

    <ProfilePanel />
    <AttendancePanel />

    <div class="stats-row">
      <div class="stat"><span class="stat-n accent">{$stats.active}</span><span class="stat-l">진행중</span></div>
      <div class="stat-div"></div>
      <div class="stat"><span class="stat-n green">{$stats.completed}</span><span class="stat-l">완료</span></div>
      <div class="stat-div"></div>
      <div class="stat"><span class="stat-n red">{$stats.highPriority}</span><span class="stat-l">긴급</span></div>
    </div>

    <nav class="cat-nav">
      <p class="nav-section">카테고리</p>
      {#each categories as cat}
        <button
          class="cat-btn"
          class:active={$selectedCategory === cat.value}
          on:click={() => selectedCategory.set(cat.value)}
        >
          <span class="cat-icon">{cat.icon}</span>
          <span class="cat-lbl">{cat.label}</span>
          <span class="cat-cnt">
            {cat.value === 'all' ? $stats.total : $todos.filter(t => t.category === cat.value).length}
          </span>
        </button>
      {/each}
    </nav>

    <button class="fab" on:click={() => showModal = true}>
      <svg viewBox="0 0 16 16" fill="none" width="18" height="18">
        <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
      </svg>
      새 일정 추가
    </button>
  </aside>

  <!-- Main -->
  <main class="main" class:board-main={activeView === 'board'}>
    <!-- Top bar -->
    <header class="topbar">
      <div class="view-tabs">
        <button class="vtab" class:active={activeView === 'list'} on:click={() => activeView = 'list'}>
          <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          리스트
        </button>
        <button class="vtab" class:active={activeView === 'calendar'} on:click={() => activeView = 'calendar'}>
          <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M5 2v2M11 2v2M2 7h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          캘린더
        </button>
        <button class="vtab" class:active={activeView === 'board'} on:click={() => activeView = 'board'}>
          <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
            <rect x="1.5" y="2" width="4" height="12" rx="1.5" stroke="currentColor" stroke-width="1.6"/>
            <rect x="6.5" y="2" width="4" height="9" rx="1.5" stroke="currentColor" stroke-width="1.6"/>
            <rect x="11.5" y="2" width="3" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/>
          </svg>
          보드
        </button>
      </div>

      {#if activeView === 'list'}
        <div class="search-box">
          <svg viewBox="0 0 16 16" fill="none" width="14" height="14" class="s-icon"><circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.6"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          <input type="text" placeholder="검색..." bind:value={$searchQuery} />
          {#if $searchQuery}
            <button class="s-clear" on:click={() => searchQuery.set('')}>×</button>
          {/if}
        </div>
      {/if}

      {#if activeView === 'board'}
        <div class="board-hint">
          <svg viewBox="0 0 14 14" fill="none" width="12" height="12"><path d="M7 1l1.5 3.5L12 5l-2.5 2.5.6 3.5L7 9.5 3.9 11l.6-3.5L2 5l3.5-.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
          카드를 드래그해서 이동하세요
        </div>
      {/if}
    </header>

    {#if $dbError}
      <div class="db-error">
        <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3M8 10v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        DB 연결 오류: {$dbError}
      </div>
    {/if}

    {#if $loading}
      <div class="db-loading">
        <div class="spinner"></div>
        <span>불러오는 중...</span>
      </div>
    {:else if activeView === 'list'}
      <div class="filter-tabs">
        {#each [['all','전체'], ['active','진행중'], ['completed','완료']] as [v, l]}
          <button class="ftab" class:active={$filter === v} on:click={() => filter.set(v)}>{l}</button>
        {/each}
        <span class="filter-count">{$filteredTodos.length}개</span>
      </div>
      <div class="list">
        {#if $filteredTodos.length === 0}
          <div class="empty">
            <div class="empty-emoji">{$filter === 'completed' ? '🎉' : '📋'}</div>
            <p>{$filter === 'completed' ? '완료된 일정이 없어요' : '일정이 없어요'}</p>
            <span>새 일정을 추가해보세요</span>
          </div>
        {:else}
          {#each $filteredTodos as todo (todo.id)}
            <TodoCard {todo} on:edit={(e) => openEdit(e.detail)} />
          {/each}
        {/if}
      </div>

    {:else if activeView === 'calendar'}
      <div class="cal-section">
        <CalendarView onAddWithDate={openAddWithDate} />
      </div>

    {:else}
      <div class="board-section">
        <BoardView onAddWithDate={openAddWithDate} on:edit={(e) => openEdit(e.detail)} />
      </div>
    {/if}
  </main>
</div>

{#if showModal}
  <AddTodoModal editTodo={editTodo} presetDate={presetDate} on:close={closeModal} />
{/if}

<style>
  .app { display: flex; min-height: 100vh; }

  .sidebar {
    width: 272px; min-width: 272px;
    background: var(--bg-2); border-right: 1px solid var(--border);
    padding: 28px 20px;
    display: flex; flex-direction: column; gap: 24px;
    position: sticky; top: 0; height: 100vh; overflow-y: auto;
  }

  .brand { display: flex; align-items: center; gap: 10px; padding: 0 4px; }
  .brand-mark { font-size: 20px; color: var(--accent); filter: drop-shadow(0 0 6px var(--accent-glow)); }
  .brand-name {
    font-family: 'Clash Display', sans-serif; font-size: 20px; font-weight: 700; letter-spacing: -0.03em;
    background: linear-gradient(120deg, #fff 30%, var(--accent-2));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }

  .today-card {
    background: linear-gradient(135deg, var(--accent) 0%, #a78bfa 100%);
    border-radius: 16px; padding: 18px 18px 14px;
  }
  .today-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .today-date { display: flex; align-items: center; gap: 12px; }
  .today-num { font-family: 'Clash Display', sans-serif; font-size: 42px; font-weight: 700; color: #fff; line-height: 1; }
  .today-month { font-size: 12px; color: rgba(255,255,255,0.75); font-weight: 500; }
  .today-day { font-size: 14px; color: #fff; font-weight: 600; }
  .today-ring { position: relative; display: flex; align-items: center; justify-content: center; }
  .ring-text { position: absolute; font-size: 10px; font-weight: 700; color: #fff; }
  .today-progress { display: flex; align-items: center; gap: 10px; }
  .today-bar { flex: 1; height: 4px; background: rgba(255,255,255,0.25); border-radius: 99px; overflow: hidden; }
  .today-fill { height: 100%; background: #fff; border-radius: 99px; transition: width 0.5s ease; }
  .today-pct { font-size: 12px; color: rgba(255,255,255,0.85); font-weight: 600; min-width: 32px; text-align: right; }
  .today-empty { font-size: 13px; color: rgba(255,255,255,0.6); }

  .stats-row {
    display: flex; align-items: center;
    background: var(--bg-3); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px;
  }
  .stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .stat-div { width: 1px; height: 28px; background: var(--border); }
  .stat-n { font-family: 'Clash Display', sans-serif; font-size: 22px; font-weight: 700; line-height: 1; }
  .stat-n.accent { color: var(--accent-2); }
  .stat-n.green  { color: var(--low); }
  .stat-n.red    { color: var(--high); }
  .stat-l { font-size: 11px; color: var(--text-3); font-weight: 500; }

  .nav-section { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: var(--text-3); text-transform: uppercase; padding: 0 6px; margin-bottom: 2px; }
  .cat-nav { display: flex; flex-direction: column; gap: 1px; }
  .cat-btn { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 10px; font-size: 13px; color: var(--text-2); transition: all 0.15s; cursor: pointer; background: none; border: none; text-align: left; }
  .cat-btn:hover { background: var(--surface); color: var(--text); }
  .cat-btn.active { background: rgba(124,106,245,0.1); color: var(--accent-2); }
  .cat-icon { font-size: 15px; }
  .cat-lbl { flex: 1; }
  .cat-cnt { font-size: 11px; background: var(--bg-3); padding: 2px 7px; border-radius: 99px; color: var(--text-3); }

  .fab {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 13px; border-radius: 12px; background: var(--accent); color: #fff;
    font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s;
  }
  .fab:hover { background: var(--accent-2); box-shadow: 0 4px 20px var(--accent-glow); transform: translateY(-1px); }

  /* Main */
  .main { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
  .board-main { height: 100vh; }

  .topbar { display: flex; align-items: center; gap: 14px; padding: 24px 28px 0; flex-wrap: wrap; }

  .view-tabs { display: flex; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 3px; gap: 2px; }
  .vtab { display: flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; color: var(--text-3); transition: all 0.15s; cursor: pointer; background: none; border: none; }
  .vtab:hover { color: var(--text); }
  .vtab.active { background: var(--surface-2); color: var(--text); }

  .search-box { flex: 1; max-width: 320px; display: flex; align-items: center; gap: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 0 14px; transition: all 0.15s; }
  .search-box:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
  .s-icon { color: var(--text-3); flex-shrink: 0; }
  .search-box input { flex: 1; background: none; border: none; outline: none; padding: 10px 0; font-size: 13px; color: var(--text); font-family: inherit; }
  .search-box input::placeholder { color: var(--text-3); }
  .s-clear { color: var(--text-3); font-size: 16px; cursor: pointer; background: none; border: none; transition: color 0.15s; }
  .s-clear:hover { color: var(--text); }

  .board-hint { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-3); }

  .filter-tabs { display: flex; align-items: center; gap: 4px; padding: 16px 28px 0; }
  .ftab { padding: 7px 16px; border-radius: 99px; font-size: 13px; font-weight: 500; color: var(--text-3); transition: all 0.15s; cursor: pointer; background: none; border: none; }
  .ftab:hover { color: var(--text); background: var(--surface); }
  .ftab.active { background: var(--surface); color: var(--text); border: 1px solid var(--border); }
  .filter-count { margin-left: auto; font-size: 12px; color: var(--text-3); }

  .list { flex: 1; padding: 16px 28px 28px; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; }

  .empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 80px 0; }
  .empty-emoji { font-size: 44px; margin-bottom: 4px; }
  .empty p { font-size: 15px; font-weight: 600; color: var(--text-2); }
  .empty span { font-size: 13px; color: var(--text-3); }

  .cal-section { padding: 20px 28px 28px; overflow-y: auto; }

  /* 보드 */
  .board-section {
    flex: 1; padding: 20px 28px 28px;
    overflow-x: auto; overflow-y: auto;
    min-height: 0;
  }

  .db-error {
    display: flex; align-items: center; gap: 8px;
    margin: 16px 28px 0;
    padding: 12px 16px; border-radius: 10px;
    background: var(--high-bg); border: 1px solid rgba(255,92,124,0.3);
    font-size: 13px; color: var(--high);
  }

  .db-loading {
    display: flex; align-items: center; justify-content: center;
    gap: 12px; flex: 1; color: var(--text-3); font-size: 14px;
    padding: 80px 0;
  }
  .spinner {
    width: 20px; height: 20px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 720px) {
    .sidebar { display: none; }
    .topbar { padding: 16px 16px 0; }
    .filter-tabs { padding: 12px 16px 0; }
    .list { padding: 12px 16px 20px; }
    .cal-section, .board-section { padding: 16px; }
  }
</style>
