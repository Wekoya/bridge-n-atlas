"""A multilingual customer-support assistant on N-ATLAS, through Bridge.

It answers customers in English, Yoruba, Hausa or Igbo, keeps the
conversation, and shows what each reply cost. If N-ATLAS is taking a
break, it switches to a model Bridge suggests, so the customer is never left
without an answer.

    pip install -r requirements.txt
    export BRIDGE_API_KEY=wk_live_...
    python support_assistant.py
"""

import os
import sys

from openai import APIConnectionError, APIStatusError, APITimeoutError, OpenAI

MODEL = "n-atlas"
FALLBACK = "gpt-6-luna"  # used only if Bridge does not name one

# N-ATLAS reads about 8,000 tokens in all, so only the latest turns are sent.
MAX_TURNS = 10
MAX_MESSAGE_CHARS = 2000

SYSTEM = (
    "You are the support assistant of PayQuick, a Nigerian payments app. "
    "Reply in the language the customer uses: English, Yoruba, Hausa or Igbo. "
    "Be short, kind and practical. If a transfer is missing, ask for the "
    "transaction reference and the date, and say a human agent will follow up "
    "within 24 hours. Never ask for a PIN, password or card number."
)

client = OpenAI(
    base_url="https://wekoya-api.wekoya.tech/v1",
    api_key=os.environ.get("BRIDGE_API_KEY") or sys.exit("Set BRIDGE_API_KEY first."),
    timeout=60,
    max_retries=1,
)


def ask(history: list[dict]) -> tuple[str, str, float | None]:
    """Return (answer, model that answered, cost in naira)."""
    messages = [{"role": "system", "content": SYSTEM}, *history[-MAX_TURNS:]]
    model = MODEL
    try:
        reply = client.chat.completions.create(model=model, messages=messages, max_tokens=400)
    except APIStatusError as error:
        problem = _error_body(error)
        # N-ATLAS is a preview and can take a short break. Nothing was charged,
        # and Bridge names models to use instead.
        if problem.get("type") not in ("model_resting", "model_unavailable"):
            raise
        model = (problem.get("suggested_models") or [FALLBACK])[0]
        reply = client.chat.completions.create(model=model, messages=messages, max_tokens=400)
    cost = (getattr(reply, "model_extra", None) or {}).get("wekoya", {}).get("cost")
    return reply.choices[0].message.content or "", model, cost


def _error_body(error: APIStatusError) -> dict:
    try:
        return error.response.json().get("error", {}) or {}
    except ValueError:
        return {}


def main() -> None:
    print("PayQuick support (N-ATLAS on Bridge). Type in any language; an empty line quits.\n")
    history: list[dict] = []
    while True:
        try:
            text = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            break
        if not text:
            break
        history.append({"role": "user", "content": text[:MAX_MESSAGE_CHARS]})
        try:
            answer, model, cost = ask(history)
        except APIStatusError as error:
            problem = _error_body(error)
            print(f"\n[{problem.get('type', error.status_code)}] {problem.get('message', 'Something went wrong.')}\n")
            history.pop()
            continue
        except (APIConnectionError, APITimeoutError):
            print("\nCould not reach Bridge. Check your connection and try again.\n")
            history.pop()
            continue
        history.append({"role": "assistant", "content": answer})
        note = f"{model}" + (f", ₦{cost}" if cost is not None else "")
        print(f"\nAssistant ({note}): {answer}\n")


if __name__ == "__main__":
    main()
