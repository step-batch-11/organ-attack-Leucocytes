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

Game actions dispatch through a single WebSocket path — one inbound event type
per request, resolved through `ActionStack`/`ActionController`, broadcast via
`RealtimeHub`. The legacy dual-endpoint split (`/action` + `/attack` + `/audit`)
has already been retired; never reintroduce an HTTP handler/route for a game
action, and never add a second dispatch path alongside
`src/ws_request_handlers.ts`.

Every in-game HTTP endpoint (action submission,
opponent-hand/discard-pile/game-state reads, card removal) is WS-only; auth and
pre-game room lifecycle (login, create/join/leave room, `/setup-game`) stay
HTTP. Fold read-only _shared_ query data (e.g. the discard pile) into the
existing personalized `game-state` push payload rather than adding a separate
endpoint or message; data that's private to one interaction (e.g. an opponent's
revealed hand) is its own targeted WS request/response instead. Give every
client→server WS message a `requestId` and echo it back in the
`request-ack`/`request-error` the server sends for it, sent only to the
originating socket. If a new endpoint/handler is ever left with zero remaining
callers, delete it rather than leaving dead code.

If implementing this as designed would require overriding or narrowing something
the approved architecture doc already decided, stop and ask — don't quietly
implement a smaller version and note the gap as a comment.

Generate client state exclusively from:

Game.getGameState()

When touching frontend code (`public/`), move logic into a Model-View-Controller
split: network/ WebSocket-event handling stays out of DOM-rendering code, and
DOM-rendering code stays out of game state. Preserve existing UI behavior (e.g.
`animateFromDeck` and other animations) unless the task is explicitly to change
it.

Prioritize readability over cleverness.

Do not write tests.

After each completed module output:

git add . git commit -m "feat(module): description"
