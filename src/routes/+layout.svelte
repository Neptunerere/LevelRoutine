<script>
  import '../app.css';
</script>

<svelte:head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<!-- SSR 끄기 (Tauri는 서버 없음) -->
<slot />