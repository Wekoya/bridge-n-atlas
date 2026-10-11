# Web support app

A small customer-support chat for a fictional payments company, PayQuick. Customers write in English, Yorùbá, Hausa or Igbo, and N-ATLAS answers in the same language.

```bash
export BRIDGE_API_KEY=wk_live_...
node server.mjs          # Node 18+, no dependencies
# open http://localhost:3000
```

## How it is built

- **`server.mjs`** serves the page and has one endpoint, `POST /api/chat`. It adds the system prompt, sends the conversation to Bridge and returns the reply with the model and its cost. **The key never reaches the browser.**
- **`public/index.html`** is the chat. It shows replies as plain text, never as HTML.

## Edge cases it handles

- **N-ATLAS taking a break:** the server retries once on a model Bridge suggests, so the customer still gets an answer.
- **Spend control:**
  - at most 10 messages a minute per visitor;
  - only the last 10 turns are sent, at most 1,500 characters each;
  - requests over 32 KB are refused.
- **Prompt injection:** the browser cannot send a `system` message. Only user and assistant turns are passed on.
- **Slow or failed calls:** time out after 60 seconds with a clear message; Bridge's own errors are shown in its own words.
- **Files:** only files inside `public/` are served.

Set `PORT` to use another port. For production, put it behind HTTPS and set a monthly spending limit on the key.
