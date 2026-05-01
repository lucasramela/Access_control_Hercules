<script>
  import { BadgeDollarSign, TrendingUp } from "lucide-svelte";

  export let rows = [];

  $: max = Math.max(1, ...rows.map((row) => Number(row.total || 0)));
  $: total = rows.reduce((sum, row) => sum + Number(row.total || 0), 0);
  $: topPlan = rows.length ? rows.reduce((best, row) => Number(row.total || 0) > Number(best.total || 0) ? row : best, rows[0]) : null;
  $: topShare = total && topPlan ? Math.round((Number(topPlan.total || 0) / total) * 100) : 0;
</script>

<article class="chart-card plan-map-card">
  <div class="chart-heading">
    <div>
      <h3>Mapa de planes</h3>
      <p>Participacion actual por tipo de plan</p>
    </div>
  </div>
  <div class="plan-map-list">
    {#each rows as row}
      <div class="plan-map-row" style={`--plan-share: ${Math.max(8, (Number(row.total || 0) / max) * 100)}%`}>
        <span class="plan-map-icon"><BadgeDollarSign size={20} strokeWidth={2.4} /></span>
        <div class="plan-map-copy">
          <strong>{row.label}</strong>
          <span>{row.total} clientes activos</span>
        </div>
        <strong class="plan-map-total">{row.total}</strong>
      </div>
    {:else}
      <p>No hay planes cargados.</p>
    {/each}
    <div class="plan-map-row plan-map-summary" style={`--plan-share: ${topShare || 8}%`}>
      <span class="plan-map-icon"><TrendingUp size={20} strokeWidth={2.4} /></span>
      <div class="plan-map-copy">
        <strong>{topPlan ? "Plan principal" : "Sin datos"}</strong>
        <span>{topPlan ? `${topPlan.label} concentra el ${topShare}%` : "Todavia no hay clientes activos"}</span>
      </div>
      <strong class="plan-map-total">{topShare}%</strong>
    </div>
  </div>
</article>
