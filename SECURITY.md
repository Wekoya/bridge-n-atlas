# Security

## Reporting a problem

If you find a security problem in these examples or in Bridge, **do not open a public issue**. Email **contact@wekoya.tech** with "Security" in the subject, what you found and how to reproduce it. We reply within two working days.

## Keeping your key safe

- Your Bridge key (`wk_live_...`) spends your balance. Keep it on your server, in an environment variable or a secret manager.
- Never put it in browser JavaScript, a mobile app, a screenshot or a repository. For apps that must call Bridge directly, use short-lived [guest keys](https://bridge.wekoya.tech/docs/guest-keys).
- Set a monthly spending limit on each key in the console, so a leaked key cannot run up a large bill.
- If a key leaks, revoke it under *API keys* straight away and create a new one.
