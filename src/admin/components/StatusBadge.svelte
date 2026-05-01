<script>
  export let status = "ACTIVO";
  export let tone = "";

  $: normalized = String(status || "").toUpperCase();
  $: badgeTone = tone || (
    normalized.includes("VENCIDA") ? "danger" :
    normalized.includes("POR VENCER") ? "warning" :
    normalized.includes("PRORROGA") ? "info" :
    "success"
  );
</script>

<span class="status-badge {badgeTone}">{status}</span>
