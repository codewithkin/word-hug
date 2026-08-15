# systems/

Cross-cutting architecture documents. These describe subsystems that many features depend on.

Gitignored — working documents, not shipped artifacts.

## Documents

| File | Covers |
|---|---|
| `content-pipeline.md` | Puzzle authoring, validation, bundling, daily selection, OTA updates |
| `storage-persistence.md` | MMKV schema, keys, migrations, what is and isn't persisted |
| `i18n.md` | react-i18next setup, key conventions, the puzzle-translation problem |
| `monetization.md` | RevenueCat products, entitlements, Nudge Coin ledger, restore behaviour |
| `streaks-progress.md` | Streak rules, stats tracking, clock-tamper handling |

## Rules

- A systems doc owns its domain. If two docs disagree, the systems doc wins over a feature plan.
- Every storage key, entitlement ID, and product ID is defined in exactly one place here.
- Changes to a systems doc that break an existing feature plan must be noted in that plan's Open Questions.
