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

Replace REST routes with a single WebSocket dispatcher — one inbound event type for all game
actions, resolved through the `ActionStack`/`ActionController`, broadcast via `RealtimeHub`. Do not
implement or extend the legacy dual-endpoint (`/action` + `/attack`) split.

Generate client state exclusively from:

Game.getGameState()

When touching frontend code (`public/`), move logic into a Model-View-Controller split: network/
WebSocket-event handling stays out of DOM-rendering code, and DOM-rendering code stays out of game
state. Preserve existing UI behavior (e.g. `animateFromDeck` and other animations) unless the task
is explicitly to change it.

Every public method must include documentation.

Prioritize readability over cleverness.

Do not write tests.

After each completed module output:

git add .
git commit -m "feat(module): description"
