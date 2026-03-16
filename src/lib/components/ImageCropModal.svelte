<script>
  import { createEventDispatcher, onMount } from 'svelte';

  export let imageSrc = ''; // base64 or blob URL

  const dispatch = createEventDispatcher();

  let canvas;
  let container;
  let img = new Image();
  let imgLoaded = false;

  // 크롭 박스 상태
  let cropX = 0, cropY = 0, cropSize = 200;
  let dragging = false;
  let resizing = false;
  let dragStartX = 0, dragStartY = 0, dragStartCropX = 0, dragStartCropY = 0;
  let resizeStart = { x: 0, y: 0 }, resizeStartSize = 0;

  // 이미지 표시 크기
  let displayW = 0, displayH = 0;
  let scaleX = 1, scaleY = 1;

  onMount(() => {
    img.onload = () => {
      imgLoaded = true;
      // 컨테이너에 맞게 스케일
      const maxW = 460, maxH = 340;
      const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
      displayW = Math.round(img.naturalWidth * ratio);
      displayH = Math.round(img.naturalHeight * ratio);
      scaleX = img.naturalWidth / displayW;
      scaleY = img.naturalHeight / displayH;

      // 초기 크롭 박스 — 중앙 정사각형
      cropSize = Math.round(Math.min(displayW, displayH) * 0.8);
      cropX = Math.round((displayW - cropSize) / 2);
      cropY = Math.round((displayH - cropSize) / 2);
    };
    img.src = imageSrc;
  });

  // 크롭 박스 clamp
  function clamp() {
    cropSize = Math.max(60, Math.min(cropSize, displayW, displayH));
    cropX = Math.max(0, Math.min(cropX, displayW - cropSize));
    cropY = Math.max(0, Math.min(cropY, displayH - cropSize));
  }

  // 드래그 — 박스 이동
  function onMouseDown(e) {
    if (e.target.classList.contains('resize-handle')) return;
    e.preventDefault();
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartCropX = cropX;
    dragStartCropY = cropY;
  }

  function onMouseMove(e) {
    if (dragging) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      cropX = dragStartCropX + dx;
      cropY = dragStartCropY + dy;
      clamp();
    }
    if (resizing) {
      // 시작점에서 현재까지 이동한 거리 — X/Y 중 큰 값 사용
      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;
      const delta = Math.max(dx, dy);
      cropSize = Math.max(60, resizeStartSize + delta);
      clamp();
    }
  }

  function onMouseUp() { dragging = false; resizing = false; }

  function onResizeDown(e) {
    e.preventDefault(); e.stopPropagation();
    resizing = true;
    resizeStart = { x: e.clientX, y: e.clientY };
    resizeStartSize = cropSize;
  }

  // 터치 지원
  function onTouchStart(e) {
    if (e.target.classList.contains('resize-handle')) return;
    const t = e.touches[0];
    dragging = true;
    dragStartX = t.clientX;
    dragStartY = t.clientY;
    dragStartCropX = cropX;
    dragStartCropY = cropY;
  }
  function onTouchMove(e) {
    const t = e.touches[0];
    if (dragging) {
      cropX = dragStartCropX + (t.clientX - dragStartX);
      cropY = dragStartCropY + (t.clientY - dragStartY);
      clamp();
    }
  }
  function onTouchEnd() { dragging = false; }

  // 크롭 적용
  function applyCrop() {
    const SIZE = 300;
    const c = document.createElement('canvas');
    c.width = SIZE; c.height = SIZE;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 실제 이미지 좌표로 변환
    const sx = Math.round(cropX * scaleX);
    const sy = Math.round(cropY * scaleY);
    const sw = Math.round(cropSize * scaleX);
    const sh = Math.round(cropSize * scaleY);

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, SIZE, SIZE);
    dispatch('crop', c.toDataURL('image/jpeg', 0.92));
  }

  function cancel() { dispatch('cancel'); }
</script>

<svelte:window
  on:mousemove={onMouseMove}
  on:mouseup={onMouseUp}
/>

<div class="overlay" on:click|self={cancel} role="presentation" on:keydown>
  <div class="modal">
    <div class="modal-header">
      <h3>프로필 사진 크롭</h3>
      <button class="close-btn" on:click={cancel}>
        <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>

    <div class="crop-area" bind:this={container}
      style="width:{displayW}px; height:{displayH}px"
      on:touchmove|preventDefault={onTouchMove}
      on:touchend={onTouchEnd}
    >
      {#if imgLoaded}
        <!-- 원본 이미지 -->
        <img src={imageSrc} alt="원본" class="bg-img" style="width:{displayW}px; height:{displayH}px" draggable="false" />

        <!-- 어두운 오버레이 4방향 -->
        <div class="dim top"    style="height:{cropY}px"></div>
        <div class="dim bottom" style="top:{cropY+cropSize}px; height:{displayH-cropY-cropSize}px"></div>
        <div class="dim left"   style="top:{cropY}px; height:{cropSize}px; width:{cropX}px"></div>
        <div class="dim right"  style="top:{cropY}px; height:{cropSize}px; left:{cropX+cropSize}px; width:{displayW-cropX-cropSize}px"></div>

        <!-- 크롭 박스 -->
        <div class="crop-box"
          style="left:{cropX}px; top:{cropY}px; width:{cropSize}px; height:{cropSize}px"
          on:mousedown={onMouseDown}
          on:touchstart|preventDefault={onTouchStart}
          role="button" tabindex="0" on:keydown
        >
          <!-- 격자 가이드 -->
          <div class="grid-line h" style="top:33.3%"></div>
          <div class="grid-line h" style="top:66.6%"></div>
          <div class="grid-line v" style="left:33.3%"></div>
          <div class="grid-line v" style="left:66.6%"></div>

          <!-- 모서리 핸들 -->
          <div class="corner tl"></div>
          <div class="corner tr"></div>
          <div class="corner bl"></div>
          <div class="corner br"></div>

          <!-- 리사이즈 핸들 (우하단) -->
          <div class="resize-handle" on:mousedown={onResizeDown} role="button" tabindex="0" on:keydown></div>
        </div>
      {:else}
        <div class="loading">이미지 로딩 중...</div>
      {/if}
    </div>

    <p class="hint">박스를 드래그해서 위치 조정 · 오른쪽 하단 핸들로 크기 조정</p>

    <div class="modal-footer">
      <button class="btn-cancel" on:click={cancel}>취소</button>
      <button class="btn-apply" on:click={applyCrop} disabled={!imgLoaded}>적용</button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.75);
    backdrop-filter: blur(10px); display: flex; align-items: center;
    justify-content: center; z-index: 200; padding: 20px;
    animation: fadeIn 0.18s ease;
  }
  .modal {
    background: var(--surface); border: 1px solid var(--border-hover);
    border-radius: 20px; overflow: hidden;
    animation: up 0.25s cubic-bezier(0.34,1.56,0.64,1);
    display: flex; flex-direction: column; gap: 0;
  }
  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 22px 14px; border-bottom: 1px solid var(--border);
  }
  .modal-header h3 { font-size: 15px; font-weight: 700; }
  .close-btn {
    width: 28px; height: 28px; border-radius: 7px; display: flex;
    align-items: center; justify-content: center; color: var(--text-3);
    background: none; border: none; cursor: pointer; transition: all 0.15s;
  }
  .close-btn:hover { background: var(--surface-2); color: var(--text); }

  /* 크롭 영역 */
  .crop-area {
    position: relative; overflow: hidden;
    background: #000; cursor: crosshair;
    margin: 16px auto; flex-shrink: 0;
  }
  .bg-img { position: absolute; top: 0; left: 0; user-select: none; }

  /* 어두운 마스크 */
  .dim {
    position: absolute; left: 0; right: 0;
    background: rgba(0,0,0,0.55); pointer-events: none;
  }
  .dim.left, .dim.right { right: auto; }

  /* 크롭 박스 */
  .crop-box {
    position: absolute; border: 2px solid #fff;
    cursor: move; box-sizing: border-box;
    box-shadow: 0 0 0 9999px rgba(0,0,0,0);
  }

  /* 격자 */
  .grid-line {
    position: absolute; background: rgba(255,255,255,0.3); pointer-events: none;
  }
  .grid-line.h { left: 0; right: 0; height: 1px; }
  .grid-line.v { top: 0; bottom: 0; width: 1px; }

  /* 모서리 핸들 */
  .corner {
    position: absolute; width: 10px; height: 10px;
    background: #fff; border-radius: 2px; pointer-events: none;
  }
  .corner.tl { top: -2px; left: -2px; }
  .corner.tr { top: -2px; right: -2px; }
  .corner.bl { bottom: -2px; left: -2px; }
  .corner.br { bottom: -2px; right: -2px; }

  /* 리사이즈 핸들 */
  .resize-handle {
    position: absolute; bottom: -6px; right: -6px;
    width: 18px; height: 18px; cursor: se-resize;
    background: var(--accent); border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  }

  .hint {
    font-size: 11px; color: var(--text-3); text-align: center;
    padding: 0 22px 4px;
  }

  .loading {
    display: flex; align-items: center; justify-content: center;
    width: 100%; height: 100%; color: var(--text-3); font-size: 13px;
  }

  .modal-footer {
    display: flex; gap: 8px; justify-content: flex-end;
    padding: 14px 22px 18px; border-top: 1px solid var(--border);
  }
  .btn-cancel {
    padding: 9px 18px; border-radius: 10px; font-size: 13px; font-weight: 500;
    color: var(--text-2); background: none; border: none; cursor: pointer; transition: all 0.15s;
  }
  .btn-cancel:hover { background: var(--surface-2); }
  .btn-apply {
    padding: 9px 22px; border-radius: 10px; font-size: 13px; font-weight: 600;
    background: var(--accent); color: #fff; border: none; cursor: pointer; transition: all 0.15s;
  }
  .btn-apply:hover:not(:disabled) { background: var(--accent-2); box-shadow: 0 4px 14px var(--accent-glow); }
  .btn-apply:disabled { opacity: 0.35; cursor: not-allowed; }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes up { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: none; } }
</style>
