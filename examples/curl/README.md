# curl

One request to N-ATLAS from the terminal.

```bash
export BRIDGE_API_KEY=wk_live_...
./chat.sh "Ẹ káàárọ̀! Kí ni orúkọ olú-ìlú Nàìjíríà?"
```

Prints the reply, and its cost in naira on the next line. If Bridge refuses the request, it prints Bridge's error (with a `type`, such as `model_resting` or `insufficient_funds`) and exits with status 1.

Needs `curl` and `python3` (to build the JSON safely, so quotes and tone marks never break the request).
