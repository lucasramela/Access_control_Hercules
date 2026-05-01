<script>
  import { CreditCard, Eye, HandCoins } from "lucide-svelte";
  import StatusBadge from "./StatusBadge.svelte";

  export let clients = [];
  export let onCharge = () => {};
  export let onGrace = () => {};
  export let onDetail = null;

  function daysUntil(value) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const paidUntil = new Date(`${value}T00:00:00`);
    return Math.ceil((paidUntil - today) / 86400000);
  }

  function membershipStatus(value) {
    const days = daysUntil(value);
    if (Number.isNaN(days)) return "Sin fecha";
    if (days < 0) return "VENCIDA";
    if (days <= 7) return "POR VENCER";
    return "PAGADA";
  }

  function formatDate(value) {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  function graceStatus(client) {
    if (!client.grace_until) return "";
    return daysUntil(client.grace_until) >= 0 ? "PRORROGA ACTIVA" : "PRORROGA VENCIDA";
  }
</script>

<div class="modern-table-wrap">
  {#if clients.length}
    <table class="modern-table">
      <thead>
        <tr><th>Cliente</th><th>DNI</th><th>Plan</th><th>Vence</th><th>Estado</th><th>Prorroga</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        {#each clients as client}
          <tr>
            <td><strong>{client.last_name}, {client.first_name}</strong></td>
            <td>{client.dni}</td>
            <td>{client.plan_name || "MENSUAL"}</td>
            <td>{formatDate(client.membership_paid_until)}</td>
            <td><StatusBadge status={membershipStatus(client.membership_paid_until)} /></td>
            <td>
              {#if client.grace_until}
                <StatusBadge status={graceStatus(client)} tone={daysUntil(client.grace_until) >= 0 ? "info" : "danger"} />
              {:else}
                <span class="muted-chip">Sin prorroga</span>
              {/if}
            </td>
            <td class="modern-actions">
              {#if onDetail}
                <button type="button" class="ghost-action" on:click={() => onDetail(client)} title="Ver detalle"><Eye size={16} /></button>
              {/if}
              <button type="button" class="soft-action" on:click={() => onCharge(client)}><CreditCard size={16} /> Cobrar</button>
              <button type="button" class="ghost-action labeled" on:click={() => onGrace(client)}><HandCoins size={16} /> Prorroga</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p>No hay clientes con vencimiento para esa busqueda.</p>
  {/if}
</div>
