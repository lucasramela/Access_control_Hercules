<script>
  import { onDestroy, onMount } from "svelte";
  import { CheckCircle2, LogIn, XCircle } from "lucide-svelte";

  let dni = "";
  let result = { status: "", title: "", detail: "" };
  let clock = "";
  let dialog;
  let dialogData = {
    status: "granted",
    eyebrow: "Acceso correcto",
    title: "Bienvenido",
    detail: "",
    warning: ""
  };
  let dialogTimer = null;
  let clockTimer = null;
  let dniInput;

  onMount(() => {
    updateClock();
    clockTimer = window.setInterval(updateClock, 1000);
    dniInput?.focus();
  });

  onDestroy(() => {
    window.clearInterval(clockTimer);
    window.clearTimeout(dialogTimer);
  });

  function updateClock() {
    clock = new Date().toLocaleTimeString("es-AR", {
      hour12: false,
      timeZone: "America/Argentina/Buenos_Aires"
    });
  }

  async function submitAccess() {
    const cleanDni = dni.replace(/\D/g, "");
    if (!cleanDni) return;

    const response = await fetch("/api/access/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dni: cleanDni, source: "kiosk" })
    });
    const data = await response.json();

    result = {
      status: data.status,
      title: data.ok ? "Acceso correcto" : "Acceso denegado",
      detail: data.message
    };

    if (data.ok && data.client) {
      showAccessDialog(data.client);
      dni = "";
    } else if (!data.ok && data.client) {
      showDeniedDialog(data.client, data.message);
      dni = "";
    } else {
      showUnknownDniDialog(cleanDni, data.message);
      dni = "";
    }
  }

  function showAccessDialog(client) {
    const hasGraceAccess = client.days_remaining < 0 && client.grace_until && client.grace_days_remaining >= 0;
    const expiryText = hasGraceAccess
      ? `Tu cuota vencio el ${formatDate(client.membership_paid_until)}, pero tenes una prorroga activa hasta el ${formatDate(client.grace_until)}.`
      : client.days_remaining < 0
        ? `Tu cuota vencio el ${formatDate(client.membership_paid_until)}.`
        : `Tu cuota esta vigente hasta el ${formatDate(client.membership_paid_until)}. Te quedan ${client.days_remaining} dias restantes.`;

    dialogData = {
      status: "granted",
      eyebrow: "Acceso correcto",
      title: `Bienvenido, ${client.first_name}`,
      detail: expiryText,
      warning: warningText(client)
    };

    window.clearTimeout(dialogTimer);
    dialog.showModal();
    dialogTimer = window.setTimeout(closeDialog, 5000);
  }

  function showDeniedDialog(client, message) {
    const hasExpiredGrace = client.days_remaining < 0 && client.grace_until && client.grace_days_remaining < 0;
    const detail = client.days_remaining < 0
      ? `Tu cuota vencio el ${formatDate(client.membership_paid_until)}.`
      : message;
    const warning = hasExpiredGrace
      ? `Tu prorroga vencio el ${formatDate(client.grace_until)}. Regulariza tu cuota en recepcion.`
      : "Regulariza tu cuota en recepcion para volver a ingresar.";

    dialogData = {
      status: "denied",
      eyebrow: "Acceso denegado",
      title: `${client.first_name}, no podemos habilitar el ingreso`,
      detail,
      warning
    };

    window.clearTimeout(dialogTimer);
    dialog.showModal();
    dialogTimer = window.setTimeout(closeDialog, 5000);
  }

  function showUnknownDniDialog(enteredDni, message) {
    dialogData = {
      status: "denied",
      eyebrow: "DNI no encontrado",
      title: "No existe un cliente con ese DNI",
      detail: `Documento ingresado: ${enteredDni}.`,
      warning: message || "Verifica el numero o consulta en recepcion."
    };

    window.clearTimeout(dialogTimer);
    dialog.showModal();
    dialogTimer = window.setTimeout(closeDialog, 5000);
  }

  function warningText(client) {
    if (client.days_remaining < 0 && client.grace_until && client.grace_days_remaining >= 0) {
      return `Recorda regularizar tu cuota antes del ${formatDate(client.grace_until)}.`;
    }
    if (client.days_remaining < 0) return "Recorda pasar por recepcion para regularizar la cuota.";
    if (client.days_remaining === 0) return "Atencion: tu cuota vence hoy. Podes renovarla en recepcion.";
    if (client.days_remaining <= 7) return `Atencion: tu cuota vence en ${client.days_remaining} dias. Podes renovarla en recepcion.`;
    return "";
  }

  function closeDialog() {
    if (dialog?.open) dialog.close();
    result = { status: "", title: "", detail: "" };
    dniInput?.focus();
  }

  function formatDate(value) {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
</script>

<main class="login-shell">
  <section class="login-panel">
    <img class="login-logo" src="/assets/hercules-logo-clean.png" alt="Hercules Gym" />
    <form class="access-form" on:submit|preventDefault={submitAccess}>
      <label for="dni">Control de acceso</label>
      <div class="dni-row">
        <input id="dni" bind:this={dniInput} bind:value={dni} inputmode="numeric" autocomplete="off" placeholder="Ingrese numero de documento" />
        <button type="submit" class="login-icon-button" aria-label="Ingresar">
          <LogIn size={28} strokeWidth={2.4} />
        </button>
      </div>
      <div class="result" class:granted={result.status === "granted"} class:denied={result.status === "denied"}>
        <strong>{clock}</strong>
        {#if result.detail}
          <span>{result.detail}</span>
        {/if}
      </div>
    </form>
  </section>
  <p class="login-credit">(c) 2026 - Creado por Lucas Ramela</p>

  <dialog bind:this={dialog} class="access-dialog">
    <div class="dialog-content {dialogData.status}">
      <button class="dialog-close" type="button" aria-label="Cerrar" on:click={closeDialog}>x</button>
      <div class="dialog-status-icon" aria-hidden="true">
        {#if dialogData.status === "denied"}
          <XCircle size={58} strokeWidth={2.1} />
        {:else}
          <CheckCircle2 size={58} strokeWidth={2.1} />
        {/if}
      </div>
      <p class="dialog-eyebrow">{dialogData.eyebrow}</p>
      <h2>{dialogData.title}</h2>
      <p>{dialogData.detail}</p>
      {#if dialogData.warning}
        <p class="dialog-warning">{dialogData.warning}</p>
      {/if}
      <button type="button" on:click={closeDialog}>Continuar</button>
    </div>
  </dialog>
</main>
