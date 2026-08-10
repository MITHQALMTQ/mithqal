import { execSync, spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, openSync } from "node:fs";
import { createConnection } from "node:net";

const SYNC_DIR = "/home/sync";
const ENV_BACKUP = `${SYNC_DIR}/mithqal.env`;
const LOG_FILE = `${SYNC_DIR}/mithqal-watchdog.log`;
const MITHQAL_DIR = "/home/z/my-project/mithqal";
const MITHQAL_ENV = `${MITHQAL_DIR}/.env`;
const DISCORD_BOT_DIR = `${MITHQAL_DIR}/mini-services/discord-bot`;
const POLL_MS = 20_000;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { mkdirSync(SYNC_DIR, { recursive: true }); writeFileSync(LOG_FILE, line + "\n", { flag: "a" }); } catch {}
}

function isPortListening(port) {
  return new Promise((resolve) => {
    const sock = createConnection({ port, host: "127.0.0.1" }, () => { sock.end(); resolve(true); });
    sock.on("error", () => resolve(false));
    sock.setTimeout(1500, () => { sock.destroy(); resolve(false); });
  });
}

function startDetached(cwd, command, logFile, label) {
  log(`▶ starting ${label}`);
  try {
    mkdirSync(cwd, { recursive: true });
    const fd = openSync(logFile, "w");
    const child = spawn(command[0], command.slice(1), { cwd, stdio: ["ignore", fd, fd], detached: true, env: { ...process.env } });
    child.unref();
    log(`✓ ${label} spawned (pid ${child.pid})`);
  } catch (e) { log(`✗ ${label} spawn FAILED: ${e.message}`); }
}

async function tick() {
  // Backup .env to /home/sync (best-effort — may not persist, but worth trying)
  if (existsSync(MITHQAL_ENV)) { try { mkdirSync(SYNC_DIR, { recursive: true }); copyFileSync(MITHQAL_ENV, ENV_BACKUP); } catch {} }
  
  // Restore .env if missing
  if (!existsSync(MITHQAL_ENV) && existsSync(ENV_BACKUP)) {
    try { copyFileSync(ENV_BACKUP, MITHQAL_ENV); log(`✓ restored .env from ${ENV_BACKUP}`); } catch (e) { log(`✗ env restore failed: ${e.message}`); }
  }

  // Re-clone mithqal if missing
  if (!existsSync(`${MITHQAL_DIR}/package.json`)) {
    log("✗ mithqal source missing — re-cloning");
    const token = existsSync(ENV_BACKUP) ? (readFileSync(ENV_BACKUP, "utf-8").match(/^GITHUB_TOKEN=(.*)$/m) || [])[1]?.trim() : null;
    if (token) {
      try { execSync(`git clone https://x-access-token:${token}@github.com/MITHQALMTQ/mithqal.git ${MITHQAL_DIR}`, { stdio: "pipe", timeout: 180000 }); execSync(`git -C ${MITHQAL_DIR} remote set-url origin https://github.com/MITHQALMTQ/mithqal.git`); log("✓ re-cloned mithqal"); } catch (e) { log(`✗ re-clone failed: ${e.message}`); }
    }
  }

  // Install deps if missing
  if (existsSync(MITHQAL_DIR) && !existsSync(`${MITHQAL_DIR}/node_modules/next/package.json`)) {
    try { execSync("bun install", { cwd: MITHQAL_DIR, stdio: "pipe", timeout: 300000 }); log("✓ mithqal bun install"); } catch (e) { log(`✗ install failed: ${e.message}`); }
  }
  if (existsSync(DISCORD_BOT_DIR) && !existsSync(`${DISCORD_BOT_DIR}/node_modules/discord.js/package.json`)) {
    try { execSync("bun install", { cwd: DISCORD_BOT_DIR, stdio: "pipe", timeout: 120000 }); log("✓ discord-bot bun install"); } catch (e) { log(`✗ bot install failed: ${e.message}`); }
  }

  // Restart services if down
  if (existsSync(MITHQAL_DIR) && !(await isPortListening(3000))) { startDetached(MITHQAL_DIR, ["bun", "run", "dev"], "/home/z/my-project/dev.log", "mithqal dev"); }
  if (existsSync(DISCORD_BOT_DIR) && existsSync(`${DISCORD_BOT_DIR}/index.ts`) && !(await isPortListening(3004))) { try { mkdirSync(`${DISCORD_BOT_DIR}/logs`, { recursive: true }); } catch {}; startDetached(DISCORD_BOT_DIR, ["bun", "index.ts"], `${DISCORD_BOT_DIR}/logs/bot.log`, "discord bot"); }
}

log("========================================");
log("Mithqal Watchdog starting (rebuilt after sandbox wipe)");
log("========================================");
tick();
setInterval(tick, POLL_MS);
process.on("SIGTERM", () => { log("SIGTERM"); process.exit(0); });
process.on("SIGINT", () => { log("SIGINT"); process.exit(0); });
