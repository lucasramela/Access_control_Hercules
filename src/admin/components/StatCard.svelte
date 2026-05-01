<script>
  import { AlertTriangle, CalendarClock, TrendingUp, Users } from "lucide-svelte";

  export let title = "";
  export let value = "";
  export let helper = "";
  export let variant = "default";
  export let icon = "trending";
  export let actionLabel = "";
  export let actionIcon = null;
  export let onAction = null;

  const icons = {
    alert: AlertTriangle,
    clock: CalendarClock,
    trending: TrendingUp,
    users: Users
  };

  $: Icon = icons[icon] || TrendingUp;
  $: ActionIcon = actionIcon;
</script>

<article class="stat-card {variant}">
  <div class="stat-card-header">
    <span class="stat-icon"><svelte:component this={Icon} size={21} strokeWidth={2.2} /></span>
    <span class="stat-title">{title}</span>
  </div>
  <strong>{value}</strong>
  <small>{helper}</small>
  {#if actionLabel && onAction}
    <button type="button" class="stat-action" on:click={onAction} aria-label={actionLabel} title={actionLabel}>
      <span>{actionLabel}</span>
      {#if ActionIcon}
        <svelte:component this={ActionIcon} size={15} strokeWidth={2.5} />
      {/if}
    </button>
  {/if}
</article>
