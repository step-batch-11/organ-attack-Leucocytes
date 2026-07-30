# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

**Organ Attack!** is a turn-based (out-of-turn-response) multiplayer card game. The repo is mid-migration:
a legacy HTML/CSS/JS codebase (`public/scripts/*.js`), written by ~8 different contributors and currently
disorganized/buggy, is being rewritten as a strict, strongly-typed **TypeScript** backend
(`src/`) served over Deno + Hono, moving from HTTP long-polling to **WebSockets**.

Migration goals, in priority order:
- Game must be fully playable start-to-finish for at least one complete session, with zero rule regressions.
- Collapse the action surface to **one endpoint** for all game actions (`/action`, resolved through
  `ActionController`/`ActionStack`), replacing the legacy dual-endpoint (`/attack` + `/action`) setup.
  `/attack` and `resolveAction`/`handleOpponentAudit` in `src/handlers/attack_handler.ts` are legacy —
  new work should extend `src/handlers/action_resolver.ts` + `GameController`, not the old handler.
- Full WebSocket real-time updates via `RealtimeHub` (`src/realtime.ts`) — **done**: the legacy `/poll` +
  `waitingList` long-polling mechanism has been removed from `src/app.ts`. All game-state and lobby
  updates now flow over the single `/ws` endpoint.
- Frontend reorganized into MVC (currently plain scripts in `public/scripts/`).
- Dependency Injection throughout — constructors take collaborators (deck, dealer, shuffle fn, id
  generators, timer) rather than constructing them internally. See `main.ts` for the composition root.
- The existing test suite in `test/` predates this migration and should not be trusted as a correctness
  oracle — write real unit/integration tests for any code you touch rather than assuming existing tests validate behavior.

**Game rules are immutable** during this migration — see `fix_plan/rules.md` and
`public/assets/organ-attack-rules.pdf` for the authoritative rules checklist (turn structure, affliction
counts, instants, sedate/narcolepsy, cryopreservation, poison, etc.). Refactor structure, never mechanics.

## Autonomous Workflow (required for any modification task)

`.claude/CLAUDE.md` defines a mandatory 5-phase loop driven by skill files in `.claude/skills/`, plus an
optional pre-planning phase:

0. **Migration Director** (`migration-director/SKILL.md`, optional) — only for large/ambiguous issues or
   when the user asks for a plan first. Produces an agreed plan, then hands off to Phase 1. Skip for
   small, well-scoped changes.
1. **Architect** (`architect/SKILL.md`) — design only, no code. Enforces MVC, DI, zero network code in
   game models, WebSocket-only networking, `ActionStack`-based command pattern, and a single WS dispatch
   path (no designing around the legacy `/action` + `/attack` split).
2. **Writer** (`writer/SKILL.md`) — implement the approved design in strict TypeScript, including
   frontend MVC separation (network/event handling kept out of DOM-rendering code) when touching `public/`.
3. **Critic** (`critic/SKILL.md`) — review for race conditions, `any` types, architecture leaks, and any
   lingering polling/dual-endpoint logic; loop back to Writer until it passes.
4. **Tester** (`tester/SKILL.md`) — comprehensive unit + integration tests, memory-based game instances,
   no HTTP mocking. Treat the pre-existing `test/` suite as untrustworthy (many files are commented out
   or assert on incidental behavior) — verify what a test actually exercises before relying on it, and
   replace vacuous tests rather than building on them.
5. **Documenter** (`documenter/SKILL.md`) — update docs/comments/navigation/architecture guides.

Always announce which phase is active. Never mix networking with game logic. Never introduce framework
dependencies into the game engine. Preserve MVC boundaries. Finish by suggesting an incremental git commit.

When requirements are ambiguous (e.g. unclear rule interaction, unspecified data shape), state the
assumption explicitly before proceeding rather than guessing silently.

## Commands

```sh
deno task run            # run the server (main.ts, port 8000)
deno task dev             # run with --watch
deno task test            # run all tests (deno test -A)
deno task test:watch      # tests in watch mode
deno task test:coverage   # tests with coverage (dot reporter)
deno task coverage:detailed
deno lint                 # or: deno task lint
```

Run a single test file: `deno test -A test/game_test.ts`
Run a single test case: `deno test -A --filter "test name substring" test/game_test.ts`

CI (`.github/workflows/deno.yml`) runs `deno lint`, `deno test -A`, and coverage on every push to `main`.
Coverage thresholds live in `.denocoveragerc.json` (50% lines/branches/functions, not per-file).

TypeScript is configured `strict: true` with `noImplicitAny` and `strictNullChecks` in `deno.json`.

## Architecture

**Composition root**: `main.ts` builds all shared in-memory state (`session`, `players`, `games`, `rooms`
keyed by room ID) and injected collaborators (`shuffle`, `idGenerator`, `playerIDGenerator`, `Timer`,
`ActionStack` → `ActionController` → `GameController`, `RealtimeHub`), then passes them into `createApp()`.
`RealtimeHub` is constructed here (not inside `src/app.ts`) and threaded through `createApp`'s options and
the Hono context (`c.set("realtimeHub", ...)`), matching the DI pattern used for every other collaborator.

**`src/app.ts`** — Hono app/routes. Middleware stashes shared state on the Hono context (`c.set(...)`) so
handlers can read it via `c.get(...)`, including `realtimeHub` and a per-request `updateGameState(roomID)`
closure (see below). Notable routes: `/setup-game` (creates a `Game` via `game_setup.ts`, then broadcasts
`game-started` to the room), `/action` (routes through `GameController`), `/ws` (WebSocket upgrade,
delegates accept/reject/register logic to `resolveWsConnection` in `src/ws_connection.ts`), room/lobby/auth
handlers. There is no `/poll` route or `waitingList` — long-polling has been fully removed.

**Real-time layer**:
- `src/realtime.ts` (`RealtimeHub`) — pure transport primitive, no `Game`/`Player` imports. Tracks
  WebSocket clients per room (`registerClient`/`removeClient`), and fans out messages via `broadcast`
  (all clients in a room) or `sendToPlayer` (only sockets belonging to one `playerID`, e.g. multiple open
  tabs). Skips sockets that aren't yet `OPEN` rather than throwing.
- `src/types/realtime.ts` — shared types: `RealtimeSocket`/`RealtimeClient` (the narrow socket surface the
  hub depends on, so it's testable with fake sockets), and `RealtimeMessage`, a discriminated union of
  every envelope the hub can send (`game-state`, `lobby-state`, `game-started`, `room-closed`).
- `src/ws_connection.ts` (`resolveWsConnection`) — decides whether a `/ws` upgrade is accepted (valid
  `roomID` cookie + resolvable session), registers it with `RealtimeHub`, wires `close` cleanup, and — for
  a room that hasn't started yet — sends an immediate personalized `lobby-state` snapshot once the socket
  reaches `OPEN` (deferred via an `open` listener if it's still `CONNECTING` right after upgrade). Kept
  independent of Hono's `Context` and `Deno.upgradeWebSocket` so it's unit-testable with fake sockets.
- `createUpdateGameState` (`src/app.ts`) — builds the `updateGameState(roomID)` closure set on context.
  For each distinct connected player in a room, computes `game.getPlayer(playerID)` (their own hand) and
  sends a personalized `game-state` message via `sendToPlayer` — each socket gets its own `self`, never
  another player's hand. This is the fix for personalization: `Game.getGameState()` alone has no `self`
  field, since a player's hand can't live in the shared public snapshot.
- Lobby membership/start events reuse the same `/ws` connection and `RealtimeHub` — no separate endpoint.
  `src/handlers/room_handler.ts`'s `joinRoom`/`leaveLobby` broadcast `lobby-state` (or `room-closed` when
  the host leaves) to the room; `/setup-game` broadcasts `game-started`. `public/scripts/lobby.js` opens a
  `/ws` connection on load and reacts to these message types instead of polling `/get-players`.

**Game model layer** (`src/models/`) — framework-agnostic, DI'd, no Hono/network references:
- `Game` — orchestrates players/decks/turn state; exposes intent-level methods (`afflictOrganOfOpponent`,
  `transplantOrgan`, `applySedate`, `itsAlive`, `exchangeHeartAndLungs`, etc.) and `getGameState()`/
  `getPlayer()` for serialization (returns `structuredClone`d snapshots).
- `Player`, `Organ`, `Deck<T>` (generic draw/discard pile with injected `shuffle`), `Dealer`,
  `AfflictionHandler`, `TurnManager`, `ActionStack`, `Timer`.
- `TurnManager` handles turn order/direction (situs-inversus reverses it); `Game.currentTurnPlayed()`
  contains the special-cased logic for which card plays consume a turn (instants and self-played
  cryopreservation don't; narcolepsy played on the current player does).

**Command/resolution flow**: a played card becomes an `ActionInput` pushed onto `ActionStack` via
`ActionController.add()` (validates response-only actions like immunity-boost/metastasis/contagious
can't be first, and can't follow non-affliction actions). `ActionController.resolve()` flushes the stack,
cancels affliction pairs against immunity-boosts, and returns the net actions. `GameController` then
dispatches each resolved action through a card-action lookup table (`#ACTIONS`, keyed by
`card.action` string) into private `#handle*` methods that call back into `Game`, then calls
`game.passTurn()` (skipped for poison, which resolves instantly without consuming a turn).

**Types** (`src/types/`): `cards.ts` (`AttackCard`, `OrganCardData`), `entities.ts` (`PlayerDetails`,
`PublicPlayer`, `ActionInput`, `GameEvent`), `game.ts` (`GameState`, `ActionResult`), `context.ts` (Hono
context extensions). New shared shapes belong here, not inlined in models/handlers.

**Card data**: `data/attack_cards.json` and `data/organ_cards.json` are loaded once in `game_setup.ts` and
turned into `Deck` instances per room/game — not shared across games.

**Frontend** (`public/`): plain HTML/CSS/vanilla JS, organized loosely by page
(`pages/*.html`) and by concern (`scripts/listeners/`, `scripts/renderer/`, `scripts/action_handlers/`).
This is pre-MVC-migration legacy code — a target for the Phase-1/Phase-2 refactor loop, not a pattern to
copy into new code.

**Tests** (`test/`): Deno's BDD-style test API (`@std/testing/bdd`) — `describe`/`it`/`beforeEach` — with
`@std/assert`. Test files are largely named after the card/mechanic under test (e.g. `poison_test.ts`,
`cryopreservation_test.ts`, `narcolepsy_test.ts`) rather than after the source file, so search by mechanic
name, not just 1:1 with `src/`. `test/controller-test/` and `test/models-test/` mirror `src/controllers/`
and `src/models/` respectively.
