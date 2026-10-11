# Python

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export BRIDGE_API_KEY=wk_live_...
```

| File | What it shows |
|---|---|
| `chat.py` | The smallest call: one question, one answer, Bridge's error in plain words if it fails. `python chat.py "Sannu!"` |
| `support_assistant.py` | A support assistant for a payments app. It keeps the conversation (only the latest turns, to fit N-ATLAS's context), answers in the customer's language, shows the cost of each reply, and switches to a suggested model if N-ATLAS is taking a break. `python support_assistant.py` |

Uses the official [OpenAI Python SDK](https://github.com/openai/openai-python); only `base_url` and the key change.
