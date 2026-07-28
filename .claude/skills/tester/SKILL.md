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
