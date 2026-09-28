import { createServer } from "http";
import { Server } from "socket.io";

// Mithqal notification mini-service.
// Port: 3003 (fixed, per project convention).
// Path MUST be "/" so Caddy can forward `/?XTransformPort=3003` correctly.
//
// This service relays real-time events from the Next.js API routes (e.g. a
// new Formation Committee submission) to subscribed admin/operator clients.
// It holds no state — it's a pure relay. Auth/event-emission happens in the
// Next.js API route via an internal HTTP call to the emit endpoint below.

// SECURITY (Task 4-A / Defect 4): every /emit POST MUST include an
// x-internal-secret header matching process.env.INTERNAL_SECRET. If the env
// var is unset, return 503 (refuse to operate unauthenticated) rather than
// allow public event injection into admin/operator WS clients. CORS is
// tightened from `*` to the known Mithqal origins only.
const ALLOWED_ORIGINS = [
  "https://localhost:3000",
  "https://mithqal.vercel.app",
];
function corsOriginFrom(origin: string | undefined): string | boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin) ? origin : false;
}

const httpServer = createServer((req, res) => {
  // Simple internal emit endpoint, called by the Next.js API when a new
  // submission is created. POST /emit with JSON { event, payload }.
  if (req.method === "POST" && req.url?.startsWith("/emit")) {
    // SECURITY: shared-secret gate. Refuse operation if INTERNAL_SECRET is
    // not configured, so an operator forgetting to set the env var cannot
    // accidentally expose /emit to the public internet.
    const secret = process.env.INTERNAL_SECRET;
    if (!secret) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "INTERNAL_SECRET not configured — /emit disabled" }));
      return;
    }
    if (req.headers["x-internal-secret"] !== secret) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "unauthorized — missing or invalid x-internal-secret header" }));
      return;
    }
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { event, payload } = JSON.parse(body);
        if (typeof event === "string") {
          io.emit(event, payload ?? {});
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true, emitted: event }));
        } else {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "event must be a string" }));
        }
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid JSON" }));
      }
    });
    return;
  }
  // Health check.
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, clients: io.engine.clientsCount }));
    return;
  }
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

const io = new Server(httpServer, {
  // Socket.io path is namespaced under /socket.io so it does NOT intercept
  // the /emit and /health HTTP routes above. Caddy still routes the whole
  // port via ?XTransformPort=3003 — socket.io clients connect to
  // /socket.io/?XTransformPort=3003 implicitly via the default path.
  //
  // SECURITY (Task 4-A / Defect 4): CORS tightened from `origin: "*"` to
  // an explicit allowlist of known Mithqal origins only.
  cors: { origin: corsOriginFrom, methods: ["GET", "POST"], credentials: false },
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.on("connection", (socket) => {
  console.log(`[notify] client connected: ${socket.id} (total: ${io.engine.clientsCount})`);
  socket.on("disconnect", () => {
    console.log(`[notify] client disconnected: ${socket.id}`);
  });
});

const PORT = 3003;
httpServer.listen(PORT, () => {
  console.log(`[notify] Mithqal notification service running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  console.log("[notify] SIGTERM, shutting down…");
  httpServer.close(() => process.exit(0));
});
process.on("SIGINT", () => {
  console.log("[notify] SIGINT, shutting down…");
  httpServer.close(() => process.exit(0));
});
