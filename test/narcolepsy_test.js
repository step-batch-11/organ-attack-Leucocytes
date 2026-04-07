import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { Game } from "../src/models/game.js";
import { Player } from "../src/models/player.js";
import { TurnManager } from "../src/models/turn_manager.js";
import { createApp } from "../src/app.js";
import { counter } from "../src/utils.js";
import { Deck } from "../src/models/deck.js";
import { AfflictionHandler } from "../src/models/affliction_handler.js";
import { Dealer } from "../src/models/dealer.js";
import { Organ } from "../src/models/organ.js";

describe("Narcolepsy Instant Card Full Test", () => {
  it("should correctly handle instant narcolepsy in-turn, out-of-turn, stacking, and sleep lifecycle", async () => {
    const shuffle = (x) => x;

    const attackCards = new Deck([
      { id: 1, action: "narcolepsy", type: "tactical", afflictableOrgans: [] },
      { id: 2, action: "narcolepsy", type: "tactical", afflictableOrgans: [] },
    ], shuffle);

    const organCards = new Deck([new Organ("Heart", 1, 1)], shuffle);

    const players = [new Player("p1", 1), new Player("p2", 2)];

    const wildOrgan = new Organ("Wild", 1, 2);
    players[0].fillHandWithOrgans([wildOrgan]);

    players.forEach((player) => {
      if (!player.holdsWild()) {
        player.fillHandWithOrgans([new Organ("Heart", 1, 1)]);
      }
      player.fillHandWithAttacks([
        { id: 1, action: "narcolepsy", afflictableOrgans: [] },
        { id: 2, action: "narcolepsy", afflictableOrgans: [] },
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

    const firstPlayerIndex = game.setFirstPlayer();
    assertEquals(firstPlayerIndex, 0);
    assertEquals(game.getCurrentPlayerID(), 1);

    const rooms = { 101: players };
    const games = { 101: game };

    const app = createApp(
      {
        session: { "1": "p1" },
        idGenerator: counter(),
        playerIDGenerator: counter(),
        roomIDGenerator: counter(),
        rooms,
        shuffle,
        games,
      },
      () => (_, next) => next(),
    );

    const opponent = players.find((p) => p.getID() === 2);

    let res = await app.request("/attack", {
      method: "post",
      body: JSON.stringify({
        attackerID: 1,
        opponentID: 2,
        attackCardID: 1,
        organCardID: 1,
        isInstant: true,
      }),
      headers: { cookie: "roomID=101" },
    });

    let { success } = await res.json();
    assertEquals(success, true);
    assertEquals(opponent.sleepCount, 0);

    res = await app.request("/attack", {
      method: "post",
      body: JSON.stringify({
        attackerID: 1,
        opponentID: 2,
        attackCardID: 2,
        organCardID: 1,
        isInstant: true,
      }),
      headers: { cookie: "roomID=101" },
    });

    ({ success } = await res.json());
    assertEquals(success, true);
    assertEquals(opponent.sleepCount, 0);

    game.passTurn();
    assertEquals(game.getCurrentPlayerID(), 2);

    res = await app.request("/attack", {
      method: "post",
      body: JSON.stringify({
        attackerID: 1,
        opponentID: 2,
        attackCardID: 1,
        organCardID: 1,
        isInstant: true,
      }),
      headers: { cookie: "roomID=101" },
    });

    ({ success } = await res.json());
    assertEquals(success, true);
    assertEquals(opponent.sleepCount, 0);
  });
});

describe("Narcolepsy Instant Card Test", () => {
  it("should put target opponent to sleep for 1 turn, handle in-turn/out-of-turn, stack instants, and decrement sleep correctly", async () => {
    const shuffle = (x) => x;

    const attackCards = new Deck([
      { id: 1, action: "narcolepsy", type: "tactical", afflictableOrgans: [] },
      { id: 2, action: "narcolepsy", type: "tactical", afflictableOrgans: [] },
    ], shuffle);

    const organCards = new Deck([new Organ("Heart", 1, 1)], shuffle);

    const players = [
      new Player("p1", 1),
      new Player("p2", 2),
      new Player("p3", 3),
    ];

    players[0].fillHandWithOrgans([new Organ("Wild", 999, 1)]);
    players.slice(1).forEach((p) =>
      p.fillHandWithOrgans([new Organ("Heart", p.getID(), 1)])
    );

    players.forEach((player) => {
      player.fillHandWithAttacks([
        { id: 1, action: "narcolepsy", afflictableOrgans: [] },
        { id: 2, action: "narcolepsy", afflictableOrgans: [] },
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
    assertEquals(game.getCurrentPlayerID(), 1);

    const rooms = { 101: players };
    const games = { 101: game };

    const app = createApp(
      {
        session: { "1": "p1" },
        idGenerator: counter(),
        playerIDGenerator: counter(),
        roomIDGenerator: counter(),
        rooms,
        shuffle,
        games,
      },
      () => (_, next) => next(),
    );

    const attacker = players[0];
    const target = players[1];
    const other = players[2];

    let res = await app.request("/attack", {
      method: "post",
      body: JSON.stringify({
        attackerID: attacker.getID(),
        opponentID: target.getID(),
        attackCardID: 1,
        organCardID: 1,
        isInstant: true,
      }),
      headers: { cookie: "roomID=101" },
    });
    let { success } = await res.json();
    assertEquals(success, true);

    assertEquals(attacker.sleepCount, 0);
    assertEquals(target.sleepCount, 0);
    assertEquals(other.sleepCount, 0);

    res = await app.request("/attack", {
      method: "post",
      body: JSON.stringify({
        attackerID: attacker.getID(),
        opponentID: target.getID(),
        attackCardID: 2,
        organCardID: 1,
        isInstant: true,
      }),
      headers: { cookie: "roomID=101" },
    });
    ({ success } = await res.json());
    assertEquals(success, true);

    assertEquals(target.sleepCount, 1);

    game.passTurn();
    assertEquals(target.sleepCount, 0);
  });
});
