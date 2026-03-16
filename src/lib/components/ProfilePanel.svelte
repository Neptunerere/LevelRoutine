<script>
  import { profile, levelInfo } from '$lib/stores/profile';
  import { createEventDispatcher, onMount } from 'svelte';
  import ImageCropModal from './ImageCropModal.svelte';

  const dispatch = createEventDispatcher();

  let mounted = false;
  onMount(() => { mounted = true; });

  let editing = false;
  let nicknameInput = '';
  let fileInput;
  let showLevelUp = false;
  let prevLevel = 1;
  let cropSrc = null;

  // 레벨업 감지
  $: {
    if ($levelInfo.level > prevLevel && prevLevel !== 1) {
      triggerLevelUp();
    }
    prevLevel = $levelInfo.level;
  }

  function triggerLevelUp() {
    showLevelUp = true;
    setTimeout(() => showLevelUp = false, 2800);
  }

  function startEdit() {
    nicknameInput = $profile.nickname;
    editing = true;
  }

  function saveNickname() {
    const trimmed = nicknameInput.trim();
    if (trimmed) profile.setNickname(trimmed);
    editing = false;
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') saveNickname();
    if (e.key === 'Escape') editing = false;
  }

  function handleAvatarClick() {
    fileInput?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      cropSrc = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function onCropDone(e) {
    profile.setAvatar(e.detail);
    cropSrc = null;
  }

  function onCropCancel() {
    cropSrc = null;
  }

  // 레벨 색상
  function getLevelColor(level) {
    if (level <= 2)  return '#9999bb';
    if (level <= 5)  return '#5cb4ff';
    if (level <= 9)  return '#7c6af5';
    if (level <= 14) return '#f57cb4';
    if (level <= 19) return '#ffaa5c';
    if (level <= 29) return '#5cffb0';
    return '#ffd700';
  }

  $: levelColor = getLevelColor($levelInfo.level);
</script>

{#if cropSrc}
  <ImageCropModal imageSrc={cropSrc} on:crop={onCropDone} on:cancel={onCropCancel} />
{/if}

{#if !mounted}
  <div class="profile-card skeleton-card">
    <div class="sk sk-avatar"></div>
    <div class="sk sk-name"></div>
    <div class="sk sk-title"></div>
    <div class="sk sk-level"></div>
    <div class="sk sk-bar"></div>
    <div class="sk-xp-row">
      <div class="sk sk-xp-text"></div>
      <div class="sk sk-xp-pct"></div>
    </div>
  </div>

{:else}
  {#if showLevelUp}
    <div class="levelup-toast">
      <span class="levelup-icon">⚡</span>
      <div>
        <p class="levelup-title">레벨 업!</p>
        <p class="levelup-sub">Lv.{$levelInfo.level} {$levelInfo.title} 달성!</p>
      </div>
    </div>
  {/if}

  <div class="profile-card" style="--lc:{levelColor}">

    <div class="avatar-wrap" on:click={handleAvatarClick} on:keydown role="button" tabindex="0" title="프로필 사진 변경">
      {#if $profile.avatarUrl}
        <img src={$profile.avatarUrl} alt="프로필" class="avatar-img" />
      {:else}
        <div class="avatar-placeholder">
          <svg viewBox="0 0 32 32" fill="none" width="40" height="40">
            <circle cx="16" cy="12" r="6" stroke="currentColor" stroke-width="1.6"/>
            <path d="M4 28c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </div>
      {/if}
      <div class="avatar-overlay">
        <svg viewBox="0 0 16 16" fill="none" width="18" height="18">
          <path d="M11 2.5a1.5 1.5 0 012.12 2.12l-7.5 7.5L3 13l.88-2.62 7.5-7.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
        </svg>
        <span class="overlay-txt">변경</span>
      </div>
      <input bind:this={fileInput} type="file" accept="image/*" class="file-input" on:change={handleFileChange} />
    </div>

    {#if editing}
      <input
        class="nickname-input"
        bind:value={nicknameInput}
        on:keydown={handleKeydown}
        on:blur={saveNickname}
        maxlength="16"
        autofocus
      />
    {:else}
      <button class="nickname-btn" on:click={startEdit}>
        <span class="nickname">{$profile.nickname}</span>
        <svg viewBox="0 0 12 12" fill="none" width="10" height="10" class="edit-icon">
          <path d="M8 1.5a1 1 0 011.41 1.41l-5.5 5.5L2 9l.59-1.91 5.5-5.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
        </svg>
      </button>
    {/if}

    <span class="level-title">{$levelInfo.title}</span>

    <div class="level-badge">
      <span class="lv-label">LEVEL</span>
      <span class="lv-num">{$levelInfo.level}</span>
    </div>

    <div class="xp-section">
      <div class="xp-bar">
        <div class="xp-fill" style="width:{$levelInfo.progress.percent}%"></div>
      </div>
      <div class="xp-labels">
        <span class="xp-current">{$levelInfo.progress.current}<span class="xp-unit"> XP</span></span>
        <span class="xp-required">/ {$levelInfo.progress.required} XP</span>
        <span class="xp-pct">{$levelInfo.progress.percent}%</span>
      </div>
    </div>

  </div>
{/if}

<style>
  .levelup-toast {
    position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
    background: var(--surface); border: 1px solid var(--border-hover);
    border-radius: 14px; padding: 12px 20px;
    display: flex; align-items: center; gap: 12px;
    z-index: 999; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    animation: toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1), toastOut 0.3s ease 2.5s forwards;
    pointer-events: none;
  }
  .levelup-icon { font-size: 26px; }
  .levelup-title { font-size: 14px; font-weight: 700; color: var(--text); }
  .levelup-sub { font-size: 12px; color: var(--accent-2); }

  .profile-card {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    padding: 20px 16px 16px;
    background: var(--bg-3); border: 1px solid var(--border);
    border-radius: 16px;
  }

  .avatar-wrap {
    position: relative; width: 136px; height: 136px; flex-shrink: 0;
    border-radius: 50%; cursor: pointer; overflow: hidden;
    border: 2.5px solid var(--lc, var(--border-hover));
    transition: border-color 0.2s, box-shadow 0.2s;
    margin-bottom: 4px;
  }
  .avatar-wrap:hover {
    box-shadow: 0 0 16px color-mix(in srgb, var(--lc, var(--accent)) 50%, transparent);
  }
  .avatar-img {
    width: 100%; height: 100%; object-fit: cover; display: block;
  }
  .avatar-placeholder {
    width: 100%; height: 100%;
    background: var(--surface-2);
    display: flex; align-items: center; justify-content: center;
    color: var(--text-3);
  }
  .avatar-overlay {
    position: absolute; inset: 0; background: rgba(0,0,0,0.6);
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
    color: #fff; opacity: 0; transition: opacity 0.15s;
  }
  .overlay-txt { font-size: 10px; font-weight: 600; }
  .avatar-wrap:hover .avatar-overlay { opacity: 1; }
  .file-input { display: none; }

  .nickname-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 5px;
    background: none; border: none; cursor: pointer; padding: 0; width: 100%;
  }
  .nickname {
    font-size: 16px; font-weight: 700; color: var(--text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: 180px; text-align: center;
  }
  .edit-icon { color: var(--text-3); opacity: 0; transition: opacity 0.15s; flex-shrink: 0; }
  .nickname-btn:hover .edit-icon { opacity: 1; }
  .nickname-input {
    font-size: 16px; font-weight: 700; color: var(--text); text-align: center;
    background: var(--surface); border: 1px solid var(--accent);
    border-radius: 8px; padding: 4px 12px; outline: none; width: 100%;
    box-shadow: 0 0 0 2px var(--accent-glow);
  }

  .level-title { font-size: 12px; font-weight: 600; color: var(--lc); margin-top: -2px; text-align: center; width: 100%; }

  .level-badge {
    display: flex; align-items: center; gap: 6px;
    background: color-mix(in srgb, var(--lc) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--lc) 35%, transparent);
    border-radius: 99px; padding: 5px 16px;
    margin-top: 2px; transition: all 0.3s;
  }
  .lv-label { font-size: 10px; font-weight: 700; color: var(--lc); letter-spacing: 0.12em; text-transform: uppercase; }
  .lv-num {
    font-family: 'Clash Display', sans-serif; font-size: 22px; font-weight: 700;
    color: var(--lc); line-height: 1;
  }

  .xp-section { width: 100%; display: flex; flex-direction: column; gap: 5px; margin-top: 4px; }
  .xp-bar { height: 6px; background: var(--surface-2); border-radius: 99px; overflow: hidden; }
  .xp-fill {
    height: 100%; border-radius: 99px; background: var(--lc);
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 8px var(--lc);
  }
  .xp-labels { display: flex; align-items: center; gap: 4px; font-size: 10px; color: var(--text-3); }
  .xp-current { color: var(--text-2); font-weight: 600; }
  .xp-unit { font-weight: 400; }
  .xp-required { color: var(--text-3); }
  .xp-pct { margin-left: auto; font-weight: 700; font-size: 11px; color: var(--lc); }

  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .sk {
    border-radius: 6px;
    background: linear-gradient(90deg, var(--bg-3) 25%, var(--surface-2) 50%, var(--bg-3) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s ease infinite;
  }
  .skeleton-card {
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    padding: 20px 16px 16px;
    background: var(--bg-3); border: 1px solid var(--border);
    border-radius: 16px; pointer-events: none;
  }
  .sk-avatar  { width: 96px; height: 96px; border-radius: 50%; }
  .sk-name    { width: 90px; height: 15px; }
  .sk-title   { width: 50px; height: 11px; }
  .sk-level   { width: 80px; height: 34px; border-radius: 99px; }
  .sk-bar     { width: 100%; height: 6px; border-radius: 99px; }
  .sk-xp-row  { width: 100%; display: flex; justify-content: space-between; }
  .sk-xp-text { width: 80px; height: 10px; }
  .sk-xp-pct  { width: 30px; height: 10px; }

  @keyframes toastIn  { from { opacity: 0; transform: translateX(-50%) translateY(16px) scale(0.9); } to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
  @keyframes toastOut { to { opacity: 0; transform: translateX(-50%) translateY(8px); } }
</style>
