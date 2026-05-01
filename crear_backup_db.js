const { DatabaseSync } = require("node:sqlite");

const source = "gym_access.db";
const target = process.argv[2] || "gym_access_transfer.db";
const db = new DatabaseSync(source);

db.exec(`VACUUM INTO '${target.replaceAll("'", "''")}'`);
db.close();

console.log(`Backup creado: ${target}`);
