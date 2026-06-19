# Resetting EchoMind

To completely reset EchoMind and clear all stored decisions and patterns,
delete the EchoMind data directory:

```bash
rm -rf "${ECHOMIND_HOME:-$HOME/.echomind}"
```

This removes all EchoMind state so you can start fresh.
