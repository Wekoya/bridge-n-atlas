# JavaScript (Node.js 18+)

```bash
npm install
export BRIDGE_API_KEY=wk_live_...
```

| File | What it shows |
|---|---|
| `chat.mjs` | A streamed answer, printed as it arrives. `node chat.mjs "Nnọọ!"` |
| `support-assistant.mjs` | A support reply with fallback: if N-ATLAS is taking a break, the same question goes to a model Bridge suggests. Also exports `answer()` for your own code. `node support-assistant.mjs "Na tura kudi amma ba a karba ba."` |

Uses the official [OpenAI Node SDK](https://github.com/openai/openai-node); only `baseURL` and the key change.
