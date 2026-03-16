<script>
  import { onMount } from 'svelte';
  import { attendance, attendanceInfo } from '$lib/stores/attendance';

  let showStreak = false;
  let justChecked = false;

  onMount(() => {
    // 앱 진입 시 자동 체크인
    if (!$attendanceInfo.isToday) {
      attendance.checkIn();
      justChecked = true;
      showStreak = true;
      setTimeout(() => { showStreak = false; }, 3000);
    }
  });

  // 최근 7일 표시용
  function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const str = d.toISOString().split('T')[0];
      const dayName = ['일','월','화','수','목','금','토'][d.getDay()];
      days.push({ str, dayName, checked: $attendanceInfo.history.includes(str) });
    }
    return days;
  }

  $: last7 = getLast7Days();
</script>

<!-- 스트릭 토스트 -->
{#if showStreak && justChecked}
  <div class="streak-toast">
    <span class="streak-fire">🔥</span>
    <div>
      <p class="streak-title">출석 완료!</p>
      <p class="streak-sub">{$attendanceInfo.streak}일 연속 출석 · +20 XP</p>
    </div>
  </div>
{/if}

<div class="attendance-card">
  <div class="att-header">
    <div class="att-title-row">
      <span class="att-icon">🔥</span>
      <span class="att-title">출석 스트릭</span>
    </div>
    <div class="att-streak">
      <span class="streak-num">{$attendanceInfo.streak}</span>
      <span class="streak-unit">일</span>
    </div>
  </div>

  <!-- 최근 7일 도트 -->
  <div class="week-row">
    {#each last7 as day}
      <div class="day-item">
        <div class="day-dot" class:checked={day.checked} class:today={day.str === new Date().toISOString().split('T')[0]}></div>
        <span class="day-label">{day.dayName}</span>
      </div>
    {/each}
  </div>

  <div class="att-footer">
    <span class="total-days">누적 <strong>{$attendanceInfo.totalDays}일</strong></span>
    {#if $attendanceInfo.isToday}
      <span class="checked-badge">✓ 오늘 출석</span>
    {/if}
  </div>
</div>

<style>
  /* 토스트 */
  .streak-toast {
    position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
    background: var(--surface); border: 1px solid var(--border-hover);
    border-radius: 14px; padding: 12px 20px;
    display: flex; align-items: center; gap: 12px;
    z-index: 999; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    animation: toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1), toastOut 0.3s ease 2.7s forwards;
    pointer-events: none;
  }
  .streak-fire { font-size: 24px; }
  .streak-title { font-size: 14px; font-weight: 700; color: var(--text); }
  .streak-sub { font-size: 12px; color: var(--medium); }

  /* 카드 */
  .attendance-card {
    background: var(--bg-3); border: 1px solid var(--border);
    border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;
  }

  .att-header { display: flex; align-items: center; justify-content: space-between; }
  .att-title-row { display: flex; align-items: center; gap: 6px; }
  .att-icon { font-size: 15px; }
  .att-title { font-size: 12px; font-weight: 700; color: var(--text-2); letter-spacing: 0.02em; }

  .att-streak { display: flex; align-items: baseline; gap: 2px; }
  .streak-num {
    font-family: 'Clash Display', sans-serif; font-size: 26px; font-weight: 700;
    color: var(--medium); line-height: 1;
  }
  .streak-unit { font-size: 12px; color: var(--text-3); font-weight: 500; }

  /* 7일 도트 */
  .week-row { display: flex; justify-content: space-between; gap: 2px; }
  .day-item { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; min-width: 0; }
  .day-dot {
    width: 22px; height: 22px; border-radius: 50%;
    background: var(--surface-2); border: 1.5px solid var(--border);
    transition: all 0.2s; flex-shrink: 0;
  }
  .day-dot.checked {
    background: var(--medium); border-color: var(--medium);
    box-shadow: 0 0 6px rgba(255,170,92,0.4);
  }
  .day-dot.today:not(.checked) {
    border-color: var(--accent); border-style: dashed;
  }
  .day-label { font-size: 9px; color: var(--text-3); font-weight: 600; }

  .att-footer { display: flex; align-items: center; justify-content: space-between; }
  .total-days { font-size: 11px; color: var(--text-3); }
  .total-days strong { color: var(--text-2); }
  .checked-badge {
    font-size: 10px; font-weight: 700; color: var(--low);
    background: rgba(92,255,176,0.1); border: 1px solid rgba(92,255,176,0.25);
    padding: 2px 8px; border-radius: 99px;
  }

  @keyframes toastIn  { from { opacity: 0; transform: translateX(-50%) translateY(14px) scale(0.92); } to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
  @keyframes toastOut { to { opacity: 0; transform: translateX(-50%) translateY(8px); } }
</style>