// A multilingual customer-support reply on N-ATLAS, through Bridge, with a
// fallback: if N-ATLAS is taking a short break, the same question goes to a
// model Bridge suggests, so the customer always gets an answer.
//
//   npm install
//   export BRIDGE_API_KEY=wk_live_...
//   node support-assistant.mjs "Ina so in tura kudi amma ba a karba ba."

import OpenAI from "openai"

const MODEL = "n-atlas"
const FALLBACK = "gpt-6-luna" // used only if Bridge does not name one

const SYSTEM =
  "You are the support assistant of PayQuick, a Nigerian payments app. " +
  "Reply in the language the customer uses: English, Yoruba, Hausa or Igbo. " +
  "Be short, kind and practical. Never ask for a PIN, password or card number."

if (!process.env.BRIDGE_API_KEY) {
  console.error("Set BRIDGE_API_KEY first.")
  process.exit(1)
}

const client = new OpenAI({
  baseURL: "https://wekoya-api.wekoya.tech/v1",
  apiKey: process.env.BRIDGE_API_KEY,
  timeout: 60_000,
  maxRetries: 1,
})

/** Answer one customer message. Returns the reply, the model that wrote it, and its cost in naira. */
export async function answer(message) {
  const messages = [
    { role: "system", content: SYSTEM },
    { role: "user", content: String(message).slice(0, 2000) },
  ]
  let model = MODEL
  let reply
  try {
    reply = await client.chat.completions.create({ model, messages, max_tokens: 400 })
  } catch (error) {
    const problem = error?.error ?? {}
    // N-ATLAS is a preview and can take a short break. Nothing was charged.
    if (problem.type !== "model_resting" && problem.type !== "model_unavailable") throw error
    model = problem.suggested_models?.[0] ?? FALLBACK
    reply = await client.chat.completions.create({ model, messages, max_tokens: 400 })
  }
  return { text: reply.choices[0]?.message?.content ?? "", model, cost: reply.wekoya?.cost ?? null }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const message = process.argv[2] ?? "Mo fi owó ránṣẹ́, ṣùgbọ́n ẹni tí mo fi ránṣẹ́ kò tíì rí i."
  try {
    const result = await answer(message)
    console.log(`${result.text}\n\n(${result.model}${result.cost === null ? "" : `, ₦${result.cost}`})`)
  } catch (error) {
    const problem = error?.error ?? {}
    console.error(`[${problem.type ?? error?.status ?? "error"}] ${problem.message ?? error?.message ?? "Request failed."}`)
    process.exit(1)
  }
}
