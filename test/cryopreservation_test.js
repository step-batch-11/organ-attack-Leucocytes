import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { createApp } from "../src/app.js";
import { counter } from "../src/utils.js";
import { Game } from "../src/models/game.js";
import { Player } from "../src/models/player.js";
import { Deck } from "../src/models/deck.js";
import { AfflictionHandler } from "../src/models/affliction_handler.js";
import { Dealer } from "../src/models/dealer.js";
import { Organ } from "../src/models/organ.js";
import { TurnManager } from "../src/models/turn_manager.js";

describe("Cryopreservation Card Test", () => {
  it("should put all opponents to sleep for 2 turns and decrement sleep over turns", async () => {
    const shuffle = (x) => x;

    const attackCards = new Deck([
      {
        id: 1,
        action: "cryopreservation",
        type: "tactical",
        afflictableOrgans: [],
      },
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
        { id: 1, action: "cryopreservation", afflictableOrgans: [] },
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

    const res = await app.request("/attack", {
      method: "post",
      body: JSON.stringify({
        attackerID: 1,
        attackCardID: 1,
        organCardID: 1,
        isInstant: true,
      }),
      headers: { cookie: "roomID=101" },
    });

    const { success } = await res.json();
    assertEquals(success, true);

    assertEquals(players[0].sleepCount, 0);
    assertEquals(players[1].sleepCount, 2);
    assertEquals(players[2].sleepCount, 2);

    game.passTurn();
    assertEquals(players[0].sleepCount, 0);
    assertEquals(players[1].sleepCount, 1);
    assertEquals(players[2].sleepCount, 1);

    game.passTurn();
    assertEquals(players[0].sleepCount, 0);
    assertEquals(players[1].sleepCount, 0);
    assertEquals(players[2].sleepCount, 0);
  });
});















describe("Cryopreservation Instant Card Test", () => {
  it("should put all opponents to sleep, handle in-turn/out-of-turn, stack instants, and decrement sleep correctly", async () => {
    const shuffle = (x) => x;

    
    const attackCards = new Deck([
      { id: 1, action: "cryopreservation", type: "tactical", afflictableOrgans: [] },
      { id: 2, action: "cryopreservation", type: "tactical", afflictableOrgans: [] }
    ], shuffle);

    
    const organCards = new Deck([new Organ("Heart", 1, 1)], shuffle);

    
    const players = [new Player("p1", 1), new Player("p2", 2), new Player("p3", 3)];

    
    players[0].fillHandWithOrgans([new Organ("Wild", 999, 1)]);
    players.slice(1).forEach(p => p.fillHandWithOrgans([new Organ("Heart", p.getID(), 1)]));

    
    players.forEach(player => {
      player.fillHandWithAttacks([
        { id: 1, action: "cryopreservation", afflictableOrgans: [] },
        { id: 2, action: "cryopreservation", afflictableOrgans: [] }
      ]);
    });

    const dealer = new Dealer(attackCards, organCards, players);
    const afflictionHandler = new AfflictionHandler(attackCards, organCards);
    const turnManager = new TurnManager(players, 1);

    const game = new Game(players, attackCards, organCards, dealer, afflictionHandler, turnManager);

    
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
        games
      },
      () => (_, next) => next()
    );

    

    const attacker = players[0];
    const opponent1 = players[1];
    const opponent2 = players[2];

    
    let res = await app.request("/attack", {
      method: "post",
      body: JSON.stringify({
        attackerID: attacker.getID(),
        attackCardID: 1,
        organCardID: 1,
        isInstant: true
      }),
      headers: { cookie: "roomID=101" }
    });
    let { success } = await res.json();
    assertEquals(success, true);

    
    assertEquals(attacker.sleepCount, 0); 
    assertEquals(opponent1.sleepCount, 2);
    assertEquals(opponent2.sleepCount, 2);

    
    res = await app.request("/attack", {
      method: "post",
      body: JSON.stringify({
        attackerID: attacker.getID(),
        attackCardID: 2,
        organCardID: 1,
        isInstant: true
      }),
      headers: { cookie: "roomID=101" }
    });
    ({ success } = await res.json());
    assertEquals(success, true);

    
    assertEquals(opponent1.sleepCount, 4);
    assertEquals(opponent2.sleepCount, 4);

    
    game.passTurn(); 
    assertEquals(opponent1.sleepCount, 3);
    assertEquals(opponent2.sleepCount, 3);

    game.passTurn(); 
    assertEquals(opponent1.sleepCount, 2);
    assertEquals(opponent2.sleepCount, 2);

    game.passTurn(); 
    assertEquals(opponent1.sleepCount, 1);
    assertEquals(opponent2.sleepCount, 1);

    game.passTurn(); 
    assertEquals(opponent1.sleepCount, 0);
    assertEquals(opponent2.sleepCount, 0);
  });
});