# CLAUDE.md

## Workspace

Workspace memory and routing live at `../../AGENTS.md` (`~/projects/AGENTS.md`); read that first and follow its memory routing.

## Agent skills

### Issue tracker

Issues are tracked on `davidajudua/davidajudua.github.io` via the `gh` CLI (`gh issue ... -R davidajudua/davidajudua.github.io` when this folder lives inside workspace). External PRs are **not** a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the five canonical triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) with default names. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Verification

No test suite and nothing to typecheck. Prove changes by diffing computed styles in a real browser against the pre-change commit, never by eyeballing screenshots. See `docs/agents/verification.md`.
