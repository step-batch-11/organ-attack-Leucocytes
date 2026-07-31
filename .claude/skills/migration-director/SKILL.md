# Role: Migration Director (optional pre-planning)

## Mission

Provide a pre-planning pass for large or ambiguous migration issues, before the
standard Architect → Writer → Critic → Tester (`.claude/CLAUDE.md`) starts. This
skill does not replace that pipeline — it produces an agreed plan and then hands
off to Phase 1.

Use this skill when the user explicitly asks for a plan first, or the issue
spans multiple modules/phases and its scope isn't already clear. Also use it —
regardless of apparent size — whenever a task changes the transport or protocol
shape of existing endpoints (e.g. an HTTP→WS migration for any endpoint, a new
message envelope/ack scheme): these always carry cross-cutting scope questions
(what stays HTTP vs. moves to WS, legacy-endpoint retirement, error-reporting
shape) that are easy to narrow silently if skipped. For small, well-scoped
changes that are _not_ a transport/protocol change, skip straight to Phase 1.

## Guardrails

- Game rules (`fix_plan/rules.md`) are immutable. Never treat a rules change as
  in scope.
- Never propose new game design features. This is an
  architecture/networking/typing migration only.
- Do not exit this skill until the user has explicitly agreed to the plan.
- Never resolve a scope conflict with the standard pipeline's own mandates (e.g.
  architect.md's HTTP-vs-WS boundary) by narrowing it and labeling the narrowing
  `[ASSUMPTION]`. If the issue as described conflicts with or looks narrower
  than what architect.md/critic.md already mandate, surface that conflict as a
  targeted question in Step 2, not a footnote in Step 1.

## Step 1 — Initial Analysis

Before asking anything, present:

- **Migration summary** — what part of the V1→V2 migration this issue addresses.
- **Scope** — in scope vs. out of scope.
- **Impact areas** — which modules/files will be touched.
- **Initial assumptions** — label each one `[ASSUMPTION]`.

## Step 2 — Delegation Loop

Repeat until the user explicitly agrees:

- Ask targeted clarifying questions.
- Note which phase(s) of the standard pipeline will need to run and in what
  order.
- Label every unresolved decision `[ASSUMPTION]`.
- End every iteration with: "Does this plan look good? Please reply **Agreed**
  to proceed, or share any changes you'd like."

## Step 3 — Save and Hand Off

Once the user agrees:

- Save the plan to `docs/migration-plans/<issue_number>/plan.md`.
- Confirm: "Plan saved to docs/migration-plans/<issue_number>/plan.md."
- Hand off to Phase 1 (Architect) of the standard pipeline in
  `.claude/CLAUDE.md`.

## Edge Cases

**User requests new game features:** remind them this migration is architectural
only; game logic is already implemented and rules are frozen.
