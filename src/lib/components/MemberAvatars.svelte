<script>
  const COLORS = [
    '#7c6af5', '#f57cb4', '#5cffb0', '#5cb4ff', '#ffaa5c',
    '#ff5c7c', '#a78bfa', '#34d399', '#f472b6', '#60a5fa',
  ];

  export let members = [];
  export let max = 4;
  export let size = 24;

  function colorFor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return COLORS[Math.abs(hash) % COLORS.length];
  }

  function initials(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  $: visible = members.slice(0, max);
  $: extra   = members.length - max;
</script>

{#if members.length > 0}
  <div class="avatars">
    {#each visible as m, i}
      <span
        class="av"
        style="
          background: {colorFor(m.name)};
          width: {size}px;
          height: {size}px;
          font-size: {Math.round(size * 0.4)}px;
          margin-left: {i === 0 ? 0 : -Math.round(size * 0.3)}px;
          z-index: {visible.length - i};
        "
        title={m.name}
      >
        {initials(m.name)}
      </span>
    {/each}
    {#if extra > 0}
      <span
        class="av extra"
        style="
          width: {size}px;
          height: {size}px;
          font-size: {Math.round(size * 0.36)}px;
          margin-left: {-Math.round(size * 0.3)}px;
          z-index: 0;
        "
        title="+{extra}명 더"
      >
        +{extra}
      </span>
    {/if}
  </div>
{/if}

<style>
  .avatars {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .av {
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.02em;
    cursor: default;
    flex-shrink: 0;
    border: 2px solid var(--bg-3);
    transition: transform 0.15s;
    user-select: none;
    position: relative;
  }

  .av:hover {
    transform: scale(1.18) translateY(-2px);
    z-index: 99 !important;
  }

  .extra {
    background: var(--surface-2) !important;
    color: var(--text-3) !important;
    border-color: var(--bg-3) !important;
  }
</style>
