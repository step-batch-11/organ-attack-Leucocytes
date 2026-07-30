# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

**Organ Attack!** is a turn-based (out-of-turn-response) multiplayer card game. The repo is mid-migration:
a legacy HTML/CSS/JS codebase (`public/scripts/*.js`), written by ~8 different contributors and currently
disorganized/buggy, is being rewritten as a strict, strongly-typed **TypeScript** backend
(`src/`) served over Deno + Hono, moving from HTTP long-polling to **WebSockets**.

Migration goals, in priority order:

- Game must be fully playable start-to-finish for at least one complete session, with zero rule regressions.
- Collapse the action surface to **one dispatch path** for all game actions, resolved through
  `ActionController`/`ActionStack` via `GameController` — **done**: there is no HTTP action surface left
  at all. The legacy dual-endpoint setup (`/attack`+`/audit` in the now-deleted `src/handlers/
  attack_handler.ts`/`card_action_handler.ts`) and the original HTTP `/action` route are both gone.
  Every game action (`/action`, `/attack`, `/audit`, `/opponent-hands`, `/discard-pile`, `/game-state`,
  `/remove-card`) is now a WebSocket request dispatched over `/ws` — see **Real-time layer** below. New
  work should extend `src/ws_request_handlers.ts` + `GameController`, never add an HTTP route for a
  game action.
- Full WebSocket real-time updates via `RealtimeHub` (`src/realtime.ts`) — **done**: the legacy `/poll` +
  `waitingList` long-polling mechanism has been removed from `src/app.ts`. All game-state and lobby
  updates flow over the single `/ws` endpoint, and — as of the action-dispatch migration above — so does
  every client→server game command. The only HTTP endpoints left are auth (`/login`, `/logout`) and
  pre-game room lifecycle (`/create-room`, `/join-room`, `/leave-lobby`, `/setup-game`), plus static
  page/asset serving.
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
   game models, WebSocket-only networking, `ActionStack`-based command pattern, and the single WS
   dispatch path (`src/ws_request_handlers.ts`) — no HTTP endpoint for a game action, ever.
2. **Writer** (`writer/SKILL.md`) — implement the approved design in strict TypeScript, including
   frontend MVC separation (network/event handling kept out of DOM-rendering code) when touching `public/`.
3. **Critic** (`critic/SKILL.md`) — review for race conditions, `any` types, architecture leaks, and any
   lingering polling/dual-endpoint logic; loop back to Writer until it passes.
4. **Tester** (`tester/SKILL.md`) — comprehensive unit + integration tests, memory-based game instances,
   no HTTP mocking. Treat the pre-existing `test/` suite as untrustworthy (many files are commented out
   or assert on incidental behavior) — verify what a test actually exercises before relying on it, and
   replace vacuous tests rather than building on them.

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
`game-started` to the room), `/ws` (WebSocket upgrade, delegates accept/reject/register/request-dispatch
logic to `resolveWsConnection` in `src/ws_connection.ts`), plus auth and room/lobby handlers. There is no
`/poll` route, `waitingList`, or any HTTP route for a game action — all of that has been fully removed.

**Real-time layer**:

- `src/realtime.ts` (`RealtimeHub`) — pure transport primitive, no `Game`/`Player` imports. Tracks
  WebSocket clients per room (`registerClient`/`removeClient`), and fans out messages via `broadcast`
  (all clients in a room) or `sendToPlayer` (only sockets belonging to one `playerID`, e.g. multiple open
  tabs). Skips sockets that aren't yet `OPEN` rather than throwing.
- `src/types/realtime.ts` — shared types: `RealtimeSocket`/`RealtimeClient` (the narrow socket surface the
  hub depends on, so it's testable with fake sockets); `RealtimeMessage`, a discriminated union of every
  envelope the server can send (`game-state`, `lobby-state`, `game-started`, `room-closed`, `request-ack`,
  `request-error`); and `ClientRequest`/`RequestHandlers` for the reverse direction — every message a
  client sends carries a client-generated `requestId`, echoed back in the matching `request-ack`/
  `request-error` so the client can correlate a response to the request that triggered it.
- `src/ws_connection.ts` (`resolveWsConnection`) — decides whether a `/ws` upgrade is accepted (valid
  `roomID` cookie + resolvable session), registers it with `RealtimeHub`, wires `close` cleanup, and sends
  an immediate personalized snapshot once the socket reaches `OPEN` (deferred via an `open` listener if
  still `CONNECTING` right after upgrade) — `lobby-state` for a room that hasn't started, `game-state`
  otherwise (this is the only source of the *initial* game state now that there's no `/game-state` GET).
  Also wires a `message` listener that parses each `ClientRequest`, dispatches it to the matching handler
  in the injected `RequestHandlers` map, and replies with `request-ack`/`request-error` to the originating
  socket only — never broadcast. Kept independent of Hono's `Context` and `Deno.upgradeWebSocket` so it's
  unit-testable with fake sockets.
- `src/ws_request_handlers.ts` (`createRequestHandlers`) — builds the `RequestHandlers` map dispatched by
  `resolveWsConnection`: `"action"` reuses `action_resolver.ts`'s `handleAction` (the WS entry point that
  replaced the old `/action`/`/attack`/`/audit` HTTP handlers); `"remove-card"`, `"query-opponent-hand"`,
  and `"audit-discard"` call `Game.discardAttackCard`/`Game.getPlayer`/`Game.audit` directly — these three
  are simple request/response queries or mutations, not routed through `ActionStack` (unlike a played
  card, they don't represent a card being resolved).
- `createUpdateGameState`/`createSendGameStateSnapshot` (`src/app.ts`) — share a `buildGameStateSnapshot`
  helper that computes one player's personalized payload: the public `game.getGameState()` snapshot, the
  shared `discardPile` (`game.getDiscardAttackCards()` — folded in here rather than served via its own
  endpoint), and that player's own hand via `game.getPlayer(playerID)`. `createUpdateGameState` broadcasts
  this to every distinct connected player in a room (used after any action mutates state);
  `createSendGameStateSnapshot` sends it to one socket (used by `resolveWsConnection` on connect). This is
  the fix for personalization: `Game.getGameState()` alone has no `self` field, since a player's hand
  can't live in the shared public snapshot.
- Lobby membership/start events reuse the same `/ws` connection and `RealtimeHub` — no separate endpoint.
  `src/handlers/room_handler.ts`'s `joinRoom`/`leaveLobby` broadcast `lobby-state` (or `room-closed` when
  the host leaves) to the room; `/setup-game` broadcasts `game-started`. `public/scripts/lobby.js` opens a
  `/ws` connection on load and reacts to these message types — there is no `/get-players` endpoint left.
- `public/scripts/network.js` — owns the game page's WebSocket connection (moved out of `game.js`) and
  exposes `sendRequest(type, payload): Promise` (generates a `requestId`, resolves/rejects when the
  matching `request-ack`/`request-error` arrives) and `onMessage(type, listener)` for the broadcast
  message types. Every frontend file that used to `fetch`/`postJSON` a game-action endpoint now calls
  `sendRequest`/`utils.js`'s `sendAction` (a thin wrapper that also drives the discard-to-pile animation)
  instead.

**Game model layer** (`src/models/`) — framework-agnostic, DI'd, no Hono/network references:

- `Game` — orchestrates players/decks/turn state; exposes intent-level methods (`afflictOrganOfOpponent`,
  `transplantOrgan`, `applySedate`, `itsAlive`, `exchangeHeartAndLungs`, etc.) and `getGameState()`/
  `getPlayer()` for serialization (returns `structuredClone`d snapshots).
- `Player`, `Organ`, `Deck<T>` (generic draw/discard pile with injected `shuffle`), `Dealer`,
  `AfflictionHandler`, `TurnManager`, `ActionStack`, `Timer`.
- `TurnManager` handles turn order/direction (situs-inversus reverses it); `Game.currentTurnPlayed()`
  contains the special-cased logic for which card plays consume a turn (instants and self-played
  cryopreservation don't; narcolepsy played on the current player does).

**Command/resolution flow**: a played card arrives as an `"action"` WS request (see Real-time layer
above) and becomes an `ActionInput` pushed onto `ActionStack` via `ActionController.add()` (validates
response-only actions like immunity-boost/metastasis/contagious can't be first, and can't follow
non-affliction actions). `GameController#playCard` also checks the card's `isBlockable` flag: a
non-blockable card (e.g. clinical-audit) skips the normal response-window wait by calling `Timer.end()`
immediately instead of waiting out the full duration. `ActionController.resolve()` flushes the stack,
cancels affliction pairs against immunity-boosts, and returns the net actions. `GameController` then
dispatches each resolved action through a card-action lookup table (`#ACTIONS`, keyed by the card's
`action` string — this key must match the card data exactly, e.g. `"cryopreservation"`, not a handler
method name) into private `#handle*` methods that call back into `Game`, then calls `game.passTurn()`
(skipped for poison, which resolves instantly without consuming a turn). Clinical-audit's own opponent-
hand reveal/discard is *not* driven through this table — it's the separate `"query-opponent-hand"`/
`"audit-discard"` WS requests described above, since picking a card from a revealed hand is an
interactive, per-opponent flow rather than a single card resolution.

**Types** (`src/types/`): `cards.ts` (`AttackCard`, `OrganCardData`), `entities.ts` (`PlayerDetails`,
`PublicPlayer`, `ActionInput`, `GameEvent`), `game.ts` (`GameState`, `ActionResult`), `context.ts` (Hono
context extensions). New shared shapes belong here, not inlined in models/handlers.

**Card data**: `data/attack_cards.json` and `data/organ_cards.json` are loaded once in `game_setup.ts` and
turned into `Deck` instances per room/game — not shared across games.

**Frontend** (`public/`): plain HTML/CSS/vanilla JS, organized loosely by page
(`pages/*.html`) and by concern (`scripts/listeners/`, `scripts/renderer/`, `scripts/action_handlers/`).
`scripts/network.js` is the one exception with a clear single responsibility — it owns the WebSocket
connection and the `sendRequest`/`onMessage` transport API — everything else is pre-MVC-migration legacy
code, a target for the Phase-1/Phase-2 refactor loop, not a pattern to copy into new code.

**Tests** (`test/`): Deno's BDD-style test API (`@std/testing/bdd`) — `describe`/`it`/`beforeEach` — with
`@std/assert`. The legacy per-mechanic/per-directory test files have been purged; the current suite is
flat (`test/*.ts`) and named after what it exercises — `game_controller_test.ts`, `ws_connection_test.ts`,
`game_state_personalization_test.ts`, `room_handler_lobby_broadcast_test.ts`. No HTTP mocking anywhere;
tests build real in-memory `Game`/`Player`/`GameController` instances or drive `resolveWsConnection`/
`RealtimeHub` with fake sockets.
