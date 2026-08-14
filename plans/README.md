# plans/

Feature-level planning documents. One doc per feature, written **before** the feature is built.

Gitignored — these are working documents, not shipped artifacts.

## Convention

| File | Purpose |
|---|---|
| `00-spec-critique.md` | Standing list of gaps, risks, and the decision log |
| `01-prd.md` | The formal product requirements document — the source of truth for scope |
| `02-lexicon-options.md` | Lexicon / frequency corpus evaluation and recommendation |
| `03-screens.md` | Designer-facing screen spec — layout structure and functionality |
| `99-backlog.md` | Things consciously cut from v1, with enough context to pick up later |
| `features/NN-<name>.md` | One plan per feature, numbered in the order we agree to build them |

## Feature plan template

Every file in `features/` follows this shape:

1. **Goal** — one sentence, what the player gets
2. **Out of scope** — what this feature explicitly does not do
3. **User-visible behaviour** — screen by screen, state by state
4. **Data model** — types, storage keys, defaults
5. **Dependencies** — which systems docs and other features this needs
6. **Edge cases** — empty, offline, first launch, error, locale
7. **Acceptance criteria** — checkable statements
8. **Open questions** — anything still undecided

## Relationship to `systems/`

`plans/` describes **what** and **why**, per feature.
`systems/` describes **how**, per cross-cutting subsystem (storage, i18n, purchases, content).

A feature plan should reference systems docs rather than restating them.
