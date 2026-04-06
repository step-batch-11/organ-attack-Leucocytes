import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { Game } from "../src/models/game.js";
import { Player } from "../src/models/player.js";
import { TurnManager } from "../src/models/turn_manager.js";

describe("tests for sedate", () => {
  const p1 = new Player("user-1", 1, "non-host");
  it("player sleep count should be 2 when i apply sleep for a player", () => {
    p1.applySleep(2);
    assertEquals(p1.sleepCount, 2);
    p1.decreaseSleep();
    assertEquals(p1.sleepCount, 1);
    p1.decreaseSleep();
    assertEquals(p1.sleepCount, 0);
  });

  it("player should be sleep for 2 rounds when i sedate 1 time", () => {
    const players = [
      new Player("user-1", 1, "non-host"),
      new Player("user-2", 2, "non-host"),
    ];
    const playerToSedate = players.find((p) => p.getID() === 1);
    const turnManager = new TurnManager(players, 1);
    const game = new Game(players, [], [], {}, {}, turnManager);
    const sleepCount = game.applySedate(playerToSedate.getID());
    assertEquals(sleepCount, 2);
    game.passTurn();
    assertEquals(playerToSedate.sleepCount, 1);
    game.passTurn();
    assertEquals(playerToSedate.sleepCount, 0);
  });
});
