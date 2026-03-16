<script>
  import { createEventDispatcher, onMount } from 'svelte';

  export let value = null; // { name, address, lat, lng }

  const dispatch = createEventDispatcher();

  let query = value?.name ?? '';
  let results = [];
  let loading = false;
  let showDropdown = false;
  let debounceTimer;

  async function search(q) {
    if (!q.trim() || q.length < 2) { results = []; showDropdown = false; return; }
    loading = true;
    try {
      // SvelteKit 서버 라우트를 통해 호출 (CORS/인증 우회)
      const res = await fetch(`/api/places?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      results = data.documents ?? [];
      showDropdown = results.length > 0;
    } catch {
      results = [];
    } finally {
      loading = false;
    }
  }

  function onInput() {
    clearTimeout(debounceTimer);
    if (!query.trim()) { clear(); return; }
    debounceTimer = setTimeout(() => search(query), 300);
  }

  function select(place) {
    const info = {
      name: place.place_name,
      address: place.road_address_name || place.address_name,
      lat: parseFloat(place.y),
      lng: parseFloat(place.x)
    };
    value = info;
    query = info.name;
    showDropdown = false;
    dispatch('select', info);
  }

  function clear() {
    value = null;
    query = '';
    results = [];
    showDropdown = false;
    dispatch('select', null);
  }

  function onBlur() {
    setTimeout(() => { showDropdown = false; }, 150);
  }
</script>

<div class="place-search">
  <div class="input-wrap" class:has-value={!!value}>
    <svg class="pin-icon" viewBox="0 0 14 14" fill="none" width="13" height="13">
      <path d="M7 1C4.79 1 3 2.79 3 5c0 3.25 4 8 4 8s4-4.75 4-8c0-2.21-1.79-4-4-4z" stroke="currentColor" stroke-width="1.4" fill="currentColor" fill-opacity="0.15"/>
      <circle cx="7" cy="5" r="1.5" stroke="currentColor" stroke-width="1.3"/>
    </svg>
    <input
      type="text"
      bind:value={query}
      on:input={onInput}
      on:blur={onBlur}
      on:focus={() => { if (results.length) showDropdown = true; }}
      placeholder="장소 검색 (선택)"
    />
    {#if loading}
      <span class="spinner"></span>
    {:else if value}
      <button class="clear-btn" on:click={clear}>×</button>
    {/if}
  </div>

  {#if showDropdown}
    <ul class="dropdown">
      {#each results as place}
        <li>
          <button class="result-item" on:click={() => select(place)}>
            <span class="result-name">{place.place_name}</span>
            <span class="result-addr">{place.road_address_name || place.address_name}</span>
            {#if place.category_group_name}
              <span class="result-cat">{place.category_group_name}</span>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .place-search { position: relative; }

  .input-wrap {
    display: flex; align-items: center; gap: 8px;
    background: var(--bg-3); border: 1px solid var(--border);
    border-radius: 10px; padding: 0 12px; transition: all 0.15s;
  }
  .input-wrap:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
  .input-wrap.has-value { border-color: rgba(92,255,176,0.35); }

  .pin-icon { color: var(--text-3); flex-shrink: 0; }
  .input-wrap.has-value .pin-icon { color: var(--low); }

  input {
    flex: 1; background: none; border: none; outline: none;
    padding: 11px 0; font-size: 14px; color: var(--text); font-family: inherit;
  }
  input::placeholder { color: var(--text-3); }

  .clear-btn {
    font-size: 16px; color: var(--text-3); cursor: pointer;
    background: none; border: none; line-height: 1; transition: color 0.15s; padding: 0 2px;
  }
  .clear-btn:hover { color: var(--text); }

  .spinner {
    width: 14px; height: 14px; border: 2px solid var(--border);
    border-top-color: var(--accent); border-radius: 50%;
    animation: spin 0.6s linear infinite; flex-shrink: 0;
  }

  .dropdown {
    position: absolute; top: calc(100% + 6px); left: 0; right: 0;
    background: var(--surface); border: 1px solid var(--border-hover);
    border-radius: 12px; overflow: hidden; z-index: 50;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    list-style: none; padding: 4px;
    animation: pop 0.15s ease;
  }

  .result-item {
    width: 100%; display: flex; flex-direction: column; gap: 2px;
    padding: 9px 12px; border-radius: 8px; text-align: left;
    cursor: pointer; background: none; border: none; transition: background 0.12s;
  }
  .result-item:hover { background: var(--surface-2); }
  .result-name { font-size: 13px; font-weight: 600; color: var(--text); }
  .result-addr { font-size: 11px; color: var(--text-3); }
  .result-cat  { font-size: 10px; color: var(--accent-2); margin-top: 1px; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pop  { from { opacity: 0; transform: translateY(-4px) scale(0.98); } to { opacity: 1; transform: none; } }
</style>
