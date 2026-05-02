<script>
  import { onMount } from "svelte";
  import { ArrowRight, BadgeDollarSign, BellRing, CalendarCheck, CalendarClock, CalendarDays, Clock3, CreditCard, DatabaseBackup, Download, Edit3, FileText, MessageCircle, ShieldCheck, Tags, Trash2, Upload, UserPlus } from "lucide-svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import StatCard from "./components/StatCard.svelte";
  import DashboardChart from "./components/DashboardChart.svelte";
  import PlanMapCard from "./components/PlanMapCard.svelte";
  import PaymentsTable from "./components/PaymentsTable.svelte";
  import StatusBadge from "./components/StatusBadge.svelte";

  const emptyClientForm = {
    first_name: "",
    last_name: "",
    dni: "",
    phone: "",
    email: "",
    plan_name: "MENSUAL",
    membership_paid_until: "",
    address: "",
    weight_kg: "",
    height_cm: "",
    birth_date: "",
    active: true
  };

  let isLoggedIn = false;
  let activeTab = "dashboard";
  let loginForm = { user: "admin", password: "admin123" };
  let loginMessage = "";
  let clientForm = { ...emptyClientForm };
  let editingClientDni = "";
  let initialPaymentForm = { method: "Efectivo", amount: "" };
  let formMessage = "";
  let loadedClients = [];
  let loadedPlans = [];
  let loadedEvents = [];
  let loadedCash = [];
  let loadedPayments = [];
  let cashSessions = [];
  let cashStatus = null;
  let loadedReports = null;
  let alerts = [];
  let staff = [];
  let clientSearch = "";
  let expiringSearch = "";
  let cashSearch = "";
  let paymentSearch = "";
  let cashHistoryFilter = { from: "", to: "" };
  let paymentDateFilter = currentMonthRange();
  let cashMovementFilter = currentMonthRange();
  let accessFilter = { fromDate: "", toDate: "" };
  let currentUser = null;
  let currentTime = "";
  let clientPage = 1;
  let expiringPage = 1;
  let eventsPage = 1;
  let cashPage = 1;
  let cashHistoryPage = 1;
  let paymentPage = 1;
  let staffPage = 1;
  let alertPage = 1;
  const rowsPerPage = 10;
  let adminDialog;
  let adminDialogData = { title: "", message: "" };
  let clientDeleteDialog;
  let clientDeleteCandidate = null;
  let clientFileDialog;
  let clientFile = null;
  let chargeDialog;
  let chargeForm = { dni: "", charge_type: "current", plan_name: "MENSUAL", method: "Efectivo", amount: "" };
  let chargeClient = null;
  let graceDialog;
  let graceForm = { dni: "", grace_until: "", grace_note: "" };
  let graceClient = null;
  let planDialog;
  let planDeleteDialog;
  let planDialogMode = "create";
  let planOriginalName = "";
  let planForm = { name: "", price: "" };
  let planDeleteCandidate = null;
  let restoreInput;
  let cashOpeningForm = { name: "Caja Principal", opening_amount: "", notes: "" };
  let cashMovementForm = { type: "Egreso", concept: "", method: "Efectivo", amount: "", notes: "" };
  let cashCloseForm = { closing_amount: "", notes: "" };

  $: currentDate = new Date().toLocaleString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Argentina/Buenos_Aires"
  }).replace(/^\p{L}/u, (letter) => letter.toUpperCase());

  $: filteredClients = filterRows(loadedClients, clientSearch, clientSearchText);
  $: expiringClients = loadedClients
    .filter((client) => client.active && daysUntil(client.membership_paid_until) <= 7)
    .sort((a, b) => daysUntil(a.membership_paid_until) - daysUntil(b.membership_paid_until));
  $: filteredExpiring = filterRows(expiringClients, expiringSearch, clientSearchText);
  $: filteredCash = filterRows(loadedCash, cashSearch, cashSearchText);
  $: filteredPayments = filterRows(loadedPayments, paymentSearch, paymentSearchText);
  $: filteredCashSessions = filterCashSessions(cashSessions, cashHistoryFilter);
  $: pagedClients = paginate(filteredClients, clientPage);
  $: totalClientPages = totalPages(filteredClients);
  $: if (clientPage > totalClientPages) clientPage = totalClientPages;
  $: pagedExpiring = paginate(filteredExpiring, expiringPage);
  $: totalExpiringPages = totalPages(filteredExpiring);
  $: if (expiringPage > totalExpiringPages) expiringPage = totalExpiringPages;
  $: pagedCash = paginate(filteredCash, cashPage);
  $: totalCashPages = totalPages(filteredCash);
  $: if (cashPage > totalCashPages) cashPage = totalCashPages;
  $: pagedCashSessions = paginate(filteredCashSessions, cashHistoryPage);
  $: totalCashHistoryPages = totalPages(filteredCashSessions);
  $: if (cashHistoryPage > totalCashHistoryPages) cashHistoryPage = totalCashHistoryPages;
  $: pagedPayments = paginate(filteredPayments, paymentPage);
  $: totalPaymentPages = totalPages(filteredPayments);
  $: if (paymentPage > totalPaymentPages) paymentPage = totalPaymentPages;
  $: pagedEvents = paginate(loadedEvents, eventsPage);
  $: totalEventPages = totalPages(loadedEvents);
  $: if (eventsPage > totalEventPages) eventsPage = totalEventPages;
  $: pagedStaff = paginate(staff, staffPage);
  $: totalStaffPages = totalPages(staff);
  $: if (staffPage > totalStaffPages) staffPage = totalStaffPages;
  $: pagedAlerts = paginate(alerts, alertPage);
  $: totalAlertPages = totalPages(alerts);
  $: if (alertPage > totalAlertPages) alertPage = totalAlertPages;
  $: duplicateDniClient = findDuplicateDni();
  $: canManageAdvanced = currentUser?.role === "admin";
  $: allowedTabs = canManageAdvanced
    ? ["dashboard", "clients", "plans", "expiring", "alerts", "cash", "staff", "backup"]
    : ["dashboard", "clients", "expiring", "alerts"];

  $: planLabels = (loadedReports?.planCounts || []).map((row) => row.label);
  $: planSeries = (loadedReports?.planCounts || []).map((row) => Number(row.total || 0));
  $: dailyPaymentRows = groupPaymentsByDay(filteredPayments);
  $: dailyCategories = dailyPaymentRows.map((row) => String(row.day || "").slice(5));
  $: dailySeries = [{ name: "Pagos", data: dailyPaymentRows.map((row) => Number(row.total || 0)) }];
  $: incomeByPlanRows = groupPaymentsBy(filteredPayments, "plan_name");
  $: incomeByPlanLabels = incomeByPlanRows.map((row) => row.label);
  $: incomeByPlanSeries = incomeByPlanRows.map((row) => Number(row.total || 0));
  $: incomeByMethodRows = groupPaymentsBy(filteredPayments, "method");
  $: incomeByMethodLabels = incomeByMethodRows.map((row) => row.label);
  $: incomeByMethodSeries = incomeByMethodRows.map((row) => Number(row.total || 0));
  $: todayIncome = sumPaymentsForDate(loadedPayments, todayKey());
  $: financeMonthLabel = monthLabelFromFilter(paymentDateFilter);
  $: dailyMethodChart = buildDailyMethodChart(filteredPayments, paymentDateFilter);
  $: dailyMethodCategories = dailyMethodChart.categories;
  $: dailyMethodSeries = dailyMethodChart.series;
  $: planPaymentRows = groupPlanPayments(filteredPayments);
  $: totalPaidPlans = filteredPayments.length;
  $: accessStatusLabels = ["Permitidos", "Denegados"];
  $: accessStatusSeries = [
    loadedEvents.filter((event) => event.status === "granted").length,
    loadedEvents.filter((event) => event.status !== "granted").length
  ];

  onMount(() => {
    updateTopbarClock();
    const timer = window.setInterval(updateTopbarClock, 1000);
    checkSession();
    return () => window.clearInterval(timer);
  });

  async function checkSession() {
    const data = await api("/api/admin/me", { publicRequest: true });
    if (data.ok) {
      isLoggedIn = true;
      currentUser = data.user;
      await loadDashboard();
    }
  }

  async function login() {
    const data = await api("/api/admin/login", { method: "POST", body: loginForm, publicRequest: true });
    if (!data.ok) {
      loginMessage = data.message;
      return;
    }
    isLoggedIn = true;
    currentUser = data.user;
    await loadDashboard();
  }

  async function logout() {
    await api("/api/admin/logout", { method: "POST", publicRequest: true });
    isLoggedIn = false;
    currentUser = null;
  }

  async function loadDashboard() {
    const loaders = [loadPlans(), loadClients(), loadEvents(), loadReports(), loadAlerts(), loadCash(), loadPayments(), loadCashStatus(), loadCashSessions()];
    if (currentUser?.role === "admin") loaders.push(loadStaff());
    await Promise.all(loaders);
  }

  async function loadClients() {
    loadedClients = await api("/api/clients");
  }

  async function loadPlans() {
    loadedPlans = await api("/api/plans");
    if (!loadedPlans.some((plan) => plan.name === clientForm.plan_name)) clientForm.plan_name = loadedPlans[0]?.name || "MENSUAL";
    if (!initialPaymentForm.amount) syncInitialPaymentAmount();
  }

  async function loadEvents() {
    const params = new URLSearchParams(accessFilter);
    loadedEvents = await api(`/api/access/events?${params.toString()}`);
    eventsPage = 1;
  }

  async function loadReports() {
    const params = new URLSearchParams(paymentDateFilter);
    loadedReports = await api(`/api/reports?${params.toString()}`);
  }

  async function loadAlerts() {
    alerts = await api("/api/alerts/expiring");
  }

  async function loadCash() {
    const params = new URLSearchParams(cashMovementFilter);
    loadedCash = await api(`/api/cash?${params.toString()}`);
    cashPage = 1;
  }

  async function loadPayments() {
    const params = new URLSearchParams(paymentDateFilter);
    loadedPayments = await api(`/api/payments?${params.toString()}`);
    paymentPage = 1;
  }

  async function loadCashStatus() {
    cashStatus = await api("/api/cash/status");
  }

  async function loadCashSessions() {
    cashSessions = await api("/api/cash/sessions");
  }

  async function loadStaff() {
    staff = await api("/api/staff");
  }

  function setActiveTab(tab) {
    if (!canAccessTab(tab)) {
      activeTab = "dashboard";
      return;
    }
    activeTab = tab;
  }

  function canAccessTab(tab) {
    if (tab === "box" || tab === "events") return false;
    if (canManageAdvanced) return true;
    return ["dashboard", "clients", "expiring", "alerts"].includes(tab);
  }

  async function applyPaymentDateFilter() {
    await Promise.all([loadPayments(), loadReports()]);
  }

  async function applyCashMovementFilter() {
    await loadCash();
  }

  function updateTopbarClock() {
    currentTime = new Date().toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "America/Argentina/Buenos_Aires"
    });
  }

  function newClient() {
    resetClientForm();
    setActiveTab("add-client");
  }

  function resetClientForm() {
    clientForm = { ...emptyClientForm, plan_name: loadedPlans[0]?.name || "MENSUAL" };
    editingClientDni = "";
    initialPaymentForm = { method: "Efectivo", amount: getPlanPrice(loadedPlans[0]?.name || "MENSUAL") || "" };
    formMessage = "";
  }

  async function saveClient() {
    if (duplicateDniClient) {
      showAdminDialog("DNI duplicado", `Ya existe un cliente registrado con ese DNI: ${duplicateDniClient.first_name} ${duplicateDniClient.last_name}.`);
      return;
    }
    if (editingClientDni && editingClientDni !== clientForm.dni) {
      showAdminDialog("DNI no editable", "Para cambiar el DNI, elimina el cliente y cargalo nuevamente con el documento correcto.");
      return;
    }
    const data = await api("/api/clients", { method: "POST", body: buildClientPayload() });
    formMessage = data.message;
    showAdminDialog(data.ok ? "Cliente guardado" : "No se pudo guardar", data.message);
    if (data.ok) {
      resetClientForm();
      await loadDashboard();
      setActiveTab("clients");
    }
  }

  async function saveAndChargeClient(event) {
    if (event?.currentTarget?.form && !event.currentTarget.form.reportValidity()) return;
    if (duplicateDniClient) {
      showAdminDialog("DNI duplicado", `Ya existe un cliente registrado con ese DNI: ${duplicateDniClient.first_name} ${duplicateDniClient.last_name}.`);
      return;
    }
    if (editingClientDni && editingClientDni !== clientForm.dni) {
      showAdminDialog("DNI no editable", "Para cambiar el DNI, elimina el cliente y cargalo nuevamente con el documento correcto.");
      return;
    }
    const saved = await api("/api/clients", { method: "POST", body: buildClientPayload() });
    if (!saved.ok) {
      formMessage = saved.message;
      showAdminDialog("No se pudo guardar", saved.message);
      return;
    }

    const charged = await api(`/api/clients/${encodeURIComponent(clientForm.dni)}/charge`, {
      method: "POST",
      body: {
        amount: initialPaymentForm.amount,
        method: initialPaymentForm.method,
        concept: clientForm.plan_name === "DIARIO" ? "Diario" : clientForm.plan_name === "SEMANAL" ? "Semanal" : "Mensualidad",
        plan_name: clientForm.plan_name,
        membership_paid_until: clientForm.membership_paid_until,
        notes: "Cobro inicial al guardar cliente"
      }
    });

    formMessage = charged.message;
    showAdminDialog(charged.ok ? "Cliente guardado y cobrado" : "Cliente guardado, cobro pendiente", charged.message);
    if (charged.ok) {
      resetClientForm();
      await loadDashboard();
      setActiveTab("clients");
    } else {
      await loadDashboard();
    }
  }

  function editClient(client) {
    editingClientDni = client.dni;
    clientForm = {
      ...emptyClientForm,
      ...client,
      active: Boolean(client.active),
      weight_kg: client.weight_kg ?? "",
      height_cm: client.height_cm ?? "",
      birth_date: client.birth_date ?? "",
      address: client.address ?? ""
    };
    initialPaymentForm = { method: "Efectivo", amount: getPlanPrice(client.plan_name || "MENSUAL") || "" };
    formMessage = "Editando cliente existente. Al guardar se actualizara por DNI.";
    setActiveTab("add-client");
  }

  function deleteClient(client) {
    clientDeleteCandidate = client;
    clientDeleteDialog.showModal();
  }

  async function confirmDeleteClient() {
    if (!clientDeleteCandidate) return;
    const data = await api(`/api/clients/${encodeURIComponent(clientDeleteCandidate.dni)}`, { method: "DELETE" });
    showAdminDialog(data.ok ? "Cliente eliminado" : "Error", data.message);
    if (data.ok) {
      clientDeleteDialog.close();
      clientDeleteCandidate = null;
      await loadDashboard();
    }
  }

  function openCreatePlan() {
    planDialogMode = "create";
    planOriginalName = "";
    planForm = { name: "", price: "" };
    planDialog.showModal();
  }

  function openEditPlan(plan) {
    planDialogMode = "edit";
    planOriginalName = plan.name;
    planForm = { name: plan.name, price: Number(plan.price || 0) };
    planDialog.showModal();
  }

  async function submitPlan() {
    const payload = { ...planForm, previous_name: planOriginalName };
    const data = await api("/api/plans", { method: "POST", body: payload });
    showAdminDialog(data.ok ? (planDialogMode === "create" ? "Plan agregado" : "Plan actualizado") : "Error", data.message);
    if (data.ok) {
      planDialog.close();
      await loadPlans();
      await loadReports();
    }
  }

  function openDeletePlan(plan) {
    planDeleteCandidate = plan;
    planDeleteDialog.showModal();
  }

  async function confirmDeletePlan() {
    if (!planDeleteCandidate) return;
    const data = await api(`/api/plans/${encodeURIComponent(planDeleteCandidate.name)}`, { method: "DELETE" });
    showAdminDialog(data.ok ? "Plan eliminado" : "Error", data.message);
    if (data.ok) {
      planDeleteDialog.close();
      planDeleteCandidate = null;
      await loadPlans();
      await loadReports();
    }
  }

  async function showClientFile(dni) {
    const data = await api(`/api/clients/${encodeURIComponent(dni)}`);
    if (!data.ok) {
      showAdminDialog("Error", data.message);
      return;
    }
    clientFile = data;
    clientFileDialog.showModal();
  }

  function openCharge(client) {
    chargeClient = client;
    chargeForm = {
      dni: client.dni,
      charge_type: "current",
      plan_name: client.plan_name || "MENSUAL",
      method: "Efectivo",
      amount: getPlanPrice(client.plan_name || "MENSUAL")
    };
    chargeDialog.showModal();
  }

  $: if (chargeClient) updateChargeAmount();

  function updateChargeAmount() {
    let planName = chargeClient ? chargeClient.plan_name : "MENSUAL";
    if (chargeForm.charge_type === "change") planName = chargeForm.plan_name;
    if (chargeForm.charge_type === "DIARIO") planName = "DIARIO";
    if (chargeForm.charge_type === "SEMANAL") planName = "SEMANAL";
    const amount = getPlanPrice(planName);
    if (String(chargeForm.amount) !== String(amount)) chargeForm.amount = amount;
  }

  async function submitCharge() {
    const conceptMap = { current: "Mensualidad", change: "Mensualidad", DIARIO: "Diario", SEMANAL: "Semanal" };
    const body = {
      amount: chargeForm.amount,
      method: chargeForm.method,
      concept: conceptMap[chargeForm.charge_type] || "Mensualidad"
    };
    if (chargeForm.charge_type === "change") body.plan_name = chargeForm.plan_name;
    if (chargeForm.charge_type === "DIARIO" || chargeForm.charge_type === "SEMANAL") body.plan_name = chargeForm.charge_type;
    const data = await api(`/api/clients/${encodeURIComponent(chargeForm.dni)}/charge`, { method: "POST", body });
    showAdminDialog(data.ok ? "Cobro registrado" : "Error", data.message);
    if (data.ok) {
      chargeDialog.close();
      await loadDashboard();
    }
  }

  function openGrace(client) {
    graceClient = client;
    graceForm = { dni: client.dni, grace_until: client.grace_until || "", grace_note: client.grace_note || "" };
    graceDialog.showModal();
  }

  async function submitGrace() {
    const data = await api(`/api/clients/${encodeURIComponent(graceForm.dni)}/grace`, { method: "POST", body: graceForm });
    showAdminDialog(data.ok ? "Prorroga guardada" : "Error", data.message);
    if (data.ok) {
      graceDialog.close();
      await loadDashboard();
    }
  }

  async function openCashBox() {
    const data = await api("/api/cash/open", { method: "POST", body: cashOpeningForm });
    showAdminDialog(data.ok ? "Caja abierta" : "Error", data.message);
    if (data.ok) {
      cashOpeningForm = { name: "Caja Principal", opening_amount: "", notes: "" };
      await Promise.all([loadCash(), loadPayments(), loadCashStatus(), loadCashSessions(), loadReports()]);
    }
  }

  async function submitCashMovement() {
    const data = await api("/api/cash", { method: "POST", body: cashMovementForm });
    showAdminDialog(data.ok ? "Movimiento registrado" : "Error", data.message);
    if (data.ok) {
      cashMovementForm = { type: cashMovementForm.type, concept: "", method: cashMovementForm.method, amount: "", notes: "" };
      await Promise.all([loadCash(), loadPayments(), loadCashStatus(), loadCashSessions(), loadReports()]);
    }
  }

  async function closeCashBox() {
    const data = await api("/api/cash/close", { method: "POST", body: cashCloseForm });
    showAdminDialog(data.ok ? "Caja cerrada" : "Error", data.message);
    if (data.ok) {
      cashCloseForm = { closing_amount: "", notes: "" };
      await Promise.all([loadCashStatus(), loadCashSessions()]);
    }
  }

  async function exportClientsExcel() {
    await downloadFile("/api/clients/export");
  }

  async function downloadSystemBackup() {
    await downloadFile("/api/system/backup");
  }

  function openRestorePicker() {
    restoreInput?.click();
  }

  async function restoreSystemBackup(event) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!window.confirm("Restaurar una copia reemplazara la base al reiniciar el servidor. Antes se guardara una copia previa. ¿Continuar?")) return;
    const response = await fetch("/api/system/restore", {
      method: "POST",
      headers: { "Content-Type": "application/zip" },
      body: await file.arrayBuffer()
    });
    const data = await response.json();
    showAdminDialog(data.ok ? "Backup cargado" : "Error", data.message);
  }

  function showAdminDialog(title, message) {
    adminDialogData = { title, message };
    adminDialog.showModal();
  }

  async function downloadFile(url) {
    const response = await fetch(url);
    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: "No se pudo descargar el archivo." }));
      showAdminDialog("Error", data.message);
      return;
    }
    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") || "";
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] || "descarga";
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href);
    link.remove();
  }

  function filterRows(rows, query, textBuilder) {
    const needle = normalizeSearch(query);
    if (!needle) return rows;
    return rows.filter((row) => normalizeSearch(textBuilder(row)).includes(needle));
  }

  function paginate(rows, page) {
    return rows.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  }

  function totalPages(rows) {
    return Math.max(1, Math.ceil(rows.length / rowsPerPage));
  }

  function clientSearchText(client) {
    return [client.first_name, client.last_name, client.dni, client.phone, client.email, client.plan_name, membershipStatus(client.membership_paid_until), formatDate(client.membership_paid_until)].join(" ");
  }

  function cashSearchText(item) {
    return [item.type, item.concept, item.method, item.notes, item.amount, formatMoney(item.amount), formatDateTime(item.created_at)].join(" ");
  }

  function paymentSearchText(item) {
    return [item.first_name, item.last_name, item.dni, item.plan_name, item.method, item.concept, item.notes, item.amount, formatMoney(item.amount), formatDateTime(item.paid_at)].join(" ");
  }

  function groupPaymentsBy(rows, key) {
    const map = new Map();
    for (const row of rows) {
      const label = row[key] || "Sin dato";
      map.set(label, (map.get(label) || 0) + Number(row.amount || 0));
    }
    return Array.from(map, ([label, total]) => ({ label, total })).sort((a, b) => b.total - a.total);
  }

  function groupPaymentsByDay(rows) {
    const map = new Map();
    for (const row of rows) {
      const day = String(row.paid_at || "").slice(0, 10);
      if (!day) continue;
      map.set(day, (map.get(day) || 0) + Number(row.amount || 0));
    }
    return Array.from(map, ([day, total]) => ({ day, total })).sort((a, b) => a.day.localeCompare(b.day));
  }

  function methodIncome(method) {
    const row = incomeByMethodRows.find((item) => item.label.toLowerCase() === method.toLowerCase());
    return Number(row?.total || 0);
  }

  function monthLabelFromFilter(filter) {
    const base = filter.from ? new Date(`${filter.from}T00:00:00`) : new Date();
    const month = base.toLocaleDateString("es-AR", { month: "long" });
    return month.charAt(0).toUpperCase() + month.slice(1);
  }

  function daysInFilterMonth(filter) {
    const base = filter.from ? new Date(`${filter.from}T00:00:00`) : new Date();
    return {
      year: base.getFullYear(),
      monthIndex: base.getMonth(),
      days: new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()
    };
  }

  function buildDailyMethodChart(rows, filter) {
    const methods = ["Efectivo", "Transferencia", "Mercado Pago"];
    const { year, monthIndex, days } = daysInFilterMonth(filter);
    const categories = Array.from({ length: days }, (_, index) => String(index + 1).padStart(2, "0"));
    const totals = new Map(methods.map((method) => [method, Array(days).fill(0)]));
    for (const row of rows) {
      const paidAt = String(row.paid_at || "").slice(0, 10);
      const date = paidAt ? new Date(`${paidAt}T00:00:00`) : null;
      if (!date || date.getFullYear() !== year || date.getMonth() !== monthIndex) continue;
      const method = methods.includes(row.method) ? row.method : "Efectivo";
      totals.get(method)[date.getDate() - 1] += Number(row.amount || 0);
    }
    return {
      categories,
      series: methods.map((method) => ({ name: method, data: totals.get(method) }))
    };
  }

  function groupPlanPayments(rows) {
    const methods = ["Efectivo", "Transferencia", "Mercado Pago"];
    const map = new Map();
    for (const row of rows) {
      const plan = row.plan_name || "Sin plan";
      if (!map.has(plan)) {
        map.set(plan, {
          label: plan,
          count: 0,
          total: 0,
          methods: Object.fromEntries(methods.map((method) => [method, { count: 0, total: 0 }]))
        });
      }
      const entry = map.get(plan);
      const method = methods.includes(row.method) ? row.method : "Efectivo";
      entry.count += 1;
      entry.total += Number(row.amount || 0);
      entry.methods[method].count += 1;
      entry.methods[method].total += Number(row.amount || 0);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }

  function todayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }

  function sumPaymentsForDate(rows, day) {
    return rows
      .filter((row) => String(row.paid_at || "").slice(0, 10) === day)
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
  }

  function filterCashSessions(rows, filter) {
    const from = filter.from ? new Date(`${filter.from}T00:00:00`) : null;
    const to = filter.to ? new Date(`${filter.to}T23:59:59`) : null;
    return rows.filter((session) => {
      const openedAt = new Date(String(session.opened_at || "").replace(" ", "T"));
      if (from && openedAt < from) return false;
      if (to && openedAt > to) return false;
      return true;
    });
  }

  function currentMonthRange() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { from, to };
  }

  function normalizeSearch(value) {
    return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  }

  function membershipStatus(value) {
    const days = daysUntil(value);
    if (Number.isNaN(days)) return "Sin fecha";
    if (days < 0) return "VENCIDA";
    if (days <= 7) return "POR VENCER";
    return "PAGADA";
  }

  function daysUntil(value) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const paidUntil = new Date(`${value}T00:00:00`);
    return Math.ceil((paidUntil - today) / 86400000);
  }

  function getPlanPrice(planName) {
    const plan = loadedPlans.find((item) => item.name === planName);
    return plan ? Number(plan.price) : 0;
  }

  function syncInitialPaymentAmount() {
    initialPaymentForm = { ...initialPaymentForm, amount: getPlanPrice(clientForm.plan_name) || "" };
  }

  function buildClientPayload() {
    return editingClientDni
      ? { ...clientForm, allow_update: true, original_dni: editingClientDni }
      : clientForm;
  }

  function planIcon(planName) {
    return { PERSONALIZADO: Tags, MENSUAL: BadgeDollarSign, SEMANAL: CalendarCheck, DIARIO: CalendarClock }[planName] || BadgeDollarSign;
  }

  function findDuplicateDni() {
    const current = cleanNumber(clientForm.dni);
    if (!current) return null;
    return loadedClients.find((client) => cleanNumber(client.dni) === current && cleanNumber(editingClientDni) !== current) || null;
  }

  function cleanNumber(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function accessStatusLabel(status) {
    return status === "granted" ? "Permitido" : "Denegado";
  }

  async function api(url, options = {}) {
    const fetchOptions = { method: options.method || "GET", headers: {} };
    if (options.body) {
      fetchOptions.headers["Content-Type"] = "application/json";
      fetchOptions.body = JSON.stringify(options.body);
    }
    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    if (response.status === 401 && !options.publicRequest) isLoggedIn = false;
    return data;
  }

  function formatDate(value) {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  function formatDateTime(value) {
    if (!value) return "";
    return new Date(value.replace(" ", "T")).toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
      hour12: false,
      timeZone: "America/Argentina/Buenos_Aires"
    });
  }

  function formatMoney(value) {
    return Number(value || 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
</script>

{#if !isLoggedIn}
  <section class="admin-login">
    <form class="admin-login-card modern-admin-login-card" on:submit|preventDefault={login}>
      <div class="admin-login-brand">
        <img src="/assets/hercules-logo-clean.png" alt="Hercules Gym" />
      </div>
      <div class="admin-login-heading">
        <span class="admin-kicker">Panel administrativo</span>
        <h1>Acceso al sistema</h1>
        <p>Gestion de clientes, cuotas y operaciones diarias.</p>
      </div>
      <div class="admin-login-fields">
        <label>Usuario<input bind:value={loginForm.user} autocomplete="username" required /></label>
        <label>Clave<input bind:value={loginForm.password} type="password" autocomplete="current-password" required /></label>
      </div>
      <button type="submit">Ingresar</button>
      {#if loginMessage}<p class="admin-login-message">{loginMessage}</p>{/if}
    </form>
  </section>
{:else}
  <main class="admin-app modern-admin-app">
    <Sidebar activeTab={activeTab} allowedTabs={allowedTabs} onNavigate={setActiveTab} onLogout={logout} />

    <section class="admin-content">
      <header class="admin-topbar">
          <div class="topbar-actions">
            <div class="topbar-date-card">
              <CalendarDays size={18} strokeWidth={2.3} />
              <div>
                <small>Hoy</small>
                <strong>{currentDate}</strong>
              </div>
            </div>
            <div class="topbar-date-card topbar-time-card">
              <Clock3 size={18} strokeWidth={2.3} />
              <div>
                <small>Hora</small>
                <strong>{currentTime}</strong>
              </div>
            </div>
          <button type="button" class:active-alert={alerts.length > 0} class="topbar-alert-button" on:click={() => setActiveTab("alerts")} aria-label="Alertas" title="Alertas">
            <BellRing size={18} strokeWidth={2.4} />
            {#if alerts.length}<span>{alerts.length}</span>{/if}
          </button>
        </div>
      </header>

      {#if activeTab === "dashboard"}
        <section class="tab-panel active modern-page">
          <div class="page-title">
            <span class="admin-kicker">Panel administrativo</span>
            <h1>Resumen operativo</h1>
            <p>Indicadores principales, actividad financiera y vencimientos relevantes.</p>
          </div>
          <div class="stat-grid">
            <StatCard title="Ingresos" value={`$ ${formatMoney(loadedReports?.totals?.income)}`} helper="Ingresos del mes" icon="trending" variant="success" />
            <StatCard title="Alumnos" value={loadedReports?.totals?.clients || 0} helper="Registrados en sistema" icon="users" variant="neutral" />
            <StatCard title="Vencidas" value={loadedReports?.totals?.overdue || 0} helper="Cuotas requieren atencion" icon="alert" variant="danger" actionLabel="Ver cuotas" actionIcon={ArrowRight} onAction={() => setActiveTab("expiring")} />
            <StatCard title="Prorrogas" value={loadedReports?.totals?.gracePromises || 0} helper="Promesas de pago activas" icon="clock" variant="warning" actionLabel="Ver prorrogas" actionIcon={ArrowRight} onAction={() => setActiveTab("alerts")} />
          </div>
          <div class="dashboard-charts modern-dashboard-charts">
            <DashboardChart title="Distribucion de planes" subtitle="Cantidad de clientes por plan" type="donut" series={planSeries} labels={planLabels} />
            <DashboardChart title="Pagos diarios del mes" subtitle="Importes cobrados por dia" type="area" series={dailySeries} categories={dailyCategories} height={320} />
            <PlanMapCard rows={loadedReports?.planCounts || []} />
          </div>
          <article class="dashboard-panel modern-panel">
            <div class="section-title"><h2>Proximos vencimientos</h2></div>
            <PaymentsTable clients={expiringClients.slice(0, 10)} onCharge={openCharge} onGrace={openGrace} onDetail={(client) => showClientFile(client.dni)} />
          </article>
        </section>
      {/if}

      {#if activeTab === "add-client"}
        <section class="tab-panel active modern-page">
          <form class="client-form" on:submit|preventDefault={saveClient}>
            <div class="section-title">
              <div><h2>Nuevo Cliente</h2><p>Alta y actualizacion de clientes por DNI.</p></div>
              <button class="icon-close-button" type="button" aria-label="Cerrar" on:click={() => { resetClientForm(); setActiveTab("clients"); }}>x</button>
            </div>
            <div class="form-grid">
              <label>Nombre *<input bind:value={clientForm.first_name} required /></label>
              <label>Apellido *<input bind:value={clientForm.last_name} required /></label>
              <label class={duplicateDniClient ? "has-error" : ""}>DNI *<input class={duplicateDniClient ? "error-input" : ""} bind:value={clientForm.dni} inputmode="numeric" required />{#if duplicateDniClient}<small class="field-error">DNI ya registrado: {duplicateDniClient.first_name} {duplicateDniClient.last_name}</small>{/if}</label>
              <label>Celular *<input bind:value={clientForm.phone} required /></label>
              <label>Email *<input bind:value={clientForm.email} type="email" required /></label>
              <label>Plan *<select bind:value={clientForm.plan_name} on:change={syncInitialPaymentAmount} required>{#each loadedPlans as plan}<option value={plan.name}>{plan.name}</option>{/each}</select></label>
              <label>Mensualidad hasta *<input bind:value={clientForm.membership_paid_until} type="date" required /></label>
              <label>Direccion<input bind:value={clientForm.address} /></label>
              <label>Peso kg<input bind:value={clientForm.weight_kg} type="number" min="0" step="0.1" /></label>
              <label>Estatura cm<input bind:value={clientForm.height_cm} type="number" min="0" step="0.1" /></label>
              <label>Fecha nacimiento<input bind:value={clientForm.birth_date} type="date" /></label>
              <label class="checkbox-row"><input bind:checked={clientForm.active} type="checkbox" /> Cliente activo</label>
            </div>
            <section class="initial-payment-box">
              <div>
                <h3>Cobro inicial</h3>
                <p>Usa el precio del plan seleccionado y registra el pago al guardar.</p>
              </div>
              <label>Metodo<select bind:value={initialPaymentForm.method}><option>Efectivo</option><option>Transferencia</option><option>Mercado Pago</option></select></label>
              <label>Monto $<input bind:value={initialPaymentForm.amount} type="number" min="0" step="0.01" required /></label>
            </section>
            <div class="client-form-actions">
              <button type="submit" class="secondary-submit" disabled={Boolean(duplicateDniClient)}>Guardar cliente</button>
              <button type="button" class="primary-submit" disabled={Boolean(duplicateDniClient)} on:click={saveAndChargeClient}>Guardar y cobrar cliente</button>
            </div>
            <p class="form-message">{formMessage}</p>
          </form>
        </section>
      {/if}

      {#if activeTab === "clients"}
        <section class="tab-panel active modern-page">
          <div class="section-title">
            <h2>Clientes</h2>
            <div class="header-actions">
              {#if canManageAdvanced}<button type="button" class="secondary-action" on:click={exportClientsExcel}><Download size={18} strokeWidth={2.4} /> Exportar Excel</button>{/if}
              <button type="button" class="client-create-action" on:click={newClient} aria-label="Nuevo cliente" title="Nuevo cliente">
                <UserPlus size={19} strokeWidth={2.5} />
                <span>Agregar cliente</span>
              </button>
            </div>
          </div>
          <div class="search-bar"><input bind:value={clientSearch} on:input={() => clientPage = 1} type="search" placeholder="Buscar por cliente, DNI, plan o estado" /></div>
          <div class="modern-table-wrap">
            {#if pagedClients.length}
              <table class="modern-table">
                <thead><tr><th>Cliente</th><th>Plan</th><th>Ultimo pago</th><th>Vencimiento</th><th>Monto</th><th>Estado</th><th>Acciones</th><th>Cobrar</th></tr></thead>
                <tbody>
                  {#each pagedClients as client}
                    <tr>
                      <td><strong>{client.last_name}, {client.first_name}</strong><br><span>DNI {client.dni}</span></td>
                      <td>{client.plan_name || "MENSUAL"}</td>
                      <td>{client.last_payment ? formatDateTime(client.last_payment) : "-"}</td>
                      <td>{formatDate(client.membership_paid_until)}</td>
                      <td>$ {formatMoney(client.last_amount || getPlanPrice(client.plan_name))}</td>
                      <td><StatusBadge status={client.active ? membershipStatus(client.membership_paid_until) : "Inactivo"} tone={client.active ? "" : "neutral"} /></td>
                      <td class="modern-actions">
                        <button type="button" class="ghost-action" title="Ficha" on:click={() => showClientFile(client.dni)}><FileText size={16} /></button>
                        <button type="button" class="ghost-action" title="Editar" on:click={() => editClient(client)}><Edit3 size={16} /></button>
                        {#if canManageAdvanced}<button type="button" class="danger-icon-button" title="Eliminar" on:click={() => deleteClient(client)}><Trash2 size={16} /></button>{/if}
                      </td>
                      <td><button type="button" class="soft-action" on:click={() => openCharge(client)}><CreditCard size={16} /> Cobrar</button></td>
                    </tr>
                  {/each}
                </tbody>
              </table>
              <div class="pagination"><button type="button" disabled={clientPage === 1} on:click={() => clientPage = Math.max(1, clientPage - 1)}>Anterior</button><span>Pagina {clientPage} de {totalClientPages}</span><button type="button" disabled={clientPage === totalClientPages} on:click={() => clientPage = Math.min(totalClientPages, clientPage + 1)}>Siguiente</button></div>
            {:else}<p>No hay clientes para esa busqueda.</p>{/if}
          </div>
        </section>
      {/if}

      {#if activeTab === "plans" && canManageAdvanced}
        <section class="tab-panel active modern-page">
          <div class="section-title">
            <h2>Planes</h2>
            <button type="button" class="primary-action" on:click={openCreatePlan}><UserPlus size={18} strokeWidth={2.4} /> Agregar plan</button>
          </div>
          <div class="plans-grid plans-grid-balanced">
            {#each loadedPlans as plan}
              <article class="plan-card modern-plan-card">
                <div class="modern-plan-head">
                  <span class="modern-plan-icon"><svelte:component this={planIcon(plan.name)} size={22} strokeWidth={2.4} /></span>
                  <div>
                    <strong>{plan.name}</strong>
                    <small>Precio vigente</small>
                  </div>
                </div>
                <p class="modern-plan-price">$ {formatMoney(plan.price)}</p>
                <div class="modern-plan-meta">
                  <span>Actualizado</span>
                  <strong>{formatDateTime(plan.updated_at)}</strong>
                </div>
                <div class="modern-plan-actions">
                  <button type="button" class="icon-button" aria-label="Editar plan" title="Editar plan" on:click={() => openEditPlan(plan)}><Edit3 size={18} strokeWidth={2.4} /></button>
                  <button type="button" class="icon-button danger" aria-label="Eliminar plan" title="Eliminar plan" on:click={() => openDeletePlan(plan)}><Trash2 size={18} strokeWidth={2.4} /></button>
                </div>
              </article>
            {/each}
          </div>
        </section>
      {/if}

      {#if activeTab === "expiring"}
        <section class="tab-panel active modern-page">
          <div class="section-title"><h2>Vencimientos</h2></div>
          <div class="search-bar"><input bind:value={expiringSearch} on:input={() => expiringPage = 1} type="search" placeholder="Buscar por cliente, DNI, plan o estado" /></div>
          <PaymentsTable clients={pagedExpiring} onCharge={openCharge} onGrace={openGrace} onDetail={(client) => showClientFile(client.dni)} />
          <div class="pagination"><button type="button" disabled={expiringPage === 1} on:click={() => expiringPage = Math.max(1, expiringPage - 1)}>Anterior</button><span>Pagina {expiringPage} de {totalExpiringPages}</span><button type="button" disabled={expiringPage === totalExpiringPages} on:click={() => expiringPage = Math.min(totalExpiringPages, expiringPage + 1)}>Siguiente</button></div>
          <article class="modern-panel access-in-expiring-panel">
            <div class="section-title"><div><h2>Accesos</h2><p>Ultimos controles de ingreso vinculados a vencimientos.</p></div></div>
            <form class="filter-bar" on:submit|preventDefault={loadEvents}>
              <label>Desde fecha<input bind:value={accessFilter.fromDate} type="date" /></label>
              <label>Hasta fecha<input bind:value={accessFilter.toDate} type="date" /></label>
              <button type="submit">Filtrar</button>
            </form>
            <div class="access-layout">
              <section>
                <div class="events">
                  {#each pagedEvents as event}
                    <article class="event {event.status}"><strong>{event.status === "granted" ? "Permitido" : "Denegado"}</strong><span>{event.first_name || ""} {event.last_name || ""} DNI {event.dni}</span><small>{event.message} - {formatDateTime(event.created_at)}</small></article>
                  {:else}<p>Todavia no hay ingresos registrados para ese filtro.</p>{/each}
                </div>
                <div class="pagination"><button type="button" disabled={eventsPage === 1} on:click={() => eventsPage = Math.max(1, eventsPage - 1)}>Anterior</button><span>Pagina {eventsPage} de {totalEventPages}</span><button type="button" disabled={eventsPage === totalEventPages} on:click={() => eventsPage = Math.min(totalEventPages, eventsPage + 1)}>Siguiente</button></div>
              </section>
              <DashboardChart title="Permitidos vs Denegados" subtitle="Resultado de controles de acceso" type="donut" series={accessStatusSeries} labels={accessStatusLabels} />
            </div>
          </article>
        </section>
      {/if}

      {#if activeTab === "alerts"}
        <section class="tab-panel active modern-page">
          <div class="section-title"><div><h2>Alertas</h2><p>Recordatorios para enviar por WhatsApp.</p></div></div>
          <div class="events">
            {#each pagedAlerts as alert}
              <article class="event denied"><strong>{alert.title || `${alert.client.first_name} ${alert.client.last_name}`}</strong><span>{alert.message}</span><div class="inline-actions"><a class="button-link whatsapp-action-link" href={alert.whatsappUrl} target="_blank" rel="noreferrer" aria-label="Enviar WhatsApp" title="Enviar WhatsApp"><img src="/assets/whatsapp-logo.svg" alt="" /><span>WhatsApp</span></a></div></article>
            {:else}<p>No hay alertas pendientes dentro de los proximos 7 dias.</p>{/each}
          </div>
          <div class="pagination"><button type="button" disabled={alertPage === 1} on:click={() => alertPage = Math.max(1, alertPage - 1)}>Anterior</button><span>Pagina {alertPage} de {totalAlertPages}</span><button type="button" disabled={alertPage === totalAlertPages} on:click={() => alertPage = Math.min(totalAlertPages, alertPage + 1)}>Siguiente</button></div>
        </section>
      {/if}

      {#if activeTab === "box"}
        <section class="tab-panel active modern-page">
          <div class="section-title"><div><h2>Caja</h2><p>Apertura, ajustes, egresos y movimientos diarios.</p></div></div>
          {#if canManageAdvanced}
            <article class="modern-panel backup-panel">
              <div>
                <span class="backup-icon"><ShieldCheck size={22} strokeWidth={2.3} /></span>
                <div>
                  <h3>Copias de seguridad</h3>
                  <p>Descarga un ZIP con el sistema y la base actual. Para restaurar, sube ese ZIP y reinicia el servidor.</p>
                </div>
              </div>
              <div class="backup-actions">
                <button type="button" class="secondary-action" on:click={downloadSystemBackup}><DatabaseBackup size={18} strokeWidth={2.4} /> Descargar backup</button>
                <button type="button" class="danger-soft-action" on:click={openRestorePicker}><Upload size={18} strokeWidth={2.4} /> Restaurar backup</button>
                <input bind:this={restoreInput} class="hidden-file-input" type="file" accept=".zip,application/zip" on:change={restoreSystemBackup} />
              </div>
            </article>
          {/if}
          <section class="stat-grid cash-status-grid">
            <article class="stat-card cash-status-card">
              <div class="stat-card-header">
                <span class="stat-icon"><CreditCard size={21} strokeWidth={2.2} /></span>
                <span class="stat-title">{cashStatus?.session?.name || "Caja Principal"}</span>
              </div>
              <strong class:negative={Number(cashStatus?.balance || 0) < 0} class="cash-balance">$ {formatMoney(cashStatus?.balance || 0)}</strong>
              <small>
                {#if cashStatus?.open}
                  Apertura: {formatDateTime(cashStatus?.session?.opened_at)} | Inicial: $ {formatMoney(cashStatus?.session?.opening_amount)}
                {:else}
                  Sin caja abierta. Ultima caja {cashStatus?.session?.status === "closed" ? "cerrada" : "sin iniciar"}.
                {/if}
              </small>
              <span class:open={cashStatus?.open} class="cash-state-pill">{cashStatus?.open ? "ABIERTA" : "CERRADA"}</span>
            </article>
          </section>

          {#if !cashStatus?.open}
            <form class="cash-form-card" on:submit|preventDefault={openCashBox}>
              <h3>Apertura de caja</h3>
              <div class="cash-form-grid">
                <label>Nombre<input bind:value={cashOpeningForm.name} /></label>
                <label>Monto inicial<input bind:value={cashOpeningForm.opening_amount} type="number" min="0" step="0.01" required /></label>
                <label>Nota<input bind:value={cashOpeningForm.notes} placeholder="Opcional" /></label>
              </div>
              <button type="submit">Abrir caja</button>
            </form>
          {:else}
            <div class="cash-actions-grid">
              <form class="cash-form-card" on:submit|preventDefault={submitCashMovement}>
                <h3>Registrar movimiento</h3>
                <div class="cash-form-grid">
                  <label>Tipo<select bind:value={cashMovementForm.type}><option>Egreso</option><option>Ajuste</option><option>Ingreso</option></select></label>
                  <label>Concepto<input bind:value={cashMovementForm.concept} required placeholder="Ej: Limpieza, retiro, diferencia" /></label>
                  <label>Metodo<select bind:value={cashMovementForm.method}><option>Efectivo</option><option>Transferencia</option><option>Mercado Pago</option></select></label>
                  <label>Monto<input bind:value={cashMovementForm.amount} type="number" step="0.01" required /></label>
                  <label class="cash-notes">Nota<input bind:value={cashMovementForm.notes} placeholder="Opcional" /></label>
                </div>
                <button type="submit">Guardar movimiento</button>
              </form>

              <form class="cash-form-card close-cash-card" on:submit|preventDefault={closeCashBox}>
                <h3>Cierre de caja</h3>
                <label>Monto contado<input bind:value={cashCloseForm.closing_amount} type="number" min="0" step="0.01" required /></label>
                <label>Nota<input bind:value={cashCloseForm.notes} placeholder="Opcional" /></label>
                <button type="submit">Cerrar caja</button>
              </form>
            </div>
          {/if}

          <article class="modern-panel cash-movements-panel">
            <div class="section-title">
              <div><h2>Registro de pagos</h2><p>Movimientos de caja filtrados por fecha.</p></div>
              <form class="date-filter" on:submit|preventDefault={applyCashMovementFilter}>
                <label>Desde<input bind:value={cashMovementFilter.from} type="date" /></label>
                <label>Hasta<input bind:value={cashMovementFilter.to} type="date" /></label>
                <button type="submit">Filtrar</button>
              </form>
            </div>
          <div class="modern-table-wrap cash-movements-table">
            {#if pagedCash.length}
              <table class="modern-table">
                <thead><tr><th>Fecha</th><th>Hora</th><th>Concepto</th><th>Tipo</th><th>Metodo de pago</th><th>Monto</th></tr></thead>
                <tbody>
                  {#each pagedCash as item}
                    <tr>
                      <td>{formatDateTime(item.created_at).split(",")[0]}</td>
                      <td>{formatDateTime(item.created_at).split(",")[1]?.trim() || ""}</td>
                      <td><strong>{item.concept}</strong>{#if item.notes}<br><span>{item.notes}</span>{/if}</td>
                      <td><StatusBadge status={item.type} tone={item.type === "Egreso" ? "danger" : item.type === "Ajuste" ? "warning" : "success"} /></td>
                      <td>{item.method}</td>
                      <td>$ {formatMoney(item.amount)}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
              <div class="pagination"><button type="button" disabled={cashPage === 1} on:click={() => cashPage = Math.max(1, cashPage - 1)}>Anterior</button><span>Pagina {cashPage} de {totalCashPages}</span><button type="button" disabled={cashPage === totalCashPages} on:click={() => cashPage = Math.min(totalCashPages, cashPage + 1)}>Siguiente</button></div>
            {:else}<p>No hay movimientos de caja todavia.</p>{/if}
          </div>
          </article>
          <article class="modern-panel cash-history-panel">
            <div class="section-title">
              <div><h2>Historial de cajas</h2><p>Aperturas y cierres con balance esperado, contado y diferencia.</p></div>
              <form class="date-filter">
                <label>Desde<input bind:value={cashHistoryFilter.from} on:input={() => cashHistoryPage = 1} type="date" /></label>
                <label>Hasta<input bind:value={cashHistoryFilter.to} on:input={() => cashHistoryPage = 1} type="date" /></label>
              </form>
            </div>
            <div class="modern-table-wrap">
              {#if filteredCashSessions.length}
                <table class="modern-table cash-history-table">
                  <thead><tr><th>Caja</th><th>Apertura</th><th>Cierre</th><th>Inicial</th><th>Ingresos</th><th>Egresos</th><th>Esperado</th><th>Contado</th><th>Diferencia</th><th>Estado</th><th>Notas</th></tr></thead>
                  <tbody>
                    {#each pagedCashSessions as session}
                      <tr>
                        <td><strong>{session.name}</strong><br><span>#{session.id} | {session.movements_count} mov.</span></td>
                        <td>{formatDateTime(session.opened_at)}</td>
                        <td>{session.closed_at ? formatDateTime(session.closed_at) : "-"}</td>
                        <td>$ {formatMoney(session.opening_amount)}</td>
                        <td>$ {formatMoney(session.income_total)}</td>
                        <td>$ {formatMoney(session.expense_total)}</td>
                        <td>$ {formatMoney(session.expected_amount)}</td>
                        <td>{session.closing_amount == null ? "-" : `$ ${formatMoney(session.closing_amount)}`}</td>
                        <td>{session.difference == null ? "-" : `$ ${formatMoney(session.difference)}`}</td>
                        <td><StatusBadge status={session.status === "open" ? "ABIERTA" : "CERRADA"} tone={session.status === "open" ? "success" : "neutral"} /></td>
                        <td>{session.notes || "-"}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
                <div class="pagination"><button type="button" disabled={cashHistoryPage === 1} on:click={() => cashHistoryPage = Math.max(1, cashHistoryPage - 1)}>Anterior</button><span>Pagina {cashHistoryPage} de {totalCashHistoryPages}</span><button type="button" disabled={cashHistoryPage === totalCashHistoryPages} on:click={() => cashHistoryPage = Math.min(totalCashHistoryPages, cashHistoryPage + 1)}>Siguiente</button></div>
              {:else}<p>No hay cajas para ese rango de fechas.</p>{/if}
            </div>
          </article>
        </section>
      {/if}

      {#if activeTab === "cash" && canManageAdvanced}
        <section class="tab-panel active modern-page">
          <div class="section-title"><h2>Finanzas</h2></div>
          <div class="stat-grid compact-stats">
            <article class="stat-card success finance-method-card">
              <div class="stat-card-header">
                <span class="stat-icon"><BadgeDollarSign size={21} strokeWidth={2.2} /></span>
                <span class="stat-title">Ingresos totales de {financeMonthLabel}</span>
              </div>
              <strong>$ {formatMoney(loadedReports?.totals?.income)}</strong>
              <small>Ingresos mensuales del periodo</small>
              <div class="method-breakdown" aria-label="Ingresos por metodo de pago">
                <span><b>Efectivo</b><em>$ {formatMoney(methodIncome("Efectivo"))}</em></span>
                <span><b>Transferencia</b><em>$ {formatMoney(methodIncome("Transferencia"))}</em></span>
                <span><b>Mercado Pago</b><em>$ {formatMoney(methodIncome("Mercado Pago"))}</em></span>
              </div>
            </article>
            <StatCard title="Ingresos del dia" value={`$ ${formatMoney(todayIncome)}`} helper="Cobros registrados hoy" icon="clock" variant="warning" />
            <article class="stat-card neutral finance-plan-card">
              <div class="stat-card-header">
                <span class="stat-icon"><Tags size={21} strokeWidth={2.2} /></span>
                <span class="stat-title">Total de planes</span>
              </div>
              <strong>{totalPaidPlans}</strong>
              <small>Planes pagados en {financeMonthLabel}</small>
              <div class="plan-breakdown" aria-label="Planes pagados por metodo">
                {#each planPaymentRows as plan}
                  <span>
                    <b>{plan.label} · {plan.count}</b>
                    <em>$ {formatMoney(plan.total)}</em>
                    <small>
                      Ef. {plan.methods.Efectivo.count} / $ {formatMoney(plan.methods.Efectivo.total)}
                      | Transf. {plan.methods.Transferencia.count} / $ {formatMoney(plan.methods.Transferencia.total)}
                      | MP {plan.methods["Mercado Pago"].count} / $ {formatMoney(plan.methods["Mercado Pago"].total)}
                    </small>
                  </span>
                {:else}
                  <span><b>Sin pagos</b><em>$ 0</em><small>No hay planes pagados en el periodo.</small></span>
                {/each}
              </div>
            </article>
          </div>
          <article class="modern-panel cash-movements-panel">
            <div class="section-title">
              <div><h2>Registro de pagos</h2><p>Movimientos registrados y filtrados por fecha.</p></div>
              <form class="date-filter" on:submit|preventDefault={applyCashMovementFilter}>
                <label>Desde<input bind:value={cashMovementFilter.from} type="date" /></label>
                <label>Hasta<input bind:value={cashMovementFilter.to} type="date" /></label>
                <button type="submit">Filtrar</button>
              </form>
            </div>
            <div class="embedded-search"><input bind:value={cashSearch} on:input={() => cashPage = 1} type="search" placeholder="Buscar pago, concepto, metodo o monto" /></div>
            <div class="modern-table-wrap cash-movements-table">
              {#if pagedCash.length}
                <table class="modern-table">
                  <thead><tr><th>Fecha</th><th>Hora</th><th>Concepto</th><th>Tipo</th><th>Metodo de pago</th><th>Monto</th></tr></thead>
                  <tbody>
                    {#each pagedCash as item}
                      <tr>
                        <td>{formatDateTime(item.created_at).split(",")[0]}</td>
                        <td>{formatDateTime(item.created_at).split(",")[1]?.trim() || ""}</td>
                        <td><strong>{item.concept}</strong>{#if item.notes}<br><span>{item.notes}</span>{/if}</td>
                        <td><StatusBadge status={item.type} tone={item.type === "Egreso" ? "danger" : item.type === "Ajuste" ? "warning" : "success"} /></td>
                        <td>{item.method}</td>
                        <td>$ {formatMoney(item.amount)}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
                <div class="pagination"><button type="button" disabled={cashPage === 1} on:click={() => cashPage = Math.max(1, cashPage - 1)}>Anterior</button><span>Pagina {cashPage} de {totalCashPages}</span><button type="button" disabled={cashPage === totalCashPages} on:click={() => cashPage = Math.min(totalCashPages, cashPage + 1)}>Siguiente</button></div>
              {:else}<p>No hay movimientos para ese rango de fechas.</p>{/if}
            </div>
          </article>
          <div class="finance-charts finance-daily-method-chart">
            <div class="wide-chart"><DashboardChart title="Recaudacion diaria por metodo" subtitle={`Todos los dias de ${financeMonthLabel}`} type="bar" series={dailyMethodSeries} categories={dailyMethodCategories} height={360} colors={["#15803d", "#9d1d18", "#111827"]} /></div>
          </div>
        </section>
      {/if}

      {#if activeTab === "backup" && canManageAdvanced}
        <section class="tab-panel active modern-page">
          <div class="section-title"><div><h2>BackUp</h2><p>Copias de seguridad y restauracion del sistema.</p></div></div>
          <article class="modern-panel backup-panel">
            <div>
              <span class="backup-icon"><ShieldCheck size={22} strokeWidth={2.3} /></span>
              <div>
                <h3>Copias de seguridad</h3>
                <p>Descarga un ZIP con el sistema y la base actual. Para restaurar, sube ese ZIP y reinicia el servidor.</p>
              </div>
            </div>
            <div class="backup-actions">
              <button type="button" class="secondary-action" on:click={downloadSystemBackup}><DatabaseBackup size={18} strokeWidth={2.4} /> Descargar backup</button>
              <button type="button" class="danger-soft-action" on:click={openRestorePicker}><Upload size={18} strokeWidth={2.4} /> Restaurar backup</button>
              <input bind:this={restoreInput} class="hidden-file-input" type="file" accept=".zip,application/zip" on:change={restoreSystemBackup} />
            </div>
          </article>
        </section>
      {/if}

      {#if activeTab === "staff" && canManageAdvanced}
        <section class="tab-panel active modern-page">
          <div class="section-title"><h2>Usuarios</h2></div>
          <div class="modern-table-wrap">
            {#if pagedStaff.length}<table class="modern-table"><thead><tr><th>Nombre</th><th>Rol</th><th>Permisos</th><th>Activo</th></tr></thead><tbody>{#each pagedStaff as item}<tr><td>{item.name}</td><td>{item.role}</td><td>{item.permissions}</td><td>{item.active}</td></tr>{/each}</tbody></table><div class="pagination"><button type="button" disabled={staffPage === 1} on:click={() => staffPage = Math.max(1, staffPage - 1)}>Anterior</button><span>Pagina {staffPage} de {totalStaffPages}</span><button type="button" disabled={staffPage === totalStaffPages} on:click={() => staffPage = Math.min(totalStaffPages, staffPage + 1)}>Siguiente</button></div>{:else}<p>No hay datos cargados.</p>{/if}
          </div>
        </section>
      {/if}
    </section>
  </main>
{/if}

<dialog bind:this={adminDialog} class="admin-dialog">
  <div class="admin-dialog-content"><h2>{adminDialogData.title}</h2><p>{adminDialogData.message}</p><button type="button" on:click={() => adminDialog.close()}>Aceptar</button></div>
</dialog>

<dialog bind:this={clientDeleteDialog} class="admin-dialog">
  <form class="admin-dialog-content" on:submit|preventDefault={confirmDeleteClient}>
    <h2>Eliminar cliente</h2>
    <p>Vas a eliminar a {clientDeleteCandidate ? `${clientDeleteCandidate.first_name} ${clientDeleteCandidate.last_name}` : "este cliente"}. Esta accion no se puede deshacer.</p>
    <div class="dialog-actions"><button type="button" on:click={() => clientDeleteDialog.close()}>Cancelar</button><button type="submit">Eliminar</button></div>
  </form>
</dialog>

<dialog bind:this={clientFileDialog} class="client-file-dialog">
  <div class="client-file-content">
    <button class="dialog-close" type="button" aria-label="Cerrar" on:click={() => clientFileDialog.close()}>x</button>
    {#if clientFile}
      <header class="client-file-header">
        <div>
          <span class="admin-kicker">Ficha digital</span>
          <h2>{clientFile.client.first_name} {clientFile.client.last_name}</h2>
          <p>DNI {clientFile.client.dni} · {clientFile.client.active ? "Cliente activo" : "Cliente inactivo"}</p>
        </div>
        <StatusBadge status={membershipStatus(clientFile.client.membership_paid_until)} tone={daysUntil(clientFile.client.membership_paid_until) < 0 ? "danger" : daysUntil(clientFile.client.membership_paid_until) <= 7 ? "warning" : "success"} />
      </header>
      <div class="client-file-grid">
        <article><span class="client-file-icon"><Tags size={19} /></span><div><strong>Plan</strong><span>{clientFile.client.plan_name || "MENSUAL"}</span></div></article>
        <article><span class="client-file-icon"><CalendarClock size={19} /></span><div><strong>Cuota paga hasta</strong><span>{formatDate(clientFile.client.membership_paid_until)}</span></div></article>
        <article><span class="client-file-icon"><CreditCard size={19} /></span><div><strong>Pagos registrados</strong><span>{clientFile.payments.length} · $ {formatMoney(clientFile.summary.totalPayments)}</span></div></article>
        <article><span class="client-file-icon"><CalendarCheck size={19} /></span><div><strong>Asistencias</strong><span>{clientFile.summary.totalAccesses} ingresos</span></div></article>
        <article><span class="client-file-icon"><BellRing size={19} /></span><div><strong>Prorroga</strong><span>{clientFile.client.grace_until ? `${formatDate(clientFile.client.grace_until)}${clientFile.client.grace_note ? ` · ${clientFile.client.grace_note}` : ""}` : "Sin prorroga"}</span></div></article>
        <article><span class="client-file-icon"><FileText size={19} /></span><div><strong>Contacto</strong><span>{clientFile.client.phone || "-"} · {clientFile.client.email || "-"}</span></div></article>
      </div>
      <section class="client-file-section">
        <div class="section-title"><h3>Ultimas asistencias</h3></div>
        <div class="client-file-access-list">{#each clientFile.accesses as access}<article><StatusBadge status={accessStatusLabel(access.status)} tone={access.status === "granted" ? "success" : "danger"} /><div><strong>{formatDateTime(access.created_at)}</strong><span>{access.message}</span></div></article>{:else}<p>Sin asistencias registradas.</p>{/each}</div>
      </section>
    {/if}
  </div>
</dialog>

<dialog bind:this={planDialog} class="admin-dialog">
  <form class="admin-dialog-content" on:submit|preventDefault={submitPlan}>
    <h2>{planDialogMode === "create" ? "Agregar plan" : "Editar plan"}</h2>
    <label>Nombre del plan<input bind:value={planForm.name} placeholder="Ej: MUSCULACION" required /></label>
    <label>Precio $ ARS<input bind:value={planForm.price} type="number" min="0" step="0.01" required /></label>
    <div class="dialog-actions"><button type="button" on:click={() => planDialog.close()}>Cancelar</button><button type="submit">{planDialogMode === "create" ? "Agregar" : "Guardar"}</button></div>
  </form>
</dialog>

<dialog bind:this={planDeleteDialog} class="admin-dialog">
  <form class="admin-dialog-content" on:submit|preventDefault={confirmDeletePlan}>
    <h2>Eliminar plan</h2>
    <p>Vas a eliminar {planDeleteCandidate?.name || "este plan"}. Si hay clientes usando este plan, el sistema no lo va a permitir.</p>
    <div class="dialog-actions"><button type="button" on:click={() => planDeleteDialog.close()}>Cancelar</button><button type="submit">Eliminar</button></div>
  </form>
</dialog>

<dialog bind:this={chargeDialog} class="admin-dialog">
  <form class="admin-dialog-content" on:submit|preventDefault={submitCharge}>
    <h2>Cobrar</h2>
    <p>{chargeClient ? `${chargeClient.first_name} ${chargeClient.last_name} - ${chargeClient.plan_name || "MENSUAL"}` : ""}</p>
    <label>Concepto<select bind:value={chargeForm.charge_type}><option value="current">Cobrar Plan actual</option><option value="change">Cambiar de plan</option><option value="DIARIO">Dia</option><option value="SEMANAL">Semana</option></select></label>
    {#if chargeForm.charge_type === "change"}<label>Nuevo plan<select bind:value={chargeForm.plan_name}>{#each loadedPlans as plan}<option value={plan.name}>{plan.name}</option>{/each}</select></label>{/if}
    <label>Metodo<select bind:value={chargeForm.method}><option>Efectivo</option><option>Transferencia</option><option>Mercado Pago</option></select></label>
    <label>Monto $ ARS<input bind:value={chargeForm.amount} type="number" min="0" step="0.01" required /></label>
    <div class="dialog-actions"><button type="button" on:click={() => chargeDialog.close()}>Cancelar</button><button type="submit">Confirmar cobro</button></div>
  </form>
</dialog>

<dialog bind:this={graceDialog} class="admin-dialog">
  <form class="admin-dialog-content" on:submit|preventDefault={submitGrace}>
    <h2>Dar prorroga</h2>
    <p>{graceClient ? `${graceClient.first_name} ${graceClient.last_name} - cuota vencida ${formatDate(graceClient.membership_paid_until)}` : ""}</p>
    <label>Fecha limite<input bind:value={graceForm.grace_until} type="date" required /></label>
    <label>Nota<input bind:value={graceForm.grace_note} placeholder="Ej: cobra el 10" /></label>
    <div class="dialog-actions"><button type="button" on:click={() => graceDialog.close()}>Cancelar</button><button type="submit">Guardar prorroga</button></div>
  </form>
</dialog>
