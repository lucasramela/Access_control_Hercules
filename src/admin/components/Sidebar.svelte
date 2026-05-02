<script>
  import {
    BadgeDollarSign,
    BellRing,
    CalendarClock,
    DatabaseBackup,
    LayoutDashboard,
    LogOut,
    Menu,
    UserCog,
    Users,
    WalletCards,
    X
  } from "lucide-svelte";

  export let activeTab = "dashboard";
  export let onNavigate = () => {};
  export let onLogout = () => {};
  export let allowedTabs = [];
  let menuOpen = false;

  const navigateTo = (tab) => {
    onNavigate(tab);
    menuOpen = false;
  };

  const items = [
    { tab: "dashboard", label: "Panel", icon: LayoutDashboard },
    { tab: "clients", label: "Clientes", icon: Users },
    { tab: "plans", label: "Planes", icon: BadgeDollarSign },
    { tab: "expiring", label: "Vencimientos", icon: CalendarClock },
    { tab: "alerts", label: "Alertas", icon: BellRing },
    { tab: "cash", label: "Finanzas", icon: WalletCards },
    { tab: "staff", label: "Usuarios", icon: UserCog },
    { tab: "backup", label: "BackUp", icon: DatabaseBackup }
  ];
</script>

<aside class:mobile-menu-open={menuOpen} class="admin-sidebar">
  <div class="sidebar-logo">
    <img src="/assets/hercules-logo-clean.png" alt="Hercules Gym" />
  </div>
  <button
    class="mobile-menu-toggle"
    type="button"
    aria-label={menuOpen ? "Cerrar menu" : "Abrir menu"}
    aria-expanded={menuOpen}
    on:click={() => (menuOpen = !menuOpen)}
  >
    {#if menuOpen}
      <X size={22} strokeWidth={2.4} />
    {:else}
      <Menu size={22} strokeWidth={2.4} />
    {/if}
  </button>
  <nav class="sidebar-nav modern-sidebar-nav" aria-label="Menu administrativo">
    {#each items.filter((item) => !allowedTabs.length || allowedTabs.includes(item.tab)) as item}
      <button class:active={activeTab === item.tab} class:backup-nav={item.tab === "backup"} class="tab-button" type="button" on:click={() => navigateTo(item.tab)}>
        <span class="nav-icon"><svelte:component this={item.icon} size={19} strokeWidth={2.2} /></span>
        <span>{item.label}</span>
      </button>
    {/each}
  </nav>
  <button class="logout-button modern-logout" type="button" on:click={onLogout}>
    <LogOut size={18} />
    <span>Cerrar sesion</span>
  </button>
  <p class="sidebar-credit">(c) 2026 - Creado por Lucas Ramela</p>
</aside>
