<script>
  import {
    BadgeDollarSign,
    BellRing,
    CalendarCheck,
    CalendarClock,
    Landmark,
    LayoutDashboard,
    LogOut,
    UserCog,
    Users,
    WalletCards
  } from "lucide-svelte";

  export let activeTab = "dashboard";
  export let onNavigate = () => {};
  export let onLogout = () => {};
  export let allowedTabs = [];

  const items = [
    { tab: "dashboard", label: "Panel", icon: LayoutDashboard },
    { tab: "clients", label: "Clientes", icon: Users },
    { tab: "plans", label: "Planes", icon: BadgeDollarSign },
    { tab: "events", label: "Accesos", icon: CalendarCheck },
    { tab: "expiring", label: "Vencimientos", icon: CalendarClock },
    { tab: "alerts", label: "Alertas", icon: BellRing },
    { tab: "box", label: "Caja", icon: Landmark },
    { tab: "cash", label: "Finanzas", icon: WalletCards },
    { tab: "staff", label: "Personal", icon: UserCog }
  ];
</script>

<aside class="admin-sidebar">
  <div class="sidebar-logo">
    <img src="/assets/hercules-logo-clean.png" alt="Hercules Gym" />
  </div>
  <nav class="sidebar-nav modern-sidebar-nav" aria-label="Menu administrativo">
    {#each items.filter((item) => !allowedTabs.length || allowedTabs.includes(item.tab)) as item}
      <button class:active={activeTab === item.tab} class="tab-button" type="button" on:click={() => onNavigate(item.tab)}>
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
