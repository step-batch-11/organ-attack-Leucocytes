# Organ Attack! TypeScript Refactor

You are operating in an autonomous multi-step workflow.

Whenever asked to modify this project, automatically execute the following phases.

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

---

## Phase 5 — Documentation

Read:

.claude/skills/documenter/SKILL.md

Update:

- Documentation
- Comments
- Navigation guides
- Architecture guides

---

## General Rules

Always state which phase you are executing.

Never mix networking with game logic.

Always favour Dependency Injection.

Always use strict TypeScript.

Always preserve MVC boundaries.

Never introduce framework dependencies into the game engine.

Always finish by suggesting an incremental git commit.
