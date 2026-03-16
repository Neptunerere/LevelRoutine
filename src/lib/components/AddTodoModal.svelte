<script>
  import { todos } from '$lib/stores/todos';
  import { createEventDispatcher } from 'svelte';
  import MemberAvatars from './MemberAvatars.svelte';

  export let editTodo = null;
  export let presetDate = '';

  const dispatch = createEventDispatcher();

  let scheduleType = editTodo?.scheduleType ?? 'single';
  let title        = editTodo?.title ?? '';
  let description  = editTodo?.description ?? '';
  let priority     = editTodo?.priority ?? 'medium';
  let category     = editTodo?.category ?? 'personal';
  let meetingType  = editTodo?.meetingType ?? 'offline';
  let meetingUrl   = editTodo?.meetingUrl ?? '';
  let members      = editTodo?.members ? [...editTodo.members] : [];
  let memberInput  = '';
  let repeatType   = editTodo?.repeatType  ?? 'none';
  let repeatUntil  = editTodo?.repeatUntil ?? '';

  let dueDate   = editTodo?.dueDate   ?? presetDate ?? '';
  let startTime = editTodo?.startTime ?? '';
  let endTime   = editTodo?.endTime   ?? '';
  let startDate = editTodo?.startDate ?? presetDate ?? '';
  let endDate   = editTodo?.endDate   ?? '';

  const typeOptions = [
    { value: 'single', label: '당일', icon: '◎', desc: '특정 날 하루' },
    { value: 'timed',  label: '시간', icon: '⏱', desc: '시작·종료 시간' },
    { value: 'range',  label: '기간', icon: '↔', desc: '여러 날 걸침' }
  ];
  const priorities = [
    { value: 'high',   label: '긴급', color: 'var(--high)' },
    { value: 'medium', label: '보통', color: 'var(--medium)' },
    { value: 'low',    label: '여유', color: 'var(--low)' }
  ];
  const categories = [
    { value: 'personal', label: '개인', icon: '✨' },
    { value: 'work',     label: '업무', icon: '💼' },
    { value: 'health',   label: '건강', icon: '💚' },
    { value: 'study',    label: '학습', icon: '📚' },
    { value: 'other',    label: '기타', icon: '🎯' }
  ];

  function addMember() {
    const name = memberInput.trim();
    if (!name) return;
    if (members.find(m => m.name === name)) { memberInput = ''; return; }
    members = [...members, { name }];
    memberInput = '';
  }

  function removeMember(name) {
    members = members.filter(m => m.name !== name);
  }

  function onMemberKeydown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addMember(); }
  }

  function handleSubmit() {
    if (!title.trim()) return;
    const base = {
      title, description, priority, category, scheduleType,
      meetingType,
      meetingUrl: meetingType === 'online' && meetingUrl.trim() ? meetingUrl.trim() : undefined,
      members:     members.length > 0 ? members : undefined,
      repeatType:  repeatType !== 'none' ? repeatType : undefined,
      repeatUntil: repeatType !== 'none' && repeatUntil ? repeatUntil : undefined,
      completed:   editTodo?.completed ?? false,
      boardStatus: editTodo?.boardStatus ?? undefined,
    };
    let payload;
    if (scheduleType === 'single') {
      payload = { ...base, dueDate: dueDate || undefined, startTime: undefined, endTime: undefined, startDate: undefined, endDate: undefined };
    } else if (scheduleType === 'timed') {
      payload = { ...base, dueDate: dueDate || undefined, startTime: startTime || undefined, endTime: endTime || undefined, startDate: undefined, endDate: undefined };
    } else {
      payload = { ...base, dueDate: undefined, startTime: undefined, endTime: undefined, startDate: startDate || undefined, endDate: endDate || undefined };
    }
    if (editTodo) todos.update(editTodo.id, payload);
    else todos.add(payload);
    dispatch('close');
  }

  // 아바타 색상 미리보기용
  const COLORS = [
    ['#7c6af5','#3d3580'], ['#f57cb4','#7d3060'], ['#5cffb0','#1a6645'],
    ['#5cb4ff','#1a5080'], ['#ffaa5c','#7d4e1a'], ['#ff5c7c','#7d1a30'],
    ['#a78bfa','#4c2d8a'], ['#34d399','#0d6645'], ['#f472b6','#7d1a5c'],
    ['#60a5fa','#1a3d7d'],
  ];
  function colorFor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return COLORS[Math.abs(hash) % COLORS.length][0];
  }
  function initials(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
</script>

<div class="overlay" on:click={() => dispatch('close')} on:keydown role="presentation">
  <div class="modal" on:click|stopPropagation on:keydown role="dialog">

    <div class="modal-header">
      <h2>{editTodo ? '일정 수정' : '새 일정'}</h2>
      <button class="close-btn" on:click={() => dispatch('close')}>
        <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>

    <div class="form">

      <!-- 일정 타입 -->
      <div class="type-selector">
        {#each typeOptions as opt}
          <button class="type-btn" class:active={scheduleType === opt.value} on:click={() => scheduleType = opt.value}>
            <span class="type-icon">{opt.icon}</span>
            <span class="type-label">{opt.label}</span>
            <span class="type-desc">{opt.desc}</span>
          </button>
        {/each}
      </div>

      <!-- 제목 -->
      <div class="field">
        <label for="title">제목</label>
        <input id="title" type="text" bind:value={title} placeholder="어떤 일정인가요?" autofocus />
      </div>

      <!-- 메모 -->
      <div class="field">
        <label for="desc">메모</label>
        <textarea id="desc" bind:value={description} placeholder="추가 설명 (선택)" rows="2"></textarea>
      </div>

      <!-- 날짜/시간 -->
      {#if scheduleType === 'single'}
        <div class="field">
          <label for="due">날짜</label>
          <input id="due" type="date" bind:value={dueDate} />
        </div>
      {:else if scheduleType === 'timed'}
        <div class="date-time-row">
          <div class="field flex-2">
            <label for="timed-date">날짜</label>
            <input id="timed-date" type="date" bind:value={dueDate} />
          </div>
          <div class="field flex-1">
            <label for="start-time">시작</label>
            <input id="start-time" type="time" bind:value={startTime} />
          </div>
          <div class="field flex-1">
            <label for="end-time">종료</label>
            <input id="end-time" type="time" bind:value={endTime} />
          </div>
        </div>
      {:else}
        <div class="date-time-row">
          <div class="field flex-1">
            <label for="start-date">시작일</label>
            <input id="start-date" type="date" bind:value={startDate} />
          </div>
          <div class="range-arrow">→</div>
          <div class="field flex-1">
            <label for="end-date">종료일</label>
            <input id="end-date" type="date" bind:value={endDate} />
          </div>
        </div>
      {/if}

      <!-- 온라인/오프라인 -->
      <div class="field">
        <label>진행 방식</label>
        <div class="meeting-toggle">
          <button class="mtoggle-btn" class:active-offline={meetingType === 'offline'} on:click={() => meetingType = 'offline'}>
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
              <path d="M8 2C5.24 2 3 4.24 3 7c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5z" stroke="currentColor" stroke-width="1.5" fill="currentColor" fill-opacity="0.15"/>
              <circle cx="8" cy="7" r="2" stroke="currentColor" stroke-width="1.4"/>
            </svg>
            오프라인
          </button>
          <button class="mtoggle-btn" class:active-online={meetingType === 'online'} on:click={() => meetingType = 'online'}>
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
              <rect x="2" y="4" width="12" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M5 8h6M8 6v4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
            온라인
          </button>
        </div>
      </div>

      <!-- 온라인 URL -->
      {#if meetingType === 'online'}
        <div class="field" style="animation: fadeIn 0.18s ease">
          <label for="meeting-url">미팅 링크</label>
          <div class="url-input-wrap">
            <svg viewBox="0 0 16 16" fill="none" width="13" height="13" class="url-icon"><path d="M6.5 9.5a4.24 4.24 0 006 0l2-2a4.24 4.24 0 00-6-6L7 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9.5 6.5a4.24 4.24 0 00-6 0l-2 2a4.24 4.24 0 006 6L9 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            <input id="meeting-url" type="url" bind:value={meetingUrl} placeholder="https://zoom.us/j/..." />
          </div>
        </div>
      {/if}

      <!-- ── 반복 ── -->
      <div class="field">
        <label>반복</label>
        <div class="repeat-row">
          <div class="repeat-select-wrap">
            <select bind:value={repeatType} class="repeat-select">
              <option value="none">반복 없음</option>
              <option value="daily">매일</option>
              <option value="weekly">매주</option>
              <option value="monthly">매월</option>
            </select>
          </div>
          {#if repeatType !== 'none'}
            <div class="field flex-1" style="animation: fadeIn 0.15s ease">
              <label for="repeat-until">반복 종료일</label>
              <input id="repeat-until" type="date" bind:value={repeatUntil} />
            </div>
          {/if}
        </div>
      </div>

      <!-- ── 참여자 ── -->
      <div class="field">
        <label>참여자</label>
        <div class="member-input-row">
          <div class="member-input-wrap">
            <svg viewBox="0 0 16 16" fill="none" width="13" height="13" class="member-icon">
              <circle cx="8" cy="5.5" r="3" stroke="currentColor" stroke-width="1.4"/>
              <path d="M2 14c0-3.31 2.69-5 6-5s6 1.69 6 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
            <input
              type="text"
              bind:value={memberInput}
              on:keydown={onMemberKeydown}
              placeholder="이름 입력 후 Enter"
            />
          </div>
          <button class="member-add-btn" on:click={addMember} disabled={!memberInput.trim()}>추가</button>
        </div>

        {#if members.length > 0}
          <div class="member-list">
            {#each members as m}
              <div class="member-chip">
                <span class="member-av" style="background:{colorFor(m.name)}">{initials(m.name)}</span>
                <span class="member-name">{m.name}</span>
                <button class="member-remove" on:click={() => removeMember(m.name)}>×</button>
              </div>
            {/each}
          </div>
          <div class="member-preview">
            <MemberAvatars {members} max={8} size={26} />
            <span class="preview-label">{members.length}명 참여</span>
          </div>
        {/if}
      </div>

      <!-- 우선순위 + 카테고리 -->
      <div class="two-col">
        <div class="field">
          <label>우선순위</label>
          <div class="chips">
            {#each priorities as p}
              <button class="chip" class:active={priority === p.value} style="--c:{p.color}" on:click={() => priority = p.value}>{p.label}</button>
            {/each}
          </div>
        </div>
        <div class="field">
          <label>카테고리</label>
          <div class="chips">
            {#each categories as c}
              <button class="chip" class:active={category === c.value} style="--c:var(--{c.value})" on:click={() => category = c.value}>{c.icon} {c.label}</button>
            {/each}
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" on:click={() => dispatch('close')}>취소</button>
        <button class="btn-submit" on:click={handleSubmit} disabled={!title.trim()}>{editTodo ? '저장' : '추가'}</button>
      </div>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.65);
    backdrop-filter: blur(12px); display: flex; align-items: center;
    justify-content: center; z-index: 100; padding: 20px; animation: fadeIn 0.18s ease;
  }
  .modal {
    background: var(--surface); border: 1px solid var(--border-hover);
    border-radius: 22px; width: 100%; max-width: 500px;
    animation: up 0.28s cubic-bezier(0.34,1.56,0.64,1);
    max-height: 90vh; overflow-y: auto;
  }
  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 22px 26px 18px; border-bottom: 1px solid var(--border);
    position: sticky; top: 0; background: var(--surface); z-index: 1;
  }
  .modal-header h2 { font-size: 17px; font-weight: 700; letter-spacing: -0.02em; }
  .close-btn {
    width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center;
    justify-content: center; color: var(--text-3); transition: all 0.15s; cursor: pointer; background: none; border: none;
  }
  .close-btn:hover { background: var(--surface-2); color: var(--text); }

  .form { padding: 20px 26px 26px; display: flex; flex-direction: column; gap: 18px; }

  .type-selector { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .type-btn {
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    padding: 12px 8px; border-radius: 12px; background: var(--bg-3);
    border: 1.5px solid var(--border); color: var(--text-2); cursor: pointer; transition: all 0.15s;
  }
  .type-btn:hover { border-color: var(--border-hover); color: var(--text); }
  .type-btn.active { background: rgba(124,106,245,0.12); border-color: var(--accent); color: var(--accent-2); }
  .type-icon { font-size: 18px; line-height: 1; }
  .type-label { font-size: 13px; font-weight: 700; }
  .type-desc { font-size: 10px; color: var(--text-3); }
  .type-btn.active .type-desc { color: rgba(157,143,247,0.7); }

  .field { display: flex; flex-direction: column; gap: 7px; }
  label { font-size: 11px; font-weight: 700; color: var(--text-3); letter-spacing: 0.08em; text-transform: uppercase; }

  input[type="text"], input[type="url"], input[type="date"], input[type="time"], textarea {
    background: var(--bg-3); border: 1px solid var(--border); border-radius: 10px;
    padding: 11px 14px; color: var(--text); transition: all 0.15s; outline: none;
    width: 100%; resize: none; font-family: inherit; font-size: 14px;
  }
  input:focus, textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
  input::placeholder, textarea::placeholder { color: var(--text-3); }
  input[type="date"]::-webkit-calendar-picker-indicator,
  input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }

  .date-time-row { display: flex; align-items: flex-end; gap: 10px; }
  .flex-1 { flex: 1; }
  .flex-2 { flex: 2; }
  .range-arrow { color: var(--text-3); font-size: 16px; padding-bottom: 13px; flex-shrink: 0; }

  .meeting-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .mtoggle-btn {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 600;
    background: var(--bg-3); border: 1.5px solid var(--border);
    color: var(--text-2); cursor: pointer; transition: all 0.15s;
  }
  .mtoggle-btn:hover { border-color: var(--border-hover); color: var(--text); }
  .mtoggle-btn.active-offline { background: rgba(245,124,180,0.12); border-color: var(--personal); color: var(--personal); }
  .mtoggle-btn.active-online  { background: rgba(92,180,255,0.12);  border-color: #5cb4ff; color: #5cb4ff; }

  .url-input-wrap {
    display: flex; align-items: center; gap: 8px;
    background: var(--bg-3); border: 1px solid var(--border);
    border-radius: 10px; padding: 0 14px; transition: all 0.15s;
  }
  .url-input-wrap:focus-within { border-color: #5cb4ff; box-shadow: 0 0 0 3px rgba(92,180,255,0.15); }
  .url-icon { color: #5cb4ff; flex-shrink: 0; }
  .url-input-wrap input { border: none; padding: 11px 0; background: none; box-shadow: none; width: 100%; }
  .url-input-wrap input:focus { box-shadow: none; border: none; }

  /* 참여자 */
  .member-input-row { display: flex; gap: 8px; }
  .member-input-wrap {
    flex: 1; display: flex; align-items: center; gap: 8px;
    background: var(--bg-3); border: 1px solid var(--border);
    border-radius: 10px; padding: 0 14px; transition: all 0.15s;
  }
  .member-input-wrap:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
  .member-icon { color: var(--text-3); flex-shrink: 0; }
  .member-input-wrap input { border: none; padding: 10px 0; background: none; box-shadow: none; width: 100%; font-size: 13px; }
  .member-input-wrap input:focus { box-shadow: none; border: none; }
  .member-add-btn {
    padding: 0 16px; border-radius: 10px; font-size: 13px; font-weight: 600;
    background: rgba(124,106,245,0.14); color: var(--accent); border: 1px solid rgba(124,106,245,0.3);
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
  }
  .member-add-btn:hover:not(:disabled) { background: rgba(124,106,245,0.25); }
  .member-add-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .member-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
  .member-chip {
    display: flex; align-items: center; gap: 6px;
    background: var(--bg-3); border: 1px solid var(--border);
    border-radius: 99px; padding: 3px 10px 3px 4px;
    animation: fadeIn 0.15s ease;
  }
  .member-av {
    width: 22px; height: 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700; color: #fff;
    flex-shrink: 0;
  }
  .member-name { font-size: 12px; font-weight: 500; color: var(--text-2); }
  .member-remove {
    font-size: 14px; color: var(--text-3); cursor: pointer;
    background: none; border: none; line-height: 1; transition: color 0.15s; padding: 0;
  }
  .member-remove:hover { color: var(--high); }

  .member-preview {
    display: flex; align-items: center; gap: 10px; margin-top: 4px;
    padding: 8px 12px; background: var(--bg-3); border-radius: 10px;
    border: 1px solid var(--border);
  }
  .preview-label { font-size: 11px; color: var(--text-3); }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .chips { display: flex; gap: 5px; flex-wrap: wrap; }
  .chip {
    padding: 5px 12px; border-radius: 99px; font-size: 12px; font-weight: 500;
    background: var(--bg-3); border: 1px solid var(--border); color: var(--text-2);
    transition: all 0.15s; cursor: pointer;
  }
  .chip:hover { border-color: var(--c); color: var(--c); }
  .chip.active { background: color-mix(in srgb, var(--c) 15%, transparent); border-color: var(--c); color: var(--c); }

  .modal-footer { display: flex; gap: 8px; justify-content: flex-end; padding-top: 4px; }
  .btn-cancel {
    padding: 10px 18px; border-radius: 10px; font-size: 14px; font-weight: 500;
    color: var(--text-2); cursor: pointer; background: none; border: none; transition: all 0.15s;
  }
  .btn-cancel:hover { background: var(--surface-2); color: var(--text); }
  .btn-submit {
    padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;
    background: var(--accent); color: #fff; cursor: pointer; border: none; transition: all 0.15s;
  }
  .btn-submit:hover:not(:disabled) { background: var(--accent-2); box-shadow: 0 4px 14px var(--accent-glow); transform: translateY(-1px); }
  .btn-submit:disabled { opacity: 0.35; cursor: not-allowed; }

  .repeat-row { display: flex; align-items: flex-end; gap: 10px; }
  .repeat-select-wrap {
    flex: 1; background: var(--bg-3); border: 1px solid var(--border);
    border-radius: 10px; padding: 0 14px; transition: all 0.15s;
    display: flex; align-items: center;
  }
  .repeat-select-wrap:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
  .repeat-select {
    flex: 1; background: none; border: none; outline: none;
    padding: 11px 0; font-size: 14px; color: var(--text); font-family: inherit; cursor: pointer;
    appearance: none; -webkit-appearance: none;
  }
  .repeat-select option { background: var(--surface); }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes up { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: none; } }
</style>
