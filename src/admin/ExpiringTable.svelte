<script>
  export let clients = [];
  export let onCharge = () => {};
  export let onGrace = () => {};

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
    return "ACTIVO";
  }

  function membershipStatusClass(value) {
    const days = daysUntil(value);
    if (Number.isNaN(days)) return "";
    return days < 0 ? "overdue" : "expiring";
  }

  function formatDate(value) {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  function graceLabel(client) {
    if (!client.grace_until) return "-";
    const days = daysUntil(client.grace_until);
    const className = days >= 0 ? "grace-active" : "overdue";
    const note = client.grace_note ? `<small>${client.grace_note}</small>` : "";
    return `<div class="grace-cell"><span class="days-warning ${className}">Hasta ${formatDate(client.grace_until)}</span>${note}</div>`;
  }
</script>

<div class="table-wrap">
  {#if clients.length}
    <table>
      <thead>
        <tr><th>Cliente</th><th>DNI</th><th>Plan</th><th>Vence</th><th>Estado</th><th>Prorroga</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        {#each clients as client}
          <tr>
            <td>{client.last_name}, {client.first_name}</td>
            <td>{client.dni}</td>
            <td>{client.plan_name || "MENSUAL"}</td>
            <td>{formatDate(client.membership_paid_until)}</td>
            <td><span class="days-warning {membershipStatusClass(client.membership_paid_until)}">{membershipStatus(client.membership_paid_until)}</span></td>
            <td>{@html graceLabel(client)}</td>
            <td class="inline-actions">
              <button type="button" on:click={() => onCharge(client)}>Cobrar</button>
              <button type="button" on:click={() => onGrace(client)}>Prorroga</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p>No hay clientes con vencimiento para esa busqueda.</p>
  {/if}
</div>
