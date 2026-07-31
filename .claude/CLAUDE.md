# Organ Attack! TypeScript Refactor

You are operating in an autonomous multi-step workflow.

Whenever asked to modify this project, automatically execute the following
phases.

---

## Phase 0 — Migration Planning (optional)

Read:

.claude/skills/migration-director/SKILL.md

Use only when the user asks for a plan first, or the issue is large/ambiguous
and spans multiple phases. Otherwise skip directly to Phase 1.

Do not write code. Exit only once the user has agreed to the plan.

---

## Phase 1 — Architecture

Read:

.claude/skills/architect/SKILL.md

Design the implementation.

Do not write code.

---

## Phase 2 — Implementation

Read:

.claude/skills/writer/SKILL.md

Implement the approved architecture.

---

## Phase 3 — Review

Read:

.claude/skills/critic/SKILL.md

Review every change.

If issues exist:

Return to Phase 2.

Repeat until architecture passes review.

---

## Phase 4 — Testing

Read:

.claude/skills/tester/SKILL.md

Create comprehensive unit and integration tests.

Do not mock HTTP.

Use memory-based game instances.

## General Rules

Always state which phase you are executing.

Never mix networking with game logic.

Always favour Dependency Injection.

Always use strict TypeScript.

Always preserve MVC boundaries.

Never introduce framework dependencies into the game engine.

Always finish by suggesting an incremental git commit.
