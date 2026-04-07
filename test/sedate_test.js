import { Game } from "../src/models/game.js";
import { Player } from "../src/models/player.js";
import { TurnManager } from "../src/models/turn_manager.js";
import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { createApp } from "../src/app.js";
import { counter } from "../src/utils.js";
import { Deck } from "../src/models/deck.js";
import { AfflictionHandler } from "../src/models/affliction_handler.js";
import { Dealer } from "../src/models/dealer.js";
import { Organ } from "../src/models/organ.js";

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

  describe("Testing Sedate", () => {
    it("should apply sedate and make opponent sleep for 2 turns", async () => {
      const shuffle = (x) => x;

      // Sedate attack cards
      const attackCards = new Deck(
        [
          {
            id: 1,
            action: "sedate",
            type: "tactical",
            afflictableOrgans: [],
          },
        ],
        shuffle,
      );

      const organCards = new Deck(
        [new Organ("Heart", 1, 1)],
        shuffle,
      );

      const players = [
        new Player("p1", 1),
        new Player("p2", 2),
      ];

      // Give players required cards
      players.forEach((player) => {
        player.fillHandWithOrgans([new Organ("Heart", 1, 1)]);
        player.fillHandWithAttacks([
          {
            id: 1,
            action: "sedate",
            afflictableOrgans: [],
          },
        ]);
      });

      const dealer = new Dealer(attackCards, organCards, players);
      const afflictionHandler = new AfflictionHandler(attackCards, organCards);
      const turnManager = new TurnManager(players, 1);

      const game = new Game(
        players,
        attackCards,
        organCards,
        dealer,
        afflictionHandler,
        turnManager,
      );

      game.setFirstPlayer();

      const rooms = { 101: players };
      const games = { 101: game };

      const app = createApp({
        session: { "1": "p1" },
        idGenerator: counter(),
        playerIDGenerator: counter(),
        roomIDGenerator: counter(),
        rooms,
        shuffle,
        games,
      }, () => (_, next) => next());

      const res = await app.request("/attack", {
        method: "post",
        body: JSON.stringify({
          attackerID: 1,
          opponentID: 2,
          attackCardID: 1,
          organCardID: 1,
          isInstant: false,
        }),
        headers: { cookie: "roomID=101" },
      });

      assertEquals(res.status, 200);

      const { success } = await res.json();
      assertEquals(success, true);

      const opponent = players.find((p) => p.getID() === 2);
      assertEquals(opponent.sleepCount, 2);
    });

    it("should apply sedate, decrement sleep over turns, and wake up correctly", async () => {
      const shuffle = (x) => x;

      const attackCards = new Deck(
        [{
          id: 1,
          action: "sedate",
          type: "tactical",
          afflictableOrgans: [],
        }],
        shuffle,
      );

      const organCards = new Deck(
        [new Organ("Heart", 1, 1)],
        shuffle,
      );

      const players = [
        new Player("p1", 1),
        new Player("p2", 2),
      ];

      players.forEach((player) => {
        player.fillHandWithOrgans([new Organ("Heart", 1, 1)]);
        player.fillHandWithAttacks([{
          id: 1,
          action: "sedate",
          afflictableOrgans: [],
        }]);
      });

      const dealer = new Dealer(attackCards, organCards, players);
      const afflictionHandler = new AfflictionHandler(attackCards, organCards);
      const turnManager = new TurnManager(players, 1);

      const game = new Game(
        players,
        attackCards,
        organCards,
        dealer,
        afflictionHandler,
        turnManager,
      );

      game.setFirstPlayer();

      const rooms = { 101: players };
      const games = { 101: game };

      const app = createApp({
        session: { "1": "p1" },
        idGenerator: counter(),
        playerIDGenerator: counter(),
        roomIDGenerator: counter(),
        rooms,
        shuffle,
        games,
      }, () => (_, next) => next());

      // Apply Sedate
      const res = await app.request("/attack", {
        method: "post",
        body: JSON.stringify({
          attackerID: 1,
          opponentID: 2,
          attackCardID: 1,
          organCardID: 1,
          isInstant: false,
        }),
        headers: { cookie: "roomID=101" },
      });

      const { success } = await res.json();
      assertEquals(success, true);

      const opponent = players.find((p) => p.getID() === 2);

      // Initial sleep
      assertEquals(opponent.sleepCount, 2);

      // After 1st turn
      game.passTurn();
      assertEquals(opponent.sleepCount, 1);

      // After 2nd turn (wake up)
      game.passTurn();
      assertEquals(opponent.sleepCount, 0);
    });
  });
});
