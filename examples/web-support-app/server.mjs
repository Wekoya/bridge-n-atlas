// A small web app: a customer-support chat in English, Yoruba, Hausa and
// Igbo, answered by N-ATLAS through Bridge.
//
//   export BRIDGE_API_KEY=wk_live_...
//   node server.mjs            # then open http://localhost:3000
//
// No dependencies (Node 18+). The browser never sees the key: it talks to
// this server, and this server talks to Bridge.

import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { extname, join, normalize } from "node:path"
import { fileURLToPath } from "node:url"

const BRIDGE_URL = "https://wekoya-api.wekoya.tech/v1/chat/completions"
const KEY = process.env.BRIDGE_API_KEY
const PORT = Number(process.env.PORT ?? 3000)
const MODEL = "n-atlas"
const FALLBACK = "gpt-6-luna" // used only if Bridge does not name one

// Limits that keep one visitor from running up your bill.
const MAX_BODY_BYTES = 32_000
const MAX_MESSAGES = 10 // N-ATLAS reads about 8,000 tokens in all: only recent turns are sent
const MAX_MESSAGE_CHARS = 1_500
const REQUESTS_PER_MINUTE = 10

const SYSTEM =
  "You are the support assistant of PayQuick, a Nigerian payments app. " +
  "Reply in the language the customer uses: English, Yoruba, Hausa or Igbo. " +
  "Be short, kind and practical. If a transfer is missing, ask for the transaction " +
  "reference and the date, and say a human agent will follow up within 24 hours. " +
  "Never ask for a PIN, password or card number."

if (!KEY) {
  console.error("Set BRIDGE_API_KEY first: export BRIDGE_API_KEY=wk_live_...")
  process.exit(1)
}

const PUBLIC = fileURLToPath(new URL("./public/", import.meta.url))
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml" }
const TOO_LARGE = Symbol("too large")
const recent = new Map() // visitor address -> request times in the last minute

const server = createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/api/chat") return await chat(request, response)
    if (request.method === "GET") return await serveFile(request, response)
    send(response, 405, { error: { type: "method_not_allowed", message: "Not allowed." } })
  } catch (error) {
    console.error(error)
    if (!response.headersSent) send(response, 500, { error: { type: "server_error", message: "Something went wrong. Try again." } })
  }
})

async function chat(request, response) {
  if (tooMany(request.socket.remoteAddress ?? "unknown")) {
    return send(response, 429, { error: { type: "rate_limited", message: "Too many messages. Wait a minute and try again." } })
  }
  const body = await readJson(request)
  if (body === TOO_LARGE) {
    return send(response, 413, { error: { type: "request_too_large", message: "That conversation is too long. Start a new one." } })
  }
  const history = Array.isArray(body?.messages) ? body.messages : []
  // Only user and assistant turns with text, trimmed: the system prompt is ours, never the browser's.
  const messages = history
    .filter((turn) => (turn?.role === "user" || turn?.role === "assistant") && typeof turn.content === "string" && turn.content.trim())
    .slice(-MAX_MESSAGES)
    .map((turn) => ({ role: turn.role, content: turn.content.slice(0, MAX_MESSAGE_CHARS) }))
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return send(response, 400, { error: { type: "invalid_request", message: "Type a message first." } })
  }

  let result = await ask(MODEL, messages)
  // N-ATLAS is a preview and can take a short break. Nothing was charged: ask a model Bridge suggests.
  if (!result.ok && ["model_resting", "model_unavailable"].includes(result.error?.type)) {
    result = await ask(result.error.suggested_models?.[0] ?? FALLBACK, messages)
  }
  if (!result.ok) return send(response, result.status, { error: result.error })
  send(response, 200, result.answer)
}

/** One request to Bridge. Never throws: a failure comes back as Bridge's own error. */
async function ask(model, messages) {
  try {
    const reply = await fetch(BRIDGE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 400, messages: [{ role: "system", content: SYSTEM }, ...messages] }),
      signal: AbortSignal.timeout(60_000),
    })
    const json = await reply.json().catch(() => ({}))
    if (!reply.ok || json.error) {
      return { ok: false, status: reply.ok ? 502 : reply.status, error: json.error ?? { type: "bridge_error", message: "The assistant could not answer. Try again." } }
    }
    return {
      ok: true,
      answer: { text: json.choices?.[0]?.message?.content ?? "", model, cost: json.wekoya?.cost ?? null, currency: json.wekoya?.currency ?? "NGN" },
    }
  } catch {
    return { ok: false, status: 504, error: { type: "timeout", message: "The assistant took too long. Try again." } }
  }
}

async function serveFile(request, response) {
  const path = new URL(request.url ?? "/", "http://localhost").pathname
  const file = normalize(join(PUBLIC, path === "/" ? "index.html" : path))
  // Never outside public/.
  if (!file.startsWith(PUBLIC)) return send(response, 404, { error: { type: "not_found", message: "Not found." } })
  const type = TYPES[extname(file)]
  const content = type ? await readFile(file).catch(() => undefined) : undefined
  if (!content) return send(response, 404, { error: { type: "not_found", message: "Not found." } })
  response.writeHead(200, { "Content-Type": type, "X-Content-Type-Options": "nosniff" })
  response.end(content)
}

async function readJson(request) {
  let size = 0
  const chunks = []
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) return TOO_LARGE
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"))
  } catch {
    return undefined
  }
}

function tooMany(visitor) {
  const now = Date.now()
  const times = (recent.get(visitor) ?? []).filter((at) => now - at < 60_000)
  times.push(now)
  recent.set(visitor, times)
  if (recent.size > 10_000) recent.delete(recent.keys().next().value)
  return times.length > REQUESTS_PER_MINUTE
}

function send(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" })
  response.end(JSON.stringify(body))
}

server.listen(PORT, () => console.log(`PayQuick support demo on http://localhost:${PORT}`))
