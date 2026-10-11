"""The smallest N-ATLAS call through Bridge.

    pip install -r requirements.txt
    export BRIDGE_API_KEY=wk_live_...
    python chat.py "Sannu! Me Bridge ke yi?"
"""

import os
import sys

from openai import APIStatusError, OpenAI

client = OpenAI(
    base_url="https://wekoya-api.wekoya.tech/v1",
    api_key=os.environ.get("BRIDGE_API_KEY") or sys.exit("Set BRIDGE_API_KEY first."),
)

question = sys.argv[1] if len(sys.argv) > 1 else "Báwo ni? Dáhùn ní Yorùbá ní gbólóhùn kan."

try:
    reply = client.chat.completions.create(
        model="n-atlas",
        max_tokens=300,
        messages=[
            {"role": "system", "content": "Reply in the language the user writes in."},
            {"role": "user", "content": question},
        ],
    )
except APIStatusError as error:
    # Every Bridge error says what happened in plain words, with a "type" to branch on.
    body = error.body if isinstance(error.body, dict) else {}
    problem = body.get("error", body)
    sys.exit(f"[{problem.get('type', error.status_code)}] {problem.get('message', 'Request failed.')}")

print(reply.choices[0].message.content)
