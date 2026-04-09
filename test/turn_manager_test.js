import { assertEquals } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { TurnManager } from "../src/models/turn_manager.js";

describe("tests for turn manager", () => {
  let playerTemplate;

  beforeEach(() => {
    playerTemplate = {
      sleepCount: 0,
      decreaseSleep() {
        this.sleepCount -= 1;
      },
      isSleeping() {
        return this.sleepCount > 0;
      },
      isAlive() {
        return true;
      },
    };
  });

  it("should return the turn to immediate next player since no one is sleeping", () => {
    const players = [{ ...playerTemplate }, { ...playerTemplate }];
    const turnManager = new TurnManager(players, 1);

    assertEquals(turnManager.passTurn(), 0);
  });

  it("should skip the sleeping player and pass on.", () => {
    const players = [
      { ...playerTemplate },
      { ...playerTemplate, sleepCount: 1 },
    ];

    const turnManager = new TurnManager(players, 0);

    assertEquals(turnManager.passTurn(), 0);
  });

  it("should skip the sleeping player and pass on a single player.", () => {
    const players = [
      { ...playerTemplate },
      { ...playerTemplate, sleepCount: 1 },
      { ...playerTemplate },
    ];

    const turnManager = new TurnManager(players, 0);

    assertEquals(turnManager.passTurn(), 2);
  });

  it("should skip the sleeping player and pass on many players.", () => {
    const players = [
      { ...playerTemplate },
      { ...playerTemplate, sleepCount: 1 },
      { ...playerTemplate, sleepCount: 1 },
      { ...playerTemplate, sleepCount: 1 },
      { ...playerTemplate, sleepCount: 1 },
      { ...playerTemplate },
    ];

    const turnManager = new TurnManager(players, 0);

    assertEquals(turnManager.passTurn(), 5);
  });

  it("should skip the sleeping players and pass on many players and loop back to me", () => {
    const players = [
      { ...playerTemplate },
      { ...playerTemplate, sleepCount: 1 },
      { ...playerTemplate, sleepCount: 1 },
      { ...playerTemplate, sleepCount: 1 },
      { ...playerTemplate, sleepCount: 1 },
    ];

    const turnManager = new TurnManager(players, 0);

    assertEquals(turnManager.passTurn(), 0);
  });
  it("should skip the sleeping players twice and pass on all players and loop back to me", () => {
    const players = [
      { ...playerTemplate },
      { ...playerTemplate, sleepCount: 2 },
      { ...playerTemplate, sleepCount: 2 },
      { ...playerTemplate, sleepCount: 2 },
      { ...playerTemplate, sleepCount: 2 },
    ];

    const turnManager = new TurnManager(players, 0);

    assertEquals(turnManager.passTurn(), 0);
  });
  it("should skip the sleeping players twice and pass on all players and loop back to me", () => {
    const players = [
      { ...playerTemplate },
      { ...playerTemplate, sleepCount: 2 },
      { ...playerTemplate, sleepCount: 2 },
      { ...playerTemplate, sleepCount: 0 },
      { ...playerTemplate, sleepCount: 2 },
    ];

    const turnManager = new TurnManager(players, 0);

    assertEquals(turnManager.passTurn(), 3);
  });
});
