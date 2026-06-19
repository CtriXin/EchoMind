# Flywheel MMS Run Hook E2E Note

- This file verifies that the Flywheel worker hook is scheduled through `mmf flywheel run`.
- This is a docs-only smoke test; it does not change `src/`, `dist/`, or package configuration.
- Before human merge, the run should show worker result, gate status, and gate run comment.
