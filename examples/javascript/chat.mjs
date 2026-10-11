// The smallest N-ATLAS call through Bridge, streamed.
//
//   npm install
//   export BRIDGE_API_KEY=wk_live_...
//   node chat.mjs "Nnọọ! Kedu ka ị mere?"

import OpenAI from "openai"

if (!process.env.BRIDGE_API_KEY) {
  console.error("Set BRIDGE_API_KEY first.")
  process.exit(1)
}

const client = new OpenAI({
  baseURL: "https://wekoya-api.wekoya.tech/v1",
  apiKey: process.env.BRIDGE_API_KEY,
})

const question = process.argv[2] ?? "Báwo ni? Dáhùn ní Yorùbá ní gbólóhùn kan."

try {
  const stream = await client.chat.completions.create({
    model: "n-atlas",
    max_tokens: 300,
    stream: true,
    messages: [
      { role: "system", content: "Reply in the language the user writes in." },
      { role: "user", content: question },
    ],
  })
  for await (const chunk of stream) {
    // A problem after the stream has started arrives as a chunk with an error.
    if (chunk.error) throw Object.assign(new Error(chunk.error.message), { error: chunk.error })
    process.stdout.write(chunk.choices?.[0]?.delta?.content ?? "")
  }
  process.stdout.write("\n")
} catch (error) {
  // Every Bridge error says what happened in plain words, with a type to branch on.
  const problem = error?.error ?? {}
  console.error(`[${problem.type ?? error?.status ?? "error"}] ${problem.message ?? error?.message ?? "Request failed."}`)
  process.exit(1)
}
