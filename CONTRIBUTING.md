# Contributing

Thank you for helping more developers build with Nigerian languages. Examples, fixes, translations and clearer docs are all welcome.

## Ways to help

- **A new example:** another language (Go, PHP, Dart, Kotlin, Java, C#), a framework (Next.js, Django, Laravel, Flutter) or a use case (a WhatsApp bot, a tutor, a farmer advisory line).
- **A fix:** something that did not work for you, or a step that was unclear.
- **Better language:** prompts and sample messages in Yorùbá, Hausa, Igbo or Nigerian Pidgin written by native speakers.
- **An issue:** tell us what was hard. A short, specific report helps a lot.

## Before you start

1. Search the [issues](../../issues) to see whether someone is already on it.
2. For anything bigger than a small fix, open an issue first so we can agree on the approach.

## Making a change

1. Fork the repository and create a branch: `git checkout -b add-flutter-example`.
2. Put a new example in its own folder under `examples/`, with a `README.md` that says what it shows, how to run it and what it needs.
3. Keep examples small and runnable. One clear idea per example is better than a framework.
4. Read the key from the `BRIDGE_API_KEY` environment variable. **Never commit a key**, not even a revoked one.
5. Handle `model_resting`: N-ATLAS is a preview and can take a short break. Fall back to one of `suggested_models`, as the existing examples do.
6. Run the example against Bridge and say in the pull request that you did.
7. Open a pull request using the template, describing what changed and why.

## Style

- **Code:** follow the style of the files around yours. Prefer the standard library and the official OpenAI SDKs over extra dependencies.
- **Writing:** plain, short sentences.
- **Samples:** use realistic Nigerian names, places and amounts in naira, and never real people's personal data.

## Code of conduct

By taking part you agree to our [Code of Conduct](CODE_OF_CONDUCT.md).

## Questions

Open an issue, or email contact@wekoya.tech.
