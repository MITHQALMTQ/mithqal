/**
 * Mithqal Discord Bot — mini-service (port 3004)
 * Slash commands (/help /status /oracle /nav /reserve) + event forwarding (/emit).
 * Reads ../../.env for DISCORD_BOT_TOKEN, DISCORD_APP_ID, DISCORD_NOTIFY_CHANNEL_ID.
 */
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, Events, type TextChannel, type ChatInputCommandInteraction } from "discord.js";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../../.env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env) || !process.env[k]) process.env[k] = v;
  }
}

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const APP_ID = process.env.DISCORD_APP_ID;
const MITHQAL_API = process.env.MITHQAL_API_BASE || "http://localhost:3000";
const PORT = Number(process.env.DISCORD_BOT_PORT) || 3004;

if (!TOKEN || !APP_ID) { console.error("[discord-bot] FATAL: DISCORD_BOT_TOKEN or DISCORD_APP_ID missing"); process.exit(1); }

const commands = [
  new SlashCommandBuilder().setName("help").setDescription("List Mithqal Discord commands"),
  new SlashCommandBuilder().setName("status").setDescription("Mithqal system health (DB, RPCs, oracle, SMTP)"),
  new SlashCommandBuilder().setName("oracle").setDescription("Live gold / silver / stablecoin prices"),
  new SlashCommandBuilder().setName("nav").setDescription("Live NAV — 1 MTQ = $X and reserve ratio"),
  new SlashCommandBuilder().setName("reserve").setDescription("Reserve state summary (4 views + execution mode)"),
].map((c) => c.toJSON());

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
let notifyChannel: TextChannel | null = null;

client.once(Events.ClientReady, async (c) => {
  console.log(`[discord-bot] ✅ Logged in as ${c.user.tag} (id ${c.user.id})`);
  console.log(`[discord-bot] Connected to ${c.guilds.cache.size} guild(s)`);
  const rest = new REST({ version: "10" }).setToken(TOKEN!);
  try {
    await rest.put(Routes.applicationCommands(APP_ID!), { body: commands });
    console.log(`[discord-bot] Registered ${commands.length} global slash commands`);
  } catch (e) { console.error("[discord-bot] global cmd reg failed:", e); }
  for (const guild of c.guilds.cache.values()) {
    try { await rest.put(Routes.applicationGuildCommands(APP_ID!, guild.id), { body: commands }); console.log(`[discord-bot] guild cmds: ${guild.name}`); } catch (e) { console.error(`[discord-bot] guild cmd failed ${guild.name}:`, e); }
  }
  const configured = process.env.DISCORD_NOTIFY_CHANNEL_ID;
  if (configured) {
    const ch = await client.channels.fetch(configured).catch(() => null);
    if (ch && ch.isTextBased() && "send" in ch) { notifyChannel = ch as TextChannel; console.log(`[discord-bot] notify channel: #${notifyChannel.name}`); }
  }
  if (!notifyChannel) {
    for (const guild of c.guilds.cache.values()) {
      const channels = await guild.channels.fetch();
      for (const ch of channels.values()) {
        if (ch && ch.isTextBased() && ch.type === 0 && "send" in ch) {
          const tc = ch as TextChannel;
          const perms = tc.permissionsFor(c.user);
          if (perms && perms.has("SendMessages") && perms.has("ViewChannel")) { notifyChannel = tc; console.log(`[discord-bot] notify channel auto: #${tc.name}`); break; }
        }
      }
      if (notifyChannel) break;
    }
  }
  if (notifyChannel) {
    await notifyChannel.send({ embeds: [new EmbedBuilder().setTitle("🟢 Mithqal Discord Bot online").setDescription("Slash commands: `/help` `/status` `/oracle` `/nav` `/reserve`").setColor(0x22c55e).setTimestamp()] }).catch((e) => console.error("announce failed:", e));
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = interaction.commandName;
  console.log(`[discord-bot] /${cmd} by ${interaction.user.tag}`);
  try {
    await interaction.deferReply();
    const fetchJson = async (path: string) => { const r = await fetch(`${MITHQAL_API}${path}`, { signal: AbortSignal.timeout(15000) }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); };
    if (cmd === "help") {
      await interaction.editReply({ embeds: [new EmbedBuilder().setTitle("Mithqal Discord Commands").setColor(0xcaa86b).addFields(
        { name: "/status", value: "System health — DB, RPCs, oracle, SMTP", inline: false },
        { name: "/oracle", value: "Live gold & silver + stablecoin pegs", inline: false },
        { name: "/nav", value: "Live NAV — 1 MTQ = $X + reserve ratio", inline: false },
        { name: "/reserve", value: "Reserve state — 4 views + execution mode", inline: false },
        { name: "/help", value: "This message", inline: false },
      ).setFooter({ text: "Mithqal v19.0.3" }).setTimestamp()] });
    } else if (cmd === "status") {
      const h = await fetchJson("/api/health");
      const s = await fetchJson("/api/status").catch(() => null);
      const ic = (ok: boolean) => ok ? "🟢" : "🔴";
      const ch = h.checks || {};
      const fields = [
        { name: "Database", value: `${ic(ch.db?.ok)} ${ch.db?.ok ? `connected (${ch.db.latencyMs}ms)` : ch.db?.error || "down"}`, inline: true },
        { name: "Monad RPC", value: `${ic(ch.rpc?.ok)} ${ch.rpc?.detail || ch.rpc?.error}`, inline: true },
        { name: "Arc RPC", value: `${ic(ch.rpcArc?.ok)} ${ch.rpcArc?.detail || ch.rpcArc?.error}`, inline: true },
        { name: "Oracle", value: `${ic(ch.oracle?.ok)} ${ch.oracle?.detail || ch.oracle?.error}`, inline: true },
        { name: "SMTP", value: `${ic(ch.smtp?.ok)} ${ch.smtp?.detail || "n/a"}`, inline: true },
      ];
      if (s) { fields.push({ name: "Network", value: s.network || "—", inline: true }); fields.push({ name: "Version", value: s.version || "—", inline: true }); }
      await interaction.editReply({ embeds: [new EmbedBuilder().setTitle("Mithqal System Status").setColor(ch.db?.ok ? 0x22c55e : 0xef4444).addFields(...fields).setTimestamp(new Date(h.generatedAt))] });
    } else if (cmd === "oracle") {
      const o = await fetchJson("/api/oracle");
      await interaction.editReply({ embeds: [new EmbedBuilder().setTitle("Live Oracle Prices").setColor(0xcaa86b).addFields(
        { name: "Gold", value: `$${o.goldUsd?.toLocaleString("en-US", { maximumFractionDigits: 2 })}/oz`, inline: true },
        { name: "Silver", value: `$${o.silverUsd?.toLocaleString("en-US", { maximumFractionDigits: 3 })}/oz`, inline: true },
        { name: "Source", value: o.source || "—", inline: true },
        { name: "USDC", value: `$${o.stablecoins?.USDC ?? "—"}`, inline: true },
        { name: "USDT", value: `$${o.stablecoins?.USDT ?? "—"}`, inline: true },
        { name: "DAI", value: `$${o.stablecoins?.DAI ?? "—"}`, inline: true },
      ).setTimestamp(new Date(o.fetchedAt))] });
    } else if (cmd === "nav") {
      const n = await fetchJson("/api/nav");
      const f = (v: number) => `$${v?.toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
      await interaction.editReply({ embeds: [new EmbedBuilder().setTitle("Mithqal Live NAV").setColor(0xcaa86b).setDescription(`**1 MTQ = ${f(n.navM)}** (market)`).addFields(
        { name: "Market NAV", value: f(n.navM), inline: true },
        { name: "Prudential NAV", value: f(n.navL), inline: true },
        { name: "Stress NAV", value: f(n.navStress), inline: true },
        { name: "Reserve Ratio", value: `${n.reserveRatio?.toFixed(2)}%`, inline: true },
        { name: "Supply", value: `${n.supply?.toLocaleString("en-US")} MTQ`, inline: true },
        { name: "Minting", value: n.mintingPaused ? "⏸ Paused" : "✅ Active", inline: true },
      ).setFooter({ text: `${n.source} · gold $${n.goldUsd}/oz · silver $${n.silverUsd}/oz` }).setTimestamp(new Date(n.timestamp))] });
    } else if (cmd === "reserve") {
      const r = await fetchJson("/api/reserve/state");
      const v = r.views || {};
      const fa = (a: any[]) => (a || []).map((x) => `• ${x.assetId}: ${x.quantity?.toLocaleString("en-US")} ${x.unit} (${(x.actualWeight * 100).toFixed(1)}%)`).join("\n") || "—";
      await interaction.editReply({ embeds: [new EmbedBuilder().setTitle("Mithqal Reserve State").setColor(r.isSimulation ? 0xf59e0b : 0x22c55e).setDescription(r.disclaimer || "").addFields(
        { name: "Execution Mode", value: r.executionMode || "—", inline: true },
        { name: "Reconciliation", value: r.reserveState?.reconciliationStatus || "—", inline: true },
        { name: "Target View", value: fa(v.target), inline: false },
        { name: "Executed View", value: fa(v.executed), inline: false },
        { name: "Custodian View", value: fa(v.custodian), inline: false },
        { name: "Reconciled View", value: fa(v.reconciled), inline: false },
      ).setTimestamp()] });
    }
  } catch (err) {
    console.error(`[discord-bot] /${cmd} error:`, err);
    const m = err instanceof Error ? err.message : String(err);
    if (interaction.deferred) await interaction.editReply({ content: `⚠️ Command failed: \`${m}\`` }).catch(() => {});
  }
});

const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  if (req.method === "POST" && req.url?.startsWith("/emit")) {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      let p: any; try { p = JSON.parse(body); } catch { res.writeHead(400); return res.end(JSON.stringify({ error: "invalid JSON" })); }
      const { event, payload } = p;
      if (typeof event !== "string") { res.writeHead(400); return res.end(JSON.stringify({ error: "event must be string" })); }
      if (!notifyChannel) { res.writeHead(503); return res.end(JSON.stringify({ error: "no notify channel" })); }
      const embed = event === "submission:new"
        ? new EmbedBuilder().setTitle("📝 New Formation Committee Interest").setColor(0x3b82f6).addFields(
            { name: "Name", value: payload?.fullName ?? "—", inline: true },
            { name: "Role", value: payload?.role ?? "—", inline: true },
            { name: "Organization", value: payload?.org ?? "—", inline: true },
            { name: "Submission ID", value: `\`${payload?.id ?? "—"}\``, inline: false },
          ).setTimestamp()
        : new EmbedBuilder().setTitle(`🔔 ${event}`).setColor(0xcaa86b).setDescription("```\n" + JSON.stringify(payload, null, 2).slice(0, 1800) + "\n```").setTimestamp();
      notifyChannel.send({ embeds: [embed] }).then((msg) => { console.log(`[discord-bot] forwarded "${event}" to #${notifyChannel.name}`); res.writeHead(200); res.end(JSON.stringify({ ok: true, event, messageId: msg.id })); }).catch((e) => { res.writeHead(500); res.end(JSON.stringify({ error: "send failed", detail: String(e) })); });
    });
    return;
  }
  if (req.method === "GET" && req.url === "/health") { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ ok: true, service: "mithqal-discord-bot", bot: { ready: client.isReady(), tag: client.user?.tag ?? null }, guilds: client.guilds.cache.size, notifyChannel: notifyChannel?.name ?? null })); }
  res.writeHead(404); res.end(JSON.stringify({ error: "not found" }));
});
httpServer.listen(PORT, () => console.log(`[discord-bot] HTTP on port ${PORT} (/emit, /health)`));

client.login(TOKEN).catch((e) => { console.error("[discord-bot] login failed:", e); process.exit(1); });
const shutdown = (s: string) => { console.log(`[discord-bot] ${s}`); httpServer.close(); client.destroy(); setTimeout(() => process.exit(0), 500); };
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("uncaughtException", (e) => console.error("[discord-bot] uncaught:", e));
process.on("unhandledRejection", (e) => console.error("[discord-bot] unhandled:", e));
