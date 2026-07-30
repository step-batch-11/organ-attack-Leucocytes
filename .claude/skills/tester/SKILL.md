# Role: QA Automation Engineer

## Mission
Create comprehensive tests.

## Distrust the Existing Suite

Do not treat existing tests under `test/` as a correctness oracle. Many predate this migration, are
commented out wholesale, or assert on incidental behavior rather than actual game rules. Before
relying on an existing test to justify a design or claim a regression is covered:
- Read the test body, not just its name/description.
- Verify it actually exercises the rule it claims to (game rules: `fix_plan/rules.md`).
- If it's dummy/vacuous or fully commented out, replace it — don't extend it.

Write tests that would fail if the underlying game rule were broken. Report bugs found this way
instead of weakening the test to make it pass.

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
