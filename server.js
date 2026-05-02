const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DB_PATH = path.join(ROOT, "gym_access.db");
const BACKUP_DIR = path.join(ROOT, "backups");
const RESTORE_PENDING_PATH = path.join(ROOT, "gym_access_restore_pending.db");
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const COOKIE_SECURE = process.env.COOKIE_SECURE === "true" || IS_PRODUCTION;
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const RECEPTION_USER = process.env.RECEPTION_USER || "recepcion";
const RECEPTION_PASSWORD = process.env.RECEPTION_PASSWORD || "recepcion123";
const ADMIN_ACCOUNTS = new Map([
  [ADMIN_USER, { user: ADMIN_USER, password: ADMIN_PASSWORD, role: "admin", permissions: "total" }],
  [RECEPTION_USER, { user: RECEPTION_USER, password: RECEPTION_PASSWORD, role: "reception", permissions: "clientes,accesos,caja" }]
]);
const sessions = new Map();
const PLAN_NAMES = ["PERSONALIZADO", "MENSUAL", "SEMANAL", "DIARIO"];

applyPendingRestore();

const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    dni TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT,
    photo TEXT,
    weight_kg REAL,
    height_cm REAL,
    birth_date TEXT,
    plan_name TEXT DEFAULT 'MENSUAL',
    membership_paid_until TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS access_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    dni TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'web',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    method TEXT NOT NULL DEFAULT 'Efectivo',
    concept TEXT NOT NULL DEFAULT 'Cuota',
    paid_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    notes TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS cash_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    concept TEXT NOT NULL,
    amount REAL NOT NULL,
    method TEXT NOT NULL DEFAULT 'Efectivo',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS cash_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT 'Caja Principal',
    opening_amount REAL NOT NULL DEFAULT 0,
    opened_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    closed_at TEXT,
    closing_amount REAL,
    status TEXT NOT NULL DEFAULT 'open',
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    billing_mode TEXT NOT NULL,
    weekly_limit INTEGER,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    permissions TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS plans (
    name TEXT PRIMARY KEY,
    price REAL NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
`);

ensureColumn("clients", "plan_name", "TEXT DEFAULT 'MENSUAL'");
ensureColumn("clients", "grace_until", "TEXT");
ensureColumn("clients", "grace_note", "TEXT");

const statements = {
  listClients: db.prepare(`
    SELECT id, first_name, last_name, dni, phone, email, address, photo,
           weight_kg, height_cm, birth_date, plan_name, membership_paid_until, grace_until, grace_note, active,
           (SELECT paid_at FROM payments WHERE payments.client_id = clients.id ORDER BY paid_at DESC LIMIT 1) AS last_payment,
           (SELECT amount FROM payments WHERE payments.client_id = clients.id ORDER BY paid_at DESC LIMIT 1) AS last_amount
    FROM clients
    ORDER BY last_name COLLATE NOCASE, first_name COLLATE NOCASE
  `),
  getClientByDni: db.prepare(`
    SELECT id, first_name, last_name, dni, phone, email, address, photo,
           weight_kg, height_cm, birth_date, plan_name, membership_paid_until, grace_until, grace_note, active
    FROM clients
    WHERE dni = ?
  `),
  getClientById: db.prepare(`
    SELECT id, first_name, last_name, dni, phone, email, address, photo,
           weight_kg, height_cm, birth_date, plan_name, membership_paid_until, grace_until, grace_note, active
    FROM clients
    WHERE id = ?
  `),
  insertClient: db.prepare(`
    INSERT INTO clients (
      first_name, last_name, dni, phone, email, address, photo,
      weight_kg, height_cm, birth_date, plan_name, membership_paid_until, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  updateClient: db.prepare(`
    UPDATE clients
    SET first_name = ?, last_name = ?, phone = ?, email = ?, address = ?,
        photo = ?, weight_kg = ?, height_cm = ?, birth_date = ?,
        plan_name = ?, membership_paid_until = ?, active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE dni = ?
  `),
  clearClientAccessRefs: db.prepare("UPDATE access_events SET client_id = NULL WHERE client_id = ?"),
  clearClientPaymentRefs: db.prepare("DELETE FROM payments WHERE client_id = ?"),
  deleteClient: db.prepare("DELETE FROM clients WHERE dni = ?"),
  insertEvent: db.prepare(`
    INSERT INTO access_events (client_id, dni, status, message, source, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))
  `),
  recentEvents: db.prepare(`
    SELECT e.id, e.dni, e.status, e.message, e.source, e.created_at,
           c.first_name, c.last_name
    FROM access_events e
    LEFT JOIN clients c ON c.id = e.client_id
    WHERE (? IS NULL OR datetime(e.created_at) >= datetime(?))
      AND (? IS NULL OR datetime(e.created_at) <= datetime(?))
    ORDER BY e.id DESC
    LIMIT 200
  `),
  accessByDay: db.prepare(`
    SELECT date(created_at) AS day, COUNT(*) AS total
    FROM access_events
    WHERE created_at >= datetime('now', '-13 days')
    GROUP BY date(created_at)
    ORDER BY day
  `),
  accessByStatus: db.prepare(`
    SELECT status, COUNT(*) AS total
    FROM access_events
    GROUP BY status
  `),
  topClients: db.prepare(`
    SELECT c.first_name, c.last_name, c.dni, COUNT(*) AS total
    FROM access_events e
    INNER JOIN clients c ON c.id = e.client_id
    WHERE e.status = 'granted'
    GROUP BY c.id
    ORDER BY total DESC, c.last_name COLLATE NOCASE
    LIMIT 5
  `),
  clientPayments: db.prepare(`
    SELECT id, amount, method, concept, paid_at, notes
    FROM payments
    WHERE client_id = ?
    ORDER BY paid_at DESC
  `),
  listPaymentsDetailed: db.prepare(`
    SELECT p.id, p.amount, p.method, p.concept, p.paid_at, p.notes,
           c.first_name, c.last_name, c.dni, COALESCE(c.plan_name, 'Sin plan') AS plan_name
    FROM payments p
    LEFT JOIN clients c ON c.id = p.client_id
    WHERE (? IS NULL OR date(p.paid_at) >= date(?))
      AND (? IS NULL OR date(p.paid_at) <= date(?))
    ORDER BY p.id DESC
  `),
  paymentsByPlan: db.prepare(`
    SELECT COALESCE(c.plan_name, 'Sin plan') AS label, SUM(p.amount) AS total
    FROM payments p
    LEFT JOIN clients c ON c.id = p.client_id
    WHERE (? IS NULL OR date(p.paid_at) >= date(?))
      AND (? IS NULL OR date(p.paid_at) <= date(?))
    GROUP BY COALESCE(c.plan_name, 'Sin plan')
    ORDER BY total DESC
  `),
  clientAccesses: db.prepare(`
    SELECT id, status, message, source, created_at
    FROM access_events
    WHERE client_id = ?
    ORDER BY id DESC
    LIMIT 50
  `),
  listCash: db.prepare(`
    SELECT id, type, concept, amount, method, created_at, notes
    FROM cash_movements
    WHERE (? IS NULL OR date(created_at) >= date(?))
      AND (? IS NULL OR date(created_at) <= date(?))
    ORDER BY id DESC
  `),
  insertCash: db.prepare(`
    INSERT INTO cash_movements (type, concept, amount, method, notes, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))
  `),
  activeCashSession: db.prepare("SELECT id, name, opening_amount, opened_at, closed_at, closing_amount, status, notes FROM cash_sessions WHERE status = 'open' ORDER BY id DESC LIMIT 1"),
  lastCashSession: db.prepare("SELECT id, name, opening_amount, opened_at, closed_at, closing_amount, status, notes FROM cash_sessions ORDER BY id DESC LIMIT 1"),
  listCashSessions: db.prepare("SELECT id, name, opening_amount, opened_at, closed_at, closing_amount, status, notes FROM cash_sessions ORDER BY id DESC"),
  openCashSession: db.prepare("INSERT INTO cash_sessions (name, opening_amount, notes, opened_at, status) VALUES (?, ?, ?, datetime('now', 'localtime'), 'open')"),
  closeCashSession: db.prepare("UPDATE cash_sessions SET status = 'closed', closed_at = datetime('now', 'localtime'), closing_amount = ?, notes = COALESCE(?, notes) WHERE id = ?"),
  cashMovementTotalsSince: db.prepare(`
    SELECT
      SUM(CASE WHEN type IN ('Ingreso', 'Apertura') THEN amount WHEN type IN ('Egreso') THEN -amount WHEN type = 'Ajuste' THEN amount ELSE amount END) AS balance
    FROM cash_movements
    WHERE datetime(created_at) >= datetime(?)
  `),
  listActivities: db.prepare(`
    SELECT id, name, billing_mode, weekly_limit, active
    FROM activities
    ORDER BY name COLLATE NOCASE
  `),
  listStaff: db.prepare(`
    SELECT id, name, role, permissions, active
    FROM staff
    ORDER BY name COLLATE NOCASE
  `),
  listPlans: db.prepare("SELECT name, price, updated_at FROM plans ORDER BY CASE name WHEN 'PERSONALIZADO' THEN 1 WHEN 'MENSUAL' THEN 2 WHEN 'SEMANAL' THEN 3 WHEN 'DIARIO' THEN 4 ELSE 5 END"),
  upsertPlan: db.prepare("INSERT INTO plans (name, price, updated_at) VALUES (?, ?, datetime('now', 'localtime')) ON CONFLICT(name) DO UPDATE SET price = excluded.price, updated_at = excluded.updated_at"),
  getPlanByName: db.prepare("SELECT name, price FROM plans WHERE name = ?"),
  deletePlan: db.prepare("DELETE FROM plans WHERE name = ?"),
  countClientsByPlan: db.prepare("SELECT COUNT(*) AS total FROM clients WHERE plan_name = ?"),
  renameClientPlan: db.prepare("UPDATE clients SET plan_name = ?, updated_at = CURRENT_TIMESTAMP WHERE plan_name = ?"),
  updateClientPlan: db.prepare("UPDATE clients SET plan_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"),
  updateClientMembership: db.prepare("UPDATE clients SET membership_paid_until = ?, grace_until = NULL, grace_note = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?"),
  updateClientPlanAndMembership: db.prepare("UPDATE clients SET plan_name = ?, membership_paid_until = ?, grace_until = NULL, grace_note = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?"),
  updateClientGrace: db.prepare("UPDATE clients SET grace_until = ?, grace_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"),
  insertPayment: db.prepare(`
    INSERT INTO payments (client_id, amount, method, concept, paid_at, notes)
    VALUES (?, ?, ?, ?, datetime('now', 'localtime'), ?)
  `)
};

seedDemoClientIfEmpty();
seedOperationalDataIfEmpty();
seedPlansIfEmpty();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xls": "application/vnd.ms-excel",
  ".zip": "application/zip",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

const server = http.createServer(async (req, res) => {
  try {
    applySecurityHeaders(res);
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "POST" && url.pathname === "/api/admin/login") {
      const body = await readJson(req);
      const account = ADMIN_ACCOUNTS.get(String(body.user || ""));
      if (!account || body.password !== account.password) {
        return sendJson(res, 401, { ok: false, message: "Usuario o clave incorrectos." });
      }

      const token = cryptoToken();
      sessions.set(token, { user: account.user, role: account.role, permissions: account.permissions, createdAt: Date.now() });
      res.setHeader("Set-Cookie", cookieHeader("gym_admin", token, 28800));
      return sendJson(res, 200, { ok: true, user: publicSession(sessions.get(token)) });
    }

    if (req.method === "POST" && url.pathname === "/api/admin/logout") {
      const token = getCookie(req, "gym_admin");
      if (token) sessions.delete(token);
      res.setHeader("Set-Cookie", cookieHeader("gym_admin", "", 0));
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "GET" && url.pathname === "/api/admin/me") {
      const session = getSession(req);
      return sendJson(res, 200, { ok: Boolean(session), user: session ? publicSession(session) : null });
    }

    const adminApi = url.pathname.startsWith("/api/") &&
      !["/api/access/validate", "/api/admin/login", "/api/admin/logout", "/api/admin/me"].includes(url.pathname);
    if (adminApi && !isAdmin(req)) {
      return sendJson(res, 401, { ok: false, message: "Debe iniciar sesion." });
    }

    if (adminApi && isReception(req) && isAdvancedRoute(req.method, url.pathname)) {
      return sendJson(res, 403, { ok: false, message: "No tiene permisos para esta accion." });
    }

    if (req.method === "GET" && url.pathname === "/api/clients") {
      return sendJson(res, 200, statements.listClients.all());
    }

    if (req.method === "GET" && url.pathname === "/api/clients/export") {
      if (!isSystemAdmin(req)) return sendJson(res, 403, { ok: false, message: "Solo administrador puede exportar clientes." });
      return sendDownload(res, buildClientsExcel(), `clientes-hercules-${timestampForFile()}.xls`, "application/vnd.ms-excel; charset=utf-8");
    }

    if (req.method === "GET" && url.pathname === "/api/system/backup") {
      if (!isSystemAdmin(req)) return sendJson(res, 403, { ok: false, message: "Solo administrador puede generar backups." });
      return sendDownload(res, buildSystemBackup(), `hercules-backup-${timestampForFile()}.zip`, "application/zip");
    }

    if (req.method === "POST" && url.pathname === "/api/system/restore") {
      if (!isSystemAdmin(req)) return sendJson(res, 403, { ok: false, message: "Solo administrador puede restaurar backups." });
      const backup = await readBinary(req, 80 * 1024 * 1024);
      const restoredDb = extractZipFile(backup, "gym_access.db");
      if (!restoredDb) throw badRequest("El backup no contiene gym_access.db.");
      if (!isLikelySqlite(restoredDb)) throw badRequest("La base incluida no parece SQLite valida.");
      fs.writeFileSync(RESTORE_PENDING_PATH, restoredDb);
      return sendJson(res, 200, { ok: true, message: "Backup cargado. Reinicia el servidor para aplicar la restauracion de la base de datos." });
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/clients/")) {
      const dni = cleanDni(decodeURIComponent(url.pathname.split("/").pop()));
      const client = statements.getClientByDni.get(dni);
      if (!client) return sendJson(res, 404, { ok: false, message: "Cliente no encontrado." });
      return sendJson(res, 200, buildClientFile(client));
    }

    if (req.method === "POST" && url.pathname === "/api/clients") {
      const body = await readJson(req);
      const client = normalizeClient(body);
      const existing = statements.getClientByDni.get(client.dni);
      const allowUpdate = body.allow_update === true && cleanDni(body.original_dni) === client.dni;

      if (existing) {
        if (!allowUpdate) {
          return sendJson(res, 409, { ok: false, message: "Ya existe un cliente registrado con ese DNI." });
        }
        statements.updateClient.run(
          client.first_name,
          client.last_name,
          client.phone,
          client.email,
          client.address,
          client.photo,
          client.weight_kg,
          client.height_cm,
          client.birth_date,
          client.plan_name,
          client.membership_paid_until,
          client.active,
          client.dni
        );
      } else {
        statements.insertClient.run(
          client.first_name,
          client.last_name,
          client.dni,
          client.phone,
          client.email,
          client.address,
          client.photo,
          client.weight_kg,
          client.height_cm,
          client.birth_date,
          client.plan_name,
          client.membership_paid_until,
          client.active
        );
      }

      return sendJson(res, 200, {
        ok: true,
        message: existing ? "Cliente actualizado" : "Cliente creado",
        client: statements.getClientByDni.get(client.dni)
      });
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/api/clients/")) {
      const dni = cleanDni(decodeURIComponent(url.pathname.split("/").pop()));
      const client = statements.getClientByDni.get(dni);
      if (!client) return sendJson(res, 404, { ok: false, message: "Cliente no encontrado." });
      statements.clearClientAccessRefs.run(client.id);
      statements.clearClientPaymentRefs.run(client.id);
      statements.deleteClient.run(dni);
      return sendJson(res, 200, { ok: true, message: "Cliente eliminado." });
    }

    if (req.method === "POST" && url.pathname === "/api/access/validate") {
      const body = await readJson(req);
      const dni = cleanDni(body.dni);
      const source = String(body.source || "web").slice(0, 40);
      const result = validateAccess(dni, source);
      return sendJson(res, 200, result);
    }

    if (req.method === "GET" && url.pathname === "/api/plans") {
      return sendJson(res, 200, statements.listPlans.all());
    }

    if (req.method === "POST" && url.pathname === "/api/plans") {
      const body = await readJson(req);
      const name = requiredText(body.name, "plan").toUpperCase();
      const previousName = optionalText(body.previous_name)?.toUpperCase();
      statements.upsertPlan.run(name, optionalNumber(body.price));
      if (previousName && previousName !== name) {
        statements.renameClientPlan.run(name, previousName);
        statements.deletePlan.run(previousName);
      }
      return sendJson(res, 200, { ok: true, message: "Plan actualizado." });
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/api/plans/")) {
      const name = requiredText(decodeURIComponent(url.pathname.split("/")[3] || ""), "plan").toUpperCase();
      const plan = statements.getPlanByName.get(name);
      if (!plan) return sendJson(res, 404, { ok: false, message: "Plan no encontrado." });
      const usedByClients = statements.countClientsByPlan.get(name).total;
      if (usedByClients > 0) throw badRequest(`No se puede eliminar: ${usedByClients} cliente(s) usan este plan.`);
      statements.deletePlan.run(name);
      return sendJson(res, 200, { ok: true, message: "Plan eliminado." });
    }

    if (req.method === "POST" && url.pathname.startsWith("/api/clients/") && url.pathname.endsWith("/grace")) {
      const parts = url.pathname.split("/");
      const dni = cleanDni(decodeURIComponent(parts[3]));
      const client = statements.getClientByDni.get(dni);
      if (!client) return sendJson(res, 404, { ok: false, message: "Cliente no encontrado." });
      const body = await readJson(req);
      const graceUntil = optionalDate(body.grace_until);
      if (!graceUntil) throw badRequest("La fecha limite de prorroga es obligatoria.");
      if (parseDate(graceUntil) < startOfDay(new Date())) throw badRequest("La prorroga no puede tener fecha pasada.");
      const graceNote = optionalText(body.grace_note) || "Promesa de pago";
      statements.updateClientGrace.run(graceUntil, graceNote, client.id);
      return sendJson(res, 200, { ok: true, message: "Prorroga guardada.", grace_until: graceUntil });
    }

    if (req.method === "POST" && url.pathname.startsWith("/api/clients/") && url.pathname.endsWith("/charge")) {
      const parts = url.pathname.split("/");
      const dni = cleanDni(decodeURIComponent(parts[3]));
      const client = statements.getClientByDni.get(dni);
      if (!client) return sendJson(res, 404, { ok: false, message: "Cliente no encontrado." });
      const body = await readJson(req);
      const amount = optionalNumber(body.amount);
      const method = optionalText(body.method) || "Efectivo";
      const concept = optionalText(body.concept) || "Mensualidad";
      const newPlan = optionalText(body.plan_name);
      const fixedPaidUntil = optionalDate(body.membership_paid_until);
      let chargedPlan = client.plan_name || "MENSUAL";
      if (newPlan) {
        const normalizedPlan = newPlan.toUpperCase();
        if (!isValidPlan(normalizedPlan)) throw badRequest("Plan invalido.");
        chargedPlan = normalizedPlan;
      }
      const membershipPaidUntil = fixedPaidUntil || nextMembershipDate(client.membership_paid_until, chargedPlan, concept);
      if (newPlan) statements.updateClientPlanAndMembership.run(chargedPlan, membershipPaidUntil, client.id);
      else statements.updateClientMembership.run(membershipPaidUntil, client.id);
      statements.insertPayment.run(client.id, amount, method, concept, optionalText(body.notes));
      statements.insertCash.run("Ingreso", concept, amount, method, `Cobro a ${client.first_name} ${client.last_name}`);
      return sendJson(res, 200, { ok: true, message: "Cobro registrado.", membership_paid_until: membershipPaidUntil });
    }

    if (req.method === "GET" && url.pathname === "/api/access/events") {
      const from = buildDateTime(url.searchParams.get("fromDate"), url.searchParams.get("fromTime"), false);
      const to = buildDateTime(url.searchParams.get("toDate"), url.searchParams.get("toTime"), true);
      return sendJson(res, 200, statements.recentEvents.all(from, from, to, to));
    }

    if (req.method === "GET" && url.pathname === "/api/reports") {
      return sendJson(res, 200, buildReports(url.searchParams));
    }

    if (req.method === "GET" && url.pathname === "/api/alerts/expiring") {
      return sendJson(res, 200, buildExpiringAlerts());
    }

    if (req.method === "GET" && url.pathname === "/api/cash/status") {
      return sendJson(res, 200, buildCashStatus());
    }

    if (req.method === "GET" && url.pathname === "/api/cash/sessions") {
      return sendJson(res, 200, buildCashSessions());
    }

    if (req.method === "POST" && url.pathname === "/api/cash/open") {
      if (statements.activeCashSession.get()) throw badRequest("Ya hay una caja abierta.");
      const body = await readJson(req);
      const name = optionalText(body.name) || "Caja Principal";
      const openingAmount = optionalNumber(body.opening_amount);
      if (openingAmount === null) throw badRequest("El monto inicial es obligatorio.");
      const notes = optionalText(body.notes);
      statements.openCashSession.run(name, openingAmount, notes);
      statements.insertCash.run("Apertura", `Apertura de ${name}`, openingAmount, "Efectivo", notes);
      return sendJson(res, 200, { ok: true, message: "Caja abierta.", status: buildCashStatus() });
    }

    if (req.method === "POST" && url.pathname === "/api/cash/close") {
      const session = statements.activeCashSession.get();
      if (!session) throw badRequest("No hay una caja abierta.");
      const body = await readJson(req);
      const closingAmount = optionalNumber(body.closing_amount);
      if (closingAmount === null) throw badRequest("El monto de cierre es obligatorio.");
      statements.closeCashSession.run(closingAmount, optionalText(body.notes), session.id);
      return sendJson(res, 200, { ok: true, message: "Caja cerrada.", status: buildCashStatus() });
    }

    if (req.method === "GET" && url.pathname === "/api/cash") {
      return sendJson(res, 200, statements.listCash.all(url.searchParams.get("from"), url.searchParams.get("from"), url.searchParams.get("to"), url.searchParams.get("to")));
    }

    if (req.method === "GET" && url.pathname === "/api/payments") {
      return sendJson(res, 200, statements.listPaymentsDetailed.all(url.searchParams.get("from"), url.searchParams.get("from"), url.searchParams.get("to"), url.searchParams.get("to")));
    }

    if (req.method === "POST" && url.pathname === "/api/cash") {
      const body = await readJson(req);
      if (!statements.activeCashSession.get()) throw badRequest("Debe abrir la caja antes de registrar movimientos.");
      const type = requiredText(body.type, "tipo");
      if (!["Ingreso", "Egreso", "Ajuste"].includes(type)) throw badRequest("Tipo de movimiento invalido.");
      const amount = optionalNumber(body.amount);
      if (amount === null) throw badRequest("El monto es obligatorio.");
      statements.insertCash.run(type, requiredText(body.concept, "concepto"), amount, optionalText(body.method) || "Efectivo", optionalText(body.notes));
      return sendJson(res, 200, { ok: true, message: "Movimiento registrado." });
    }

    if (req.method === "GET" && url.pathname === "/api/activities") {
      return sendJson(res, 200, statements.listActivities.all());
    }

    if (req.method === "GET" && url.pathname === "/api/staff") {
      return sendJson(res, 200, statements.listStaff.all());
    }

    return serveStatic(url.pathname, res);
  } catch (error) {
    const status = error.statusCode || 500;
    sendJson(res, status, { ok: false, message: error.message || "Error interno" });
  }
});

server.listen(PORT, () => {
  console.log(`Sistema de acceso listo en http://localhost:${PORT}`);
  console.log(`Base de datos: ${DB_PATH}`);
});

function validateAccess(dni, source) {
  if (!dni) {
    return recordAccess(null, "", "denied", "Ingrese un DNI valido.", source);
  }

  const client = statements.getClientByDni.get(dni);
  if (!client) {
    return recordAccess(null, dni, "denied", "DNI no registrado.", source);
  }

  if (!client.active) {
    return recordAccess(client, dni, "denied", "Cliente inactivo. Consulte en recepcion.", source);
  }

  const today = startOfDay(new Date());
  const paidUntil = parseDate(client.membership_paid_until);
  const daysRemaining = Math.ceil((paidUntil - today) / 86400000);

  if (Number.isNaN(daysRemaining) || daysRemaining < 0) {
    const graceUntil = client.grace_until ? parseDate(client.grace_until) : null;
    const graceDaysRemaining = graceUntil ? Math.ceil((graceUntil - today) / 86400000) : null;
    if (graceUntil && graceDaysRemaining >= 0) {
      return recordAccess(
        client,
        dni,
        "granted",
        `Acceso con prorroga hasta el ${formatDisplayDate(client.grace_until)}.`,
        source,
        daysRemaining,
        graceDaysRemaining
      );
    }

    return recordAccess(
      client,
      dni,
      "denied",
      graceUntil
        ? "Prorroga vencida. Regularice la mensualidad en recepcion."
        : "Cuota vencida. Regularice la mensualidad en recepcion.",
      source,
      daysRemaining
    );
  }

  return recordAccess(
    client,
    dni,
    "granted",
    "Acceso correcto.",
    source,
    daysRemaining
  );
}

function recordAccess(client, dni, status, message, source, daysRemaining = null, graceDaysRemaining = null) {
  statements.insertEvent.run(client ? client.id : null, dni, status, message, source);
  return {
    ok: status === "granted",
    status,
    message,
    actuator: {
      command: status === "granted" ? "unlock" : "deny",
      // Este campo es el contrato pensado para un futuro molinete o relay.
      ttlMs: status === "granted" ? 3500 : 0
    },
    client: client
      ? {
          first_name: client.first_name,
          last_name: client.last_name,
          dni: client.dni,
          phone: client.phone,
          email: client.email,
          photo: client.photo,
          membership_paid_until: client.membership_paid_until,
          days_remaining: daysRemaining,
          grace_until: client.grace_until,
          grace_note: client.grace_note,
          grace_days_remaining: graceDaysRemaining
        }
      : null
  };
}

function buildReports(searchParams = new URLSearchParams()) {
  const clients = statements.listClients.all();
  const accessByStatus = statements.accessByStatus.all();
  const accessByDayRows = statements.accessByDay.all();
  const today = startOfDay(new Date());
  const dayMap = new Map(accessByDayRows.map((row) => [row.day, row.total]));
  const accessByDay = [];

  for (let index = 13; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    const day = date.toISOString().slice(0, 10);
    accessByDay.push({ day, total: dayMap.get(day) || 0 });
  }

  const membershipBuckets = [
    { label: "Vencidos", total: 0 },
    { label: "Vencen 7 dias", total: 0 },
    { label: "Vigentes", total: 0 },
    { label: "Inactivos", total: 0 }
  ];
  const planCounts = new Map();
  let gracePromises = 0;

  for (const client of clients) {
    const plan = client.plan_name || "MENSUAL";
    planCounts.set(plan, (planCounts.get(plan) || 0) + 1);

    if (!client.active) {
      membershipBuckets[3].total += 1;
      continue;
    }

    const days = Math.ceil((parseDate(client.membership_paid_until) - today) / 86400000);
    if (days < 0) membershipBuckets[0].total += 1;
    else if (days <= 7) membershipBuckets[1].total += 1;
    else membershipBuckets[2].total += 1;

    if (days < 0 && client.grace_until && Math.ceil((parseDate(client.grace_until) - today) / 86400000) >= 0) {
      gracePromises += 1;
    }
  }

  const todayForCash = new Date();
  const monthStart = `${todayForCash.getFullYear()}-${String(todayForCash.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(todayForCash.getFullYear(), todayForCash.getMonth() + 1, 0).getDate();
  const monthEnd = `${todayForCash.getFullYear()}-${String(todayForCash.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const cashFrom = searchParams.get("from") || monthStart;
  const cashTo = searchParams.get("to") || monthEnd;
  const cash = statements.listCash.all(cashFrom, cashFrom, cashTo, cashTo);
  const income = cash.filter((item) => item.type === "Ingreso").reduce((sum, item) => sum + item.amount, 0);
  const expenses = cash.filter((item) => item.type === "Egreso" || item.type === "Retiro").reduce((sum, item) => sum + item.amount, 0);
  const paymentsByDayMap = new Map();
  for (const movement of cash.filter((item) => item.type === "Ingreso")) {
    const day = String(movement.created_at).slice(0, 10);
    paymentsByDayMap.set(day, (paymentsByDayMap.get(day) || 0) + movement.amount);
  }
  const paymentsByDay = [];
  for (let index = 0; index < lastDay; index += 1) {
    const day = `${todayForCash.getFullYear()}-${String(todayForCash.getMonth() + 1).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`;
    paymentsByDay.push({ day, total: paymentsByDayMap.get(day) || 0 });
  }
  const incomeByMethodMap = new Map();
  for (const movement of cash.filter((item) => item.type === "Ingreso")) {
    const method = movement.method || "Sin metodo";
    incomeByMethodMap.set(method, (incomeByMethodMap.get(method) || 0) + movement.amount);
  }

  return {
    totals: {
      clients: clients.length,
      activeClients: clients.filter((client) => client.active).length,
      expiring7Days: membershipBuckets[1].total,
      overdue: membershipBuckets[0].total,
      gracePromises,
      income,
      expenses,
      profit: income - expenses
    },
    accessByDay,
    accessByStatus,
    membershipBuckets,
    planCounts: Array.from(planCounts, ([label, total]) => ({ label, total })),
    paymentsByDay,
    incomeByPlan: statements.paymentsByPlan.all(cashFrom, cashFrom, cashTo, cashTo),
    incomeByMethod: Array.from(incomeByMethodMap, ([label, total]) => ({ label, total })),
    topClients: statements.topClients.all()
  };
}

function buildClientFile(client) {
  return {
    ok: true,
    client,
    payments: statements.clientPayments.all(client.id),
    accesses: statements.clientAccesses.all(client.id),
    summary: {
      daysRemaining: Math.ceil((parseDate(client.membership_paid_until) - startOfDay(new Date())) / 86400000),
      totalPayments: statements.clientPayments.all(client.id).reduce((sum, item) => sum + item.amount, 0),
      totalAccesses: statements.clientAccesses.all(client.id).length
    }
  };
}

function buildExpiringAlerts() {
  const today = startOfDay(new Date());
  const clients = statements.listClients.all()
    .map((client) => ({
      ...client,
      days_remaining: Math.ceil((parseDate(client.membership_paid_until) - today) / 86400000),
      grace_days_remaining: client.grace_until ? Math.ceil((parseDate(client.grace_until) - today) / 86400000) : null
    }));
  const expiringAlerts = clients
    .filter((client) => client.active && client.days_remaining >= 0 && client.days_remaining <= 7)
    .map((client) => {
      const message = `Hola ${client.first_name}, te recordamos que tu cuota de Hercules Gym vence el ${formatDisplayDate(client.membership_paid_until)}. Podes renovarla en recepcion.`;
      return {
        client,
        title: `${client.first_name} ${client.last_name} - vence en ${client.days_remaining} dias`,
        message,
        emailUrl: `mailto:${encodeURIComponent(client.email)}?subject=${encodeURIComponent("Recordatorio de cuota - Hercules Gym")}&body=${encodeURIComponent(message)}`,
        whatsappUrl: `https://wa.me/${cleanDni(client.phone)}?text=${encodeURIComponent(message)}`
      };
    });
  const graceAlerts = clients
    .filter((client) => client.active && client.days_remaining < 0 && client.grace_until && client.grace_days_remaining >= 0)
    .map((client) => {
      const message = `Promesa de pago: ${client.first_name} ${client.last_name} debe cuota y prometio pagar el ${formatDisplayDate(client.grace_until)}. Regularice su situacion en recepción. Muchas gracias. Hercules Gym`;
      return {
        client,
        title: `${client.first_name} ${client.last_name} - prorroga hasta ${formatDisplayDate(client.grace_until)}`,
        message,
        whatsappUrl: `https://wa.me/${cleanDni(client.phone)}?text=${encodeURIComponent(message)}`
      };
    });
  return [...graceAlerts, ...expiringAlerts];
}

function buildCashStatus() {
  const session = statements.activeCashSession.get();
  const lastSession = session || statements.lastCashSession.get();
  const totals = session ? statements.cashMovementTotalsSince.get(session.opened_at) : null;
  return {
    open: Boolean(session),
    session: lastSession || null,
    balance: session ? Number(totals?.balance ?? session.opening_amount ?? 0) : Number(lastSession?.closing_amount ?? 0)
  };
}

function buildCashSessions() {
  const movements = statements.listCash.all(null, null, null, null);
  return statements.listCashSessions.all().map((session) => {
    const openedAt = new Date(String(session.opened_at).replace(" ", "T"));
    const closedAt = session.closed_at ? new Date(String(session.closed_at).replace(" ", "T")) : null;
    const sessionMovements = movements.filter((movement) => {
      const createdAt = new Date(String(movement.created_at).replace(" ", "T"));
      return createdAt >= openedAt && (!closedAt || createdAt <= closedAt);
    });
    const expected = sessionMovements.reduce((sum, movement) => {
      if (movement.type === "Egreso") return sum - Number(movement.amount || 0);
      return sum + Number(movement.amount || 0);
    }, 0);
    const closingAmount = session.closing_amount === null || session.closing_amount === undefined ? null : Number(session.closing_amount);
    return {
      ...session,
      expected_amount: expected,
      difference: closingAmount === null ? null : closingAmount - expected,
      movements_count: sessionMovements.length,
      income_total: sessionMovements.filter((item) => item.type === "Ingreso" || item.type === "Apertura").reduce((sum, item) => sum + Number(item.amount || 0), 0),
      expense_total: sessionMovements.filter((item) => item.type === "Egreso").reduce((sum, item) => sum + Number(item.amount || 0), 0)
    };
  });
}

function normalizeClient(body) {
  const client = {
    first_name: requiredText(body.first_name, "nombre"),
    last_name: requiredText(body.last_name, "apellido"),
    dni: cleanDni(body.dni),
    phone: requiredText(body.phone, "celular"),
    email: requiredText(body.email, "email"),
    address: optionalText(body.address),
    photo: optionalText(body.photo),
    weight_kg: optionalNumber(body.weight_kg),
    height_cm: optionalNumber(body.height_cm),
    birth_date: optionalDate(body.birth_date),
    plan_name: (optionalText(body.plan_name) || "MENSUAL").toUpperCase(),
    membership_paid_until: optionalDate(body.membership_paid_until),
    active: body.active === false || body.active === "false" ? 0 : 1
  };

  if (!client.dni) throw badRequest("El DNI es obligatorio.");
  if (!isValidPlan(client.plan_name)) throw badRequest("El plan seleccionado no es valido.");
  if (!client.email.includes("@")) throw badRequest("El email debe ser valido.");
  if (!client.membership_paid_until) throw badRequest("La fecha de mensualidad es obligatoria.");

  return client;
}

function isValidPlan(planName) {
  return Boolean(statements.getPlanByName.get(String(planName || "").toUpperCase()));
}

function requiredText(value, label) {
  const text = optionalText(value);
  if (!text) throw badRequest(`El campo ${label} es obligatorio.`);
  return text;
}

function optionalText(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
}

function cleanDni(value) {
  return String(value || "").replace(/\D/g, "");
}

function optionalNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) throw badRequest("Los campos numericos deben contener numeros validos.");
  return number;
}

function optionalDate(value) {
  const text = optionalText(value);
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw badRequest("Las fechas deben tener formato YYYY-MM-DD.");
  return text;
}

function parseDate(value) {
  return startOfDay(new Date(`${value}T00:00:00`));
}

function nextMembershipDate(currentPaidUntil, planName, concept) {
  const base = parseDate(currentPaidUntil) > startOfDay(new Date()) ? parseDate(currentPaidUntil) : startOfDay(new Date());
  const normalizedPlan = String(planName || "").toUpperCase();
  const normalizedConcept = String(concept || "").toLowerCase();
  if (normalizedPlan === "DIARIO" || normalizedConcept === "diario") {
    base.setDate(base.getDate() + 1);
  } else if (normalizedPlan === "SEMANAL" || normalizedConcept === "semanal") {
    base.setDate(base.getDate() + 7);
  } else {
    base.setMonth(base.getMonth() + 1);
  }
  return formatIsoDate(base);
}

function formatIsoDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function buildDateTime(date, time, endOfDay) {
  if (!date) return null;
  return `${date} ${time || (endOfDay ? "23:59:59" : "00:00:00")}`;
}

function formatDisplayDate(value) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function cryptoToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function getCookie(req, name) {
  const cookies = String(req.headers.cookie || "").split(";").map((item) => item.trim());
  const match = cookies.find((item) => item.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function isAdmin(req) {
  return Boolean(getSession(req));
}

function isSystemAdmin(req) {
  return getSession(req)?.role === "admin";
}

function getSession(req) {
  const token = getCookie(req, "gym_admin");
  return token ? sessions.get(token) : null;
}

function isReception(req) {
  return getSession(req)?.role === "reception";
}

function publicSession(session) {
  return {
    user: session.user,
    role: session.role,
    permissions: session.permissions
  };
}

function isAdvancedRoute(method, pathname) {
  if (pathname === "/api/staff") return true;
  if ((pathname === "/api/plans" || pathname.startsWith("/api/plans/")) && method !== "GET") return true;
  if (method === "DELETE" && pathname.startsWith("/api/clients/")) return true;
  return false;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((item) => item.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(badRequest("El pedido es demasiado grande."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(badRequest("JSON invalido."));
      }
    });
    req.on("error", reject);
  });
}

function readBinary(req, limitBytes = 20 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(badRequest("El archivo es demasiado grande."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendDownload(res, content, filename, contentType) {
  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": content.length,
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store"
  });
  res.end(content);
}

function serveStatic(requestPath, res) {
  const routeAliases = {
    "/": "/login.html",
    "/login": "/login.html",
    "/admin": "/admin.html"
  };
  const cleanPath = routeAliases[requestPath] || requestPath;
  const filePath = path.normalize(path.join(PUBLIC_DIR, cleanPath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("No encontrado");
    }

    const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType, "Cache-Control": contentType.includes("text/html") ? "no-store" : "public, max-age=3600" });
    res.end(content);
  });
}

function applySecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  if (COOKIE_SECURE) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
}

function cookieHeader(name, value, maxAge) {
  return `${name}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${COOKIE_SECURE ? "; Secure" : ""}`;
}

function buildClientsExcel() {
  const rows = statements.listClients.all();
  const headers = ["Apellido", "Nombre", "DNI", "Celular", "Email", "Plan", "Cuota paga hasta", "Estado", "Prorroga", "Nota prorroga", "Activo", "Direccion", "Peso kg", "Altura cm", "Nacimiento", "Ultimo pago", "Ultimo monto"];
  const bodyRows = rows.map((client) => [
    client.last_name,
    client.first_name,
    client.dni,
    client.phone,
    client.email,
    client.plan_name,
    client.membership_paid_until,
    membershipStatusForExport(client),
    client.grace_until || "",
    client.grace_note || "",
    client.active ? "Si" : "No",
    client.address || "",
    client.weight_kg || "",
    client.height_cm || "",
    client.birth_date || "",
    client.last_payment || "",
    client.last_amount || ""
  ]);
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><table><thead><tr>${headers.map((item) => `<th>${escapeHtml(item)}</th>`).join("")}</tr></thead><tbody>${bodyRows.map((row) => `<tr>${row.map((item) => `<td>${escapeHtml(item)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  return Buffer.from(html, "utf8");
}

function membershipStatusForExport(client) {
  if (!client.active) return "Inactivo";
  const days = Math.ceil((parseDate(client.membership_paid_until) - startOfDay(new Date())) / 86400000);
  if (days < 0) return "Vencida";
  if (days <= 7) return "Por vencer";
  return "Vigente";
}

function buildSystemBackup() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const manifest = {
    app: "Hercules Gym",
    version: "1.0.0",
    created_at: new Date().toISOString(),
    includes: ["gym_access.db", "source", "public", "package files"]
  };
  const entries = [
    { name: "backup-manifest.json", data: Buffer.from(JSON.stringify(manifest, null, 2), "utf8") }
  ];
  for (const file of collectBackupFiles(ROOT)) {
    entries.push({ name: toZipPath(path.relative(ROOT, file)), data: fs.readFileSync(file) });
  }
  return createZip(entries);
}

function collectBackupFiles(dir) {
  const skipDirs = new Set([".git", "node_modules", "backups"]);
  const files = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(item.name)) continue;
    const fullPath = path.join(dir, item.name);
    if (fullPath === RESTORE_PENDING_PATH) continue;
    if (item.isDirectory()) files.push(...collectBackupFiles(fullPath));
    else if (!item.name.endsWith(".zip")) files.push(fullPath);
  }
  return files;
}

function createZip(entries) {
  const fileRecords = [];
  const centralRecords = [];
  let offset = 0;
  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, "utf8");
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    local.writeUInt16LE(0, 28);
    fileRecords.push(local, nameBuffer, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralRecords.push(central, nameBuffer);
    offset += local.length + nameBuffer.length + data.length;
  }
  const centralSize = centralRecords.reduce((sum, item) => sum + item.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...fileRecords, ...centralRecords, end]);
}

function extractZipFile(zipBuffer, wantedName) {
  let offset = 0;
  while (offset + 30 <= zipBuffer.length) {
    const signature = zipBuffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) break;
    const method = zipBuffer.readUInt16LE(offset + 8);
    const compressedSize = zipBuffer.readUInt32LE(offset + 18);
    const uncompressedSize = zipBuffer.readUInt32LE(offset + 22);
    const nameLength = zipBuffer.readUInt16LE(offset + 26);
    const extraLength = zipBuffer.readUInt16LE(offset + 28);
    const name = zipBuffer.slice(offset + 30, offset + 30 + nameLength).toString("utf8");
    const dataStart = offset + 30 + nameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    if (toZipPath(name) === wantedName) {
      if (method !== 0) throw badRequest("El archivo de base dentro del ZIP usa compresion no soportada.");
      const data = zipBuffer.slice(dataStart, dataEnd);
      if (data.length !== uncompressedSize) throw badRequest("El backup esta incompleto.");
      return data;
    }
    offset = dataEnd;
  }
  return null;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function applyPendingRestore() {
  if (!fs.existsSync(RESTORE_PENDING_PATH)) return;
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, path.join(BACKUP_DIR, `pre-restore-${timestampForFile()}.db`));
  }
  fs.copyFileSync(RESTORE_PENDING_PATH, DB_PATH);
  fs.unlinkSync(RESTORE_PENDING_PATH);
}

function isLikelySqlite(buffer) {
  return buffer.slice(0, 16).toString("utf8") === "SQLite format 3\0";
}

function toZipPath(value) {
  return String(value || "").replace(/\\/g, "/");
}

function timestampForFile() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "_");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
}

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function seedDemoClientIfEmpty() {
  const count = db.prepare("SELECT COUNT(*) AS total FROM clients").get().total;
  if (count > 0) return;

  const paidUntil = new Date();
  paidUntil.setDate(paidUntil.getDate() + 18);
  const yyyyMmDd = paidUntil.toISOString().slice(0, 10);

  statements.insertClient.run(
    "Cliente",
    "Demo",
    "30111222",
    "1122334455",
    "demo@gimnasio.local",
    "Recepcion",
    "",
    78,
    176,
    "1990-01-15",
    "MENSUAL",
    yyyyMmDd,
    1
  );
}

function seedPlansIfEmpty() {
  db.exec(`
    UPDATE clients
    SET plan_name = CASE plan_name
      WHEN 'PREMIUM' THEN 'PERSONALIZADO'
      WHEN 'FULL' THEN 'MENSUAL'
      WHEN 'BASICO' THEN 'MENSUAL'
      WHEN 'DIA' THEN 'DIARIO'
      WHEN 'SEMANA' THEN 'SEMANAL'
      ELSE plan_name
    END;

  `);

  db.exec(`
    INSERT INTO plans (name, price, updated_at)
    VALUES
      ('PERSONALIZADO', 70000, datetime('now', 'localtime')),
      ('MENSUAL', 50000, datetime('now', 'localtime')),
      ('SEMANAL', 18000, datetime('now', 'localtime')),
      ('DIARIO', 8000, datetime('now', 'localtime'))
    ON CONFLICT(name) DO NOTHING;
  `);
}

function seedOperationalDataIfEmpty() {
  const activityCount = db.prepare("SELECT COUNT(*) AS total FROM activities").get().total;
  if (activityCount === 0) {
    db.prepare("INSERT INTO activities (name, billing_mode, weekly_limit) VALUES (?, ?, ?)").run("Musculacion", "Mensual", null);
    db.prepare("INSERT INTO activities (name, billing_mode, weekly_limit) VALUES (?, ?, ?)").run("Funcional", "Cantidad de clases", 3);
    db.prepare("INSERT INTO activities (name, billing_mode, weekly_limit) VALUES (?, ?, ?)").run("Zumba", "Mensual", 2);
  }

  const staffCount = db.prepare("SELECT COUNT(*) AS total FROM staff").get().total;
  if (staffCount === 0) {
    db.prepare("INSERT INTO staff (name, role, permissions) VALUES (?, ?, ?)").run("Administrador", "Admin", "total");
    db.prepare("INSERT INTO staff (name, role, permissions) VALUES (?, ?, ?)").run("Recepcion", "Empleado", "clientes,accesos,caja");
  }
}
