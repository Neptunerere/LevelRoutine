<script>
  import { todos, getTodosForDate } from '$lib/stores/todos';
  import KakaoMap from './KakaoMap.svelte';

  let expandedId = null;
  function toggleExpand(id) { expandedId = expandedId === id ? null : id; }

  export let onAddWithDate = null;

  const today = new Date();
  let currentYear  = today.getFullYear();
  let currentMonth = today.getMonth();
  const todayStr   = today.toISOString().split('T')[0];

  const WEEKDAYS = ['일','월','화','수','목','금','토'];
  const MONTHS   = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

  const catColor = { work:'#7c6af5', personal:'#f57cb4', health:'#5cffb0', study:'#5cb4ff', other:'#ffaa5c' };

  $: daysInMonth   = new Date(currentYear, currentMonth + 1, 0).getDate();
  $: firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  $: prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  $: calendarDays = (() => {
    const days = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--)
      days.push({ day: prevMonthDays - i, current: false, date: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      days.push({ day: d, current: true, date });
    }
    const rem = 42 - days.length;
    for (let i = 1; i <= rem; i++)
      days.push({ day: i, current: false, date: null });
    return days;
  })();


  let selectedDate = null;

  function handleDayClick(day) {
    if (!day.current) return;
    selectedDate = selectedDate === day.date ? null : day.date;
  }

  $: selectedTodos = selectedDate ? getTodosForDate($todos, selectedDate) : [];

  function formatSel(d) {
    if (!d) return '';
    const dt = new Date(d);
    return `${dt.getMonth()+1}월 ${dt.getDate()}일 (${WEEKDAYS[dt.getDay()]})`;
  }

  function formatTime(t) {
    if (!t.startTime) return '';
    return t.endTime ? `${t.startTime} ~ ${t.endTime}` : t.startTime;
  }

  function formatRangeDates(t) {
    if (!t.startDate || !t.endDate) return '';
    const days = Math.round((new Date(t.endDate) - new Date(t.startDate)) / 86400000) + 1;
    return `${t.startDate.slice(5).replace('-','/')} → ${t.endDate.slice(5).replace('-','/')}  (${days}일)`;
  }

  function prevMonth() { if (currentMonth === 0) { currentMonth = 11; currentYear--; } else currentMonth--; }
  function nextMonth() { if (currentMonth === 11) { currentMonth = 0; currentYear++; } else currentMonth++; }
</script>

<div class="cal-wrap">
  <!-- Header -->
  <div class="cal-header">
    <button class="nav" on:click={prevMonth}>
      <svg viewBox="0 0 16 16" fill="none" width="15" height="15"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <h2 class="month-title">
      <span class="yr">{currentYear}</span>
      <span class="mo">{MONTHS[currentMonth]}</span>
    </h2>
    <button class="nav" on:click={nextMonth}>
      <svg viewBox="0 0 16 16" fill="none" width="15" height="15"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </div>

  <!-- Weekday headers -->
  <div class="weekdays">
    {#each WEEKDAYS as w, i}
      <div class="wd" class:sun={i===0} class:sat={i===6}>{w}</div>
    {/each}
  </div>

  <!-- Grid -->
  <div class="grid">
    {#each calendarDays as day}
      {@const allTodos = day.current ? getTodosForDate($todos, day.date) : []}
      <button
        class="cell"
        class:other={!day.current}
        class:today={day.date === todayStr}
        class:sel={selectedDate === day.date}
        on:click={() => handleDayClick(day)}
      >
        <span class="dnum">{day.day}</span>
        {#if allTodos.length > 0}
          <div class="dots">
            {#each allTodos.slice(0,4) as t}
              <span
                class="dot"
                style="background:{catColor[t.category]}"
                class:done={t.completed}
                class:square={t.scheduleType === 'range'}
                class:diamond={t.scheduleType === 'timed'}
              ></span>
            {/each}
            {#if allTodos.length > 4}<span class="dot-extra">+{allTodos.length - 4}</span>{/if}
          </div>
        {/if}
      </button>
    {/each}
  </div>

  <!-- Selected day detail -->
  {#if selectedDate}
    <div class="day-detail">
      <div class="detail-hd">
        <span class="detail-date">{formatSel(selectedDate)}</span>
        <button class="add-here" on:click={() => onAddWithDate && onAddWithDate(selectedDate)}>
          <svg viewBox="0 0 14 14" fill="none" width="11" height="11"><path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          추가
        </button>
      </div>

      {#if selectedTodos.length === 0}
        <p class="no-ev">일정 없음 — 추가해보세요 ✦</p>
      {:else}
        <div class="ev-list">
          {#each selectedTodos as t}
            <div class="ev-item" class:done={t.completed} class:expanded={expandedId === t.id}>
              <div class="ev-main" on:click={() => t.place && toggleExpand(t.id)} on:keydown role="button" tabindex="0" style={t.place ? 'cursor:pointer' : ''}>
                <span class="ev-dot" style="background:{catColor[t.category]}"></span>
                <div class="ev-body">
                  <span class="ev-title">{t.title}</span>
                  <div class="ev-meta-row">
                    {#if t.scheduleType === 'timed' && t.startTime}
                      <span class="ev-time">⏱ {formatTime(t)}</span>
                    {:else if t.scheduleType === 'range'}
                      <span class="ev-time">↔ {formatRangeDates(t)}</span>
                    {/if}
                    {#if t.place}
                      <span class="ev-place">
                        <svg viewBox="0 0 10 10" fill="none" width="9" height="9"><path d="M5 1C3.62 1 2.5 2.12 2.5 3.5c0 2.08 2.5 5.5 2.5 5.5s2.5-3.42 2.5-5.5C7.5 2.12 6.38 1 5 1z" stroke="currentColor" stroke-width="1.1" fill="currentColor" fill-opacity="0.2"/></svg>
                        {t.place.name}
                      </span>
                    {/if}
                  </div>
                </div>
                {#if t.priority === 'high' && !t.completed}
                  <span class="ev-urgent">긴급</span>
                {/if}
                <button class="ev-check" on:click|stopPropagation={() => todos.toggle(t.id)}>
                  {#if t.completed}✓{:else}○{/if}
                </button>
              </div>
              {#if t.place && expandedId === t.id}
                <div class="ev-map">
                  <KakaoMap lat={t.place.lat} lng={t.place.lng} name={t.place.name} height="130px" />
                  <p class="ev-addr">📍 {t.place.address}</p>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .cal-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; }

  .cal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 22px 14px; }
  .month-title { display: flex; align-items: baseline; gap: 8px; }
  .yr { font-size: 13px; color: var(--text-3); }
  .mo { font-family: 'Clash Display', sans-serif; font-size: 22px; font-weight: 700; letter-spacing: -0.03em; }
  .nav {
    width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center;
    justify-content: center; color: var(--text-3); transition: all 0.15s;
    cursor: pointer; background: none; border: none;
  }
  .nav:hover { background: var(--surface-2); color: var(--text); }

  .weekdays { display: grid; grid-template-columns: repeat(7,1fr); padding: 0 14px 6px; }
  .wd { text-align: center; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; color: var(--text-3); padding: 3px 0; }
  .wd.sun { color: #ff7070; }
  .wd.sat { color: #7096ff; }

  .grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 1px; padding: 0 12px 14px; }

  .cell {
    min-height: 72px; display: flex; flex-direction: column; align-items: center;
    padding: 6px 2px 4px; border-radius: 10px; cursor: pointer; border: none;
    background: none; transition: all 0.15s; gap: 2px; overflow: hidden; position: relative;
  }
  .cell:hover:not(.other) { background: var(--surface-2); }
  .cell.other { opacity: 0.18; cursor: default; }
  .cell.sel { background: var(--accent-glow) !important; outline: 1.5px solid var(--accent); }
  .cell.today .dnum {
    background: var(--accent); color: #fff; width: 22px; height: 22px;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
  }
  .dnum { font-size: 12px; font-weight: 500; color: var(--text); width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; line-height: 1; }
  .other .dnum { color: var(--text-3); }

  /* Range bars */

  /* Dots — ◎ 당일: circle, ⏱ 시간: diamond, ↔ 기간: rounded square */
  .dots { display: flex; gap: 3px; align-items: center; justify-content: center; flex-wrap: wrap; }
  .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; transition: opacity 0.15s; }
  .dot.square { border-radius: 2px; }
  .dot.diamond { border-radius: 1px; transform: rotate(45deg); width: 5px; height: 5px; }
  .dot.done { opacity: 0.25; }
  .dot-extra { font-size: 9px; color: var(--text-3); }

  /* Detail panel */
  .day-detail { border-top: 1px solid var(--border); padding: 14px 20px 16px; background: var(--bg-2); animation: sd 0.2s ease; }
  .detail-hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .detail-date { font-size: 13px; font-weight: 600; color: var(--text-2); }
  .add-here {
    display: flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 8px;
    background: rgba(124,106,245,0.14); color: var(--accent); font-size: 12px; font-weight: 600;
    cursor: pointer; border: none; transition: all 0.15s;
  }
  .add-here:hover { background: rgba(124,106,245,0.25); }
  .no-ev { font-size: 13px; color: var(--text-3); text-align: center; padding: 6px 0; }

  .ev-list { display: flex; flex-direction: column; gap: 6px; }
  .ev-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 9px; background: var(--surface); border: 1px solid var(--border); }
  .ev-item.done { opacity: 0.45; }
  .ev-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .ev-body { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .ev-title { font-size: 13px; font-weight: 500; }
  .ev-item.done .ev-title { text-decoration: line-through; }
  .ev-time { font-size: 11px; color: var(--text-3); }
  .ev-urgent { font-size: 10px; font-weight: 700; color: var(--high); background: var(--high-bg); padding: 2px 7px; border-radius: 99px; }
  .ev-check { font-size: 13px; color: var(--text-3); cursor: pointer; background: none; border: none; padding: 2px 4px; transition: color 0.15s; }
  .ev-check:hover { color: var(--accent); }

  .ev-main { display: flex; align-items: center; gap: 8px; }
  .ev-meta-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .ev-place { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; color: var(--low); font-weight: 500; }
  .ev-map { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
  .ev-addr { font-size: 11px; color: var(--text-3); padding: 0 2px; }
  .ev-item.expanded { background: var(--bg-3); }

  @keyframes sd { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: none; } }
</style>
