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

  // Restore .env — multi-tier fallback:
  //   1. /home/sync/mithqal.env (persistent mount — may survive)
  //   2. .env.encrypted in the git repo (decrypt with GitHub token's SHA-256)
  //   3. Re-clone from GitHub first (which brings .env.encrypted), then decrypt
  if (!existsSync(MITHQAL_ENV)) {
    let restored = false;
    // Tier 1: /home/sync backup
    if (existsSync(ENV_BACKUP)) {
      try { copyFileSync(ENV_BACKUP, MITHQAL_ENV); log(`✓ restored .env from ${ENV_BACKUP} (tier 1: sync)`); restored = true; } catch (e) { log(`✗ tier 1 env restore failed: ${e.message}`); }
    }
    // Tier 2: decrypt from .env.encrypted in the repo (if repo exists)
    if (!restored && existsSync(`${MITHQAL_DIR}/.env.encrypted`)) {
      try {
        // Need a GitHub token to derive the decryption key. Check /home/sync first, then prompt.
        let token = existsSync(ENV_BACKUP) ? (readFileSync(ENV_BACKUP, "utf-8").match(/^GITHUB_TOKEN=(.*)$/m) || [])[1]?.trim() : null;
        // If no token in sync backup, try reading from any surviving .env in the root project
        if (!token && existsSync("/home/z/my-project/.env")) {
          token = (readFileSync("/home/z/my-project/.env", "utf-8").match(/^GITHUB_TOKEN=(.*)$/m) || [])[1]?.trim();
        }
        if (token) {
          const { createHash } = await import("node:crypto");
          const key = createHash("sha256").update(token).digest("hex");
          execSync(`openssl enc -d -aes-256-cbc -pbkdf2 -in ${MITHQAL_DIR}/.env.encrypted -pass pass:${key} > ${MITHQAL_ENV}`, { stdio: "pipe", timeout: 10000 });
          log(`✓ restored .env from .env.encrypted (tier 2: git decrypt)`); restored = true;
        }
      } catch (e) { log(`✗ tier 2 env restore failed: ${e.message}`); }
    }
    if (!restored) { log(`✗ could not restore .env from any source — MANUAL INTERVENTION REQUIRED`); }
  }

  // Re-clone mithqal if missing (gets all committed code + .env.encrypted)
  if (!existsSync(`${MITHQAL_DIR}/package.json`)) {
    log("✗ mithqal source missing — re-cloning");
    // Try to get token from any surviving source
    let token = existsSync(ENV_BACKUP) ? (readFileSync(ENV_BACKUP, "utf-8").match(/^GITHUB_TOKEN=(.*)$/m) || [])[1]?.trim() : null;
    if (!token && existsSync("/home/z/my-project/.env")) {
      token = (readFileSync("/home/z/my-project/.env", "utf-8").match(/^GITHUB_TOKEN=(.*)$/m) || [])[1]?.trim();
    }
    if (token) {
      try {
        execSync(`git clone https://x-access-token:${token}@github.com/MITHQALMTQ/mithqal.git ${MITHQAL_DIR}`, { stdio: "pipe", timeout: 180000 });
        execSync(`git -C ${MITHQAL_DIR} remote set-url origin https://github.com/MITHQALMTQ/mithqal.git`);
        log("✓ re-cloned mithqal (all committed code + .env.encrypted)");
      } catch (e) { log(`✗ re-clone failed: ${e.message}`); }
    } else {
      log("✗ no GitHub token available — cannot re-clone. MANUAL INTERVENTION REQUIRED.");
    }
  }

  // After re-clone, restore .env from .env.encrypted (tier 2 above will handle on next tick)
  // but also copy the watchdog + discord-bot from the repo to their live locations
  if (existsSync(`${MITHQAL_DIR}/mini-services/mithqal-watchdog/index.ts`) && !existsSync("/home/z/my-project/mini-services/mithqal-watchdog/index.ts")) {
    try { execSync(`mkdir -p /home/z/my-project/mini-services/mithqal-watchdog && cp ${MITHQAL_DIR}/mini-services/mithqal-watchdog/* /home/z/my-project/mini-services/mithqal-watchdog/`); log("✓ restored watchdog source from repo"); } catch (e) { log(`✗ watchdog restore failed: ${e.message}`); }
  }

  // Install deps if missing
  if (existsSync(MITHQAL_DIR) && !existsSync(`${MITHQAL_DIR}/node_modules/next/package.json`)) {
    try { execSync("bun install", { cwd: MITHQAL_DIR, stdio: "pipe", timeout: 300000 }); log("✓ mithqal bun install"); } catch (e) { log(`✗ install failed: ${e.message}`); }
  }
  if (existsSync(DISCORD_BOT_DIR) && !existsSync(`${DISCORD_BOT_DIR}/node_modules/discord.js/package.json`)) {
    try { execSync("bun install", { cwd: DISCORD_BOT_DIR, stdio: "pipe", timeout: 120000 }); log("✓ discord-bot bun install"); } catch (e) { log(`✗ bot install failed: ${e.message}`); }
  }

  // Restart services if down
  // CRITICAL: pass DATABASE_URL + DATABASE_AUTH_TOKEN explicitly as env vars
  // because /start.sh writes a root .env with DATABASE_URL=file:... that
  // overrides the mithqal .env (process.env takes precedence over .env files).
  if (existsSync(MITHQAL_DIR) && existsSync(MITHQAL_ENV) && !(await isPortListening(3000))) {
    const envVars = readEnvVars(MITHQAL_ENV, ["DATABASE_URL", "DATABASE_AUTH_TOKEN"]);
    startDetachedWithEnv(MITHQAL_DIR, ["bun", "run", "dev"], "/home/z/my-project/dev.log", "mithqal dev", envVars);
  }
  if (existsSync(DISCORD_BOT_DIR) && existsSync(`${DISCORD_BOT_DIR}/index.ts`) && existsSync(MITHQAL_ENV) && !(await isPortListening(3004))) { try { mkdirSync(`${DISCORD_BOT_DIR}/logs`, { recursive: true }); } catch {}; startDetached(DISCORD_BOT_DIR, ["bun", "index.ts"], `${DISCORD_BOT_DIR}/logs/bot.log`, "discord bot"); }
}

// Helper: read specific env vars from a .env file
function readEnvVars(envFile, keys) {
  const result = {};
  try {
    const content = readFileSync(envFile, "utf-8");
    for (const key of keys) {
      const m = content.match(new RegExp(`^${key}=(.*)$`, "m"));
      if (m) result[key] = m[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
  return result;
}

// Like startDetached but with extra env vars (overrides process.env)
function startDetachedWithEnv(cwd, command, logFile, label, extraEnv) {
  log(`▶ starting ${label} (with ${Object.keys(extraEnv).length} env overrides)`);
  try {
    mkdirSync(cwd, { recursive: true });
    const fd = openSync(logFile, "w");
    const child = spawn(command[0], command.slice(1), { cwd, stdio: ["ignore", fd, fd], detached: true, env: { ...process.env, ...extraEnv } });
    child.unref();
    log(`✓ ${label} spawned (pid ${child.pid})`);
  } catch (e) { log(`✗ ${label} spawn FAILED: ${e.message}`); }
}

log("========================================");
log("Mithqal Watchdog starting (rebuilt after sandbox wipe)");
log("========================================");
tick();
setInterval(tick, POLL_MS);
process.on("SIGTERM", () => { log("SIGTERM"); process.exit(0); });
process.on("SIGINT", () => { log("SIGINT"); process.exit(0); });
