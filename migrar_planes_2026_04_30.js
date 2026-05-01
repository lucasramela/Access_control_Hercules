const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync("gym_access.db");

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

  DELETE FROM plans
  WHERE name NOT IN ('PERSONALIZADO', 'MENSUAL', 'SEMANAL', 'DIARIO');

  INSERT INTO plans (name, price, updated_at)
  VALUES ('PERSONALIZADO', 70000, datetime('now', 'localtime'))
  ON CONFLICT(name) DO UPDATE SET price = excluded.price, updated_at = excluded.updated_at;

  INSERT INTO plans (name, price, updated_at)
  VALUES ('MENSUAL', 50000, datetime('now', 'localtime'))
  ON CONFLICT(name) DO UPDATE SET price = excluded.price, updated_at = excluded.updated_at;

  INSERT INTO plans (name, price, updated_at)
  VALUES ('SEMANAL', 18000, datetime('now', 'localtime'))
  ON CONFLICT(name) DO UPDATE SET price = excluded.price, updated_at = excluded.updated_at;

  INSERT INTO plans (name, price, updated_at)
  VALUES ('DIARIO', 8000, datetime('now', 'localtime'))
  ON CONFLICT(name) DO UPDATE SET price = excluded.price, updated_at = excluded.updated_at;
`);

console.log("Planes:");
console.table(db.prepare(`
  SELECT name, price
  FROM plans
  ORDER BY CASE name
    WHEN 'PERSONALIZADO' THEN 1
    WHEN 'MENSUAL' THEN 2
    WHEN 'SEMANAL' THEN 3
    WHEN 'DIARIO' THEN 4
    ELSE 5
  END
`).all());

console.log("Clientes por plan:");
console.table(db.prepare("SELECT plan_name, COUNT(*) AS total FROM clients GROUP BY plan_name").all());

db.close();
