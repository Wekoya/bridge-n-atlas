#!/usr/bin/env bash
# Ask N-ATLAS a question through Bridge.
#
#   export BRIDGE_API_KEY=wk_live_...
#   ./chat.sh "Báwo ni? Ṣàlàyé ohun tí Bridge jẹ́ ní gbólóhùn kan."
#
# Prints the reply, or Bridge's error (a JSON object with a "type") and exits 1.

set -euo pipefail

if [ -z "${BRIDGE_API_KEY:-}" ]; then
  echo "Set BRIDGE_API_KEY first: export BRIDGE_API_KEY=wk_live_..." >&2
  exit 1
fi

question="${1:-Báwo ni? Dáhùn ní Yorùbá ní gbólóhùn kan.}"

# The question goes in as JSON, so quotes and Yoruba tone marks are escaped safely.
body=$(python3 -c 'import json, sys; print(json.dumps({
    "model": "n-atlas",
    "max_tokens": 300,
    "messages": [
        {"role": "system", "content": "Reply in the language the user writes in."},
        {"role": "user", "content": sys.argv[1]},
    ],
}))' "$question")

response=$(curl -sS --max-time 60 -w '\n%{http_code}' https://wekoya-api.wekoya.tech/v1/chat/completions \
  -H "Authorization: Bearer $BRIDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$body")

status=$(printf '%s' "$response" | tail -n 1)
json=$(printf '%s' "$response" | sed '$d')

if [ "$status" != "200" ]; then
  echo "Bridge answered $status:" >&2
  echo "$json" >&2
  exit 1
fi

printf '%s' "$json" | python3 -c 'import json, sys
reply = json.load(sys.stdin)
print(reply["choices"][0]["message"]["content"])
cost = reply.get("wekoya", {}).get("cost")
if cost is not None:
    print(f"\n(cost: ₦{cost})", file=sys.stderr)'
