<script>
  import { onMount, onDestroy } from 'svelte';

  export let lat = 37.5665;
  export let lng = 126.9780;
  export let name = '';
  export let height = '200px';

  let container;
  let mapInstance = null;
  let loadError = false;
  let loading = true;

  const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY;

  function initMap() {
    if (!window.kakao?.maps) { loadError = true; loading = false; return; }
    loading = false;
    window.kakao.maps.load(() => {
      if (!container) return;
      const coords = new window.kakao.maps.LatLng(lat, lng);
      mapInstance = new window.kakao.maps.Map(container, {
        center: coords, level: 4
      });
      const marker = new window.kakao.maps.Marker({ position: coords, map: mapInstance });
      if (name) {
        const infowindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:5px 10px;font-size:12px;font-weight:600;white-space:nowrap">${name}</div>`
        });
        infowindow.open(mapInstance, marker);
      }
    });
  }

  function loadKakaoScript() {
    return new Promise((resolve, reject) => {
      if (window.kakao?.maps) { resolve(); return; }
      if (!KAKAO_KEY) { reject(new Error('NO_KEY')); return; }

      // 이미 스크립트 로드 중이면 기다림
      const existing = document.querySelector('script[data-kakao]');
      if (existing) {
        existing.addEventListener('load', resolve);
        existing.addEventListener('error', reject);
        return;
      }

      const script = document.createElement('script');
      script.setAttribute('data-kakao', 'true');
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  onMount(async () => {
    try {
      await loadKakaoScript();
      initMap();
    } catch {
      loadError = true;
      loading = false;
    }
  });

  onDestroy(() => { mapInstance = null; });
</script>

<div class="map-wrap" style="height:{height}">
  {#if loading}
    <div class="map-state">
      <div class="spinner"></div>
      <span>지도 로딩 중...</span>
    </div>
  {:else if loadError}
    <!-- API 키 없거나 로드 실패 시 정적 폴백 -->
    <a
      class="map-fallback"
      href="https://map.kakao.com/link/map/{encodeURIComponent(name)},{lat},{lng}"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div class="fallback-pin">
        <svg viewBox="0 0 32 32" fill="none" width="32" height="32">
          <path d="M16 3C11.03 3 7 7.03 7 12c0 7.88 9 17 9 17s9-9.12 9-17c0-4.97-4.03-9-9-9z"
            fill="var(--accent)" fill-opacity="0.2" stroke="var(--accent)" stroke-width="1.5"/>
          <circle cx="16" cy="12" r="3.5" fill="var(--accent)"/>
        </svg>
      </div>
      <div class="fallback-info">
        <p class="fallback-name">{name || '장소'}</p>
        <p class="fallback-hint">카카오맵에서 보기 →</p>
      </div>
    </a>
  {:else}
    <div bind:this={container} class="map-container"></div>
  {/if}
</div>

<style>
  .map-wrap {
    width: 100%; border-radius: 10px; overflow: hidden;
    background: var(--bg-3); border: 1px solid var(--border);
  }
  .map-container { width: 100%; height: 100%; }

  /* 로딩 */
  .map-state {
    width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 10px; color: var(--text-3); font-size: 12px;
  }
  .spinner {
    width: 20px; height: 20px; border-radius: 50%;
    border: 2px solid var(--border); border-top-color: var(--accent);
    animation: spin 0.8s linear infinite;
  }

  /* 폴백 */
  .map-fallback {
    width: 100%; height: 100%; display: flex; align-items: center;
    justify-content: center; gap: 14px; text-decoration: none;
    background: var(--bg-3); transition: background 0.15s;
    padding: 16px;
  }
  .map-fallback:hover { background: var(--surface-2); }
  .fallback-pin {
    width: 52px; height: 52px; border-radius: 50%;
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .fallback-info { display: flex; flex-direction: column; gap: 4px; }
  .fallback-name { font-size: 14px; font-weight: 700; color: var(--text); }
  .fallback-hint { font-size: 11px; color: var(--accent-2); }

  @keyframes spin { to { transform: rotate(360deg); } }
</style>