<script>
  import { notes } from '$lib/stores/notes';
  import { createEventDispatcher, onMount } from 'svelte';

  export let todo;   // 연결된 일정

  const dispatch = createEventDispatcher();
  const categoryColors = { work: '#7c6af5', personal: '#f57cb4', health: '#5cffb0', study: '#5cb4ff', other: '#ffaa5c' };
  const categoryIcons  = { work: '💼', personal: '✨', health: '💚', study: '📚', other: '🎯' };

  let content = '';
  let saved = false;
  let textarea;

  onMount(() => {
    const existing = $notes[todo.id];
    if (existing) content = existing.content;
    setTimeout(() => textarea?.focus(), 80);
  });

  function handleSave() {
    if (!content.trim()) {
      notes.remove(todo.id);
    } else {
      notes.save(todo.id, content);
    }
    saved = true;
    setTimeout(() => dispatch('close'), 300);
  }

  function handleKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') dispatch('close');
  }

  $: wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  $: charCount = content.length;

  // 날짜 포맷
  function formatDate(todo) {
    if (todo.dueDate) return todo.dueDate.slice(5).replace('-', '/');
    if (todo.startDate) return `${todo.startDate.slice(5).replace('-','/')} ~ ${todo.endDate?.slice(5).replace('-','/')}`;
    return '';
  }

  const existingNote = $notes[todo.id];
  const lastUpdated = existingNote?.updatedAt
    ? new Date(existingNote.updatedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;
</script>

<div class="overlay" on:click={() => dispatch('close')} on:keydown role="presentation">
  <div class="modal" on:click|stopPropagation on:keydown={handleKeydown} role="dialog">

    <!-- 헤더 -->
    <div class="modal-header">
      <div class="header-left">
        <div class="todo-ref" style="--cc:{categoryColors[todo.category]}">
          <span class="ref-icon">{categoryIcons[todo.category]}</span>
          <span class="ref-title">{todo.title}</span>
          {#if formatDate(todo)}
            <span class="ref-date">{formatDate(todo)}</span>
          {/if}
        </div>
        <h2 class="modal-title">노트</h2>
      </div>
      <button class="close-btn" on:click={() => dispatch('close')}>
        <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>

    <!-- 에디터 -->
    <div class="editor-wrap">
      <textarea
        bind:this={textarea}
        bind:value={content}
        class="editor"
        placeholder="이 일정에 대한 생각, 준비사항, 회고를 자유롭게 작성해보세요...

• 오늘 느낀 점
• 다음에 개선할 것
• 기억해둘 것"
        spellcheck="false"
      ></textarea>
    </div>

    <!-- 푸터 -->
    <div class="modal-footer">
      <div class="footer-left">
        <span class="count">{charCount}자 · {wordCount}단어</span>
        {#if lastUpdated}
          <span class="last-saved">마지막 저장 {lastUpdated}</span>
        {/if}
      </div>
      <div class="footer-right">
        <span class="shortcut-hint">⌘S 저장</span>
        <button class="btn-cancel" on:click={() => dispatch('close')}>취소</button>
        <button class="btn-save" class:saved on:click={handleSave}>
          {#if saved}
            <svg viewBox="0 0 14 14" fill="none" width="13" height="13"><path d="M2 7l3.5 3.5L12 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            저장됨
          {:else}
            <svg viewBox="0 0 14 14" fill="none" width="13" height="13"><path d="M11 2H4L2 4v8h10V2zM9 2v4H5V2M7 8v3" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
            저장
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    backdrop-filter: blur(14px); display: flex; align-items: center;
    justify-content: center; z-index: 200; padding: 20px;
    animation: fadeIn 0.15s ease;
  }
  .modal {
    background: var(--surface); border: 1px solid var(--border-hover);
    border-radius: 20px; width: 100%; max-width: 580px; height: 520px;
    display: flex; flex-direction: column;
    animation: up 0.25s cubic-bezier(0.34,1.56,0.64,1);
  }

  /* 헤더 */
  .modal-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    padding: 20px 22px 16px; border-bottom: 1px solid var(--border);
    gap: 12px;
  }
  .header-left { display: flex; flex-direction: column; gap: 6px; }

  .todo-ref {
    display: inline-flex; align-items: center; gap: 6px;
    background: color-mix(in srgb, var(--cc) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--cc) 30%, transparent);
    border-radius: 8px; padding: 4px 10px;
  }
  .ref-icon { font-size: 12px; }
  .ref-title { font-size: 12px; font-weight: 600; color: var(--cc); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ref-date { font-size: 10px; color: var(--text-3); border-left: 1px solid var(--border); padding-left: 6px; }

  .modal-title { font-size: 18px; font-weight: 700; letter-spacing: -0.03em; color: var(--text); }

  .close-btn {
    width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center;
    justify-content: center; color: var(--text-3); cursor: pointer; background: none; border: none;
    transition: all 0.15s; flex-shrink: 0;
  }
  .close-btn:hover { background: var(--surface-2); color: var(--text); }

  /* 에디터 */
  .editor-wrap { flex: 1; overflow: hidden; padding: 4px 0; }
  .editor {
    width: 100%; height: 100%; resize: none; outline: none;
    background: none; border: none;
    padding: 16px 22px;
    font-family: 'Pretendard', sans-serif; font-size: 14px;
    line-height: 1.8; color: var(--text);
    caret-color: var(--accent);
  }
  .editor::placeholder { color: var(--text-3); line-height: 1.8; }

  /* 푸터 */
  .modal-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 22px 16px; border-top: 1px solid var(--border); gap: 8px;
  }
  .footer-left { display: flex; flex-direction: column; gap: 2px; }
  .count { font-size: 10px; color: var(--text-3); }
  .last-saved { font-size: 10px; color: var(--text-3); }
  .footer-right { display: flex; align-items: center; gap: 8px; }
  .shortcut-hint { font-size: 10px; color: var(--text-3); }

  .btn-cancel {
    padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 500;
    color: var(--text-2); cursor: pointer; background: none; border: none; transition: all 0.15s;
  }
  .btn-cancel:hover { background: var(--surface-2); color: var(--text); }

  .btn-save {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;
    background: var(--accent); color: #fff; cursor: pointer; border: none; transition: all 0.2s;
  }
  .btn-save:hover { background: var(--accent-2); box-shadow: 0 4px 14px var(--accent-glow); }
  .btn-save.saved { background: var(--low); color: #0c0c0f; }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes up { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: none; } }
</style>