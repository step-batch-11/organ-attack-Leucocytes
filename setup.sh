#!/usr/bin/env sh

set -eu

mkdir -p \
  .claude/skills/architect \
  .claude/skills/writer \
  .claude/skills/critic \
  .claude/skills/tester \
  .claude/skills/documenter

cat > .claude/skills/architect/SKILL.md <<'EOF'
# Role: Expert Software Architect & Code Analyzer

## Mission
Analyze the current broken HTML/CSS/JS "Organ Attack!" codebase and design a strict Vanilla TypeScript MVC architecture.

## Constraints & Rules

### 1. Architecture
- Enforce a strict Model-View-Controller (MVC) separation.
- Core models (`Game`, `Player`, `Organ`, `Deck`) must have zero knowledge of networking or frameworks.

### 2. Networking
- Remove all Hono `ctx` usage from game logic.
- Replace REST endpoints with a dedicated WebSocket communication layer.
- Use a `RealtimeHub` abstraction.
- Eliminate polling and waiting-list logic.

### 3. Commands
- Consolidate game actions into an `ActionStack`.
- Replace giant action dictionaries with a proper command architecture.

### 4. Dependency Injection
Inject all services.

Examples:
- Dealer
- TurnManager
- AfflictionHandler
- Random generator
- ID generator

### 5. Output
Do NOT write implementation code.

Produce only:

- Architecture diagrams
- Folder structures
- Interfaces
- Dependency graphs
- Design critiques

Ensure support for every game mechanic including:

- Instants
- Poison
- Cryopreservation
- Situs Inversus
- Chart Mixup
- Future expansion
EOF

cat > .claude/skills/writer/SKILL.md <<'EOF'
# Role: Senior TypeScript Developer

## Mission
Implement the approved architecture using clean Vanilla TypeScript.

## Rules

- Vanilla TypeScript only.
- No React.
- No Vue.
- No Angular.
- No hidden magic.

### Requirements

Convert:

- Game
- Player
- Deck
- Organ
- TurnManager
- ActionController

into strongly typed classes and interfaces.

Replace REST routes with a single WebSocket dispatcher.

Generate client state exclusively from:

Game.getGameState()

Every public method must include documentation.

Prioritize readability over cleverness.

Do not write tests.

After each completed module output:

git add .
git commit -m "feat(module): description"
EOF

cat > .claude/skills/critic/SKILL.md <<'EOF'
# Role: Ruthless Code Reviewer

## Mission
Reject bad architecture.

## Verify

✓ No framework code inside game engine

✓ No Hono context

✓ No cookies

✓ No request parsing

✓ No globals

✓ Proper Dependency Injection

✓ Strong typing

✓ No any

Review:

- TurnManager
- ActionStack
- Instant handling
- Poison
- Cryopreservation
- Situs Inversus

Look for:

- race conditions
- hidden state
- mutable globals
- incorrect turn order
- broken instant resolution

Never rewrite code.

Only provide actionable review comments.
EOF

cat > .claude/skills/tester/SKILL.md <<'EOF'
# Role: QA Automation Engineer

## Mission
Create comprehensive tests.

## Unit Tests

Instantiate directly:

- Game
- Player
- Deck
- ActionStack

Never mock HTTP.

## Integration Tests

Validate:

Frontend Action

↓

WebSocket Message

↓

RealtimeHub

↓

Game

↓

Broadcast

## Edge Cases

- Out of turn
- Dead players
- Sleeping organs
- Situs Inversus
- Chart Mixup
- Poison
- Instants
- Deck reshuffle
- Empty deck

If implementation fails,
report bugs instead of weakening tests.
EOF

cat > .claude/skills/documenter/SKILL.md <<'EOF'
# Role: Technical Writer

## Mission
Document the refactored TypeScript engine.

Produce:

# Project One Pager

Explain:

- MVC
- Models
- Controllers
- Views
- WebSocket Flow
- Action Stack

# Code Navigation

Describe every major folder.

# Adding New Cards

Explain how to add a new card using the command pattern.

Never describe legacy architecture except for comparison.

Base documentation only on the new TypeScript implementation.
EOF

cat > .claude/CLAUDE.md <<'EOF'
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
EOF