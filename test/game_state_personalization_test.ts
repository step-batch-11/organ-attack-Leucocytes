import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { createUpdateGameState } from "../src/app.ts";
import { RealtimeHub } from "../src/realtime.ts";
import { Game } from "../src/models/game.ts";
import { Player } from "../src/models/player.ts";
import { Organ } from "../src/models/organ.ts";
import { Deck } from "../src/models/deck.ts";
import { Dealer } from "../src/models/dealer.ts";
import { AfflictionHandler } from "../src/models/affliction_handler.ts";
import { TurnManager } from "../src/models/turn_manager.ts";

const shuffle = (cards) => cards;

const buildGame = () => {
  const chiru = new Player("chiru", 1);
  const kumar = new Player("kumar", 2);

  chiru.fillHandWithOrgans([new Organ("Heart", 1, 2)]);
  chiru.fillHandWithAttacks([
    { id: 101, action: "poison", type: "poison", afflictableOrgans: [], removableOrgans: [] },
  ]);

  kumar.fillHandWithOrgans([new Organ("Lungs", 2, 2)]);
  kumar.fillHandWithAttacks([
    { id: 102, action: "medicine", type: "medicine", afflictableOrgans: [], removableOrgans: [] },
  ]);

  const players = [chiru, kumar];
  const attackCards = new Deck([], shuffle);
  const organCards = new Deck([], shuffle);
  const dealer = new Dealer(attackCards, organCards, players);
  const afflictionHandler = new AfflictionHandler(attackCards, organCards, players);
  const turnManager = new TurnManager(players);

  const game = new Game(players, attackCards, organCards, dealer, afflictionHandler, turnManager);
  game.setFirstPlayer();

  return game;
};

const makeFakeSocket = () => {
  const sent: string[] = [];
  return {
    sent,
    send(data: string) {
      sent.push(data);
    },
    close() {},
    readyState: 1,
    addEventListener() {},
  };
};

describe("createUpdateGameState (per-player game-state personalization)", () => {
  it("sends each connected player their own hand as `self`, not each other's", () => {
    const game = buildGame();
    const games = { 101: game };
    const hub = new RealtimeHub();
    const chiruSocket = makeFakeSocket();
    const kumarSocket = makeFakeSocket();

    hub.registerClient("101", { playerID: 1, socket: chiruSocket });
    hub.registerClient("101", { playerID: 2, socket: kumarSocket });

    createUpdateGameState(hub, games)("101");

    assertEquals(chiruSocket.sent.length, 1);
    assertEquals(kumarSocket.sent.length, 1);

    const chiruMessage = JSON.parse(chiruSocket.sent[0]);
    const kumarMessage = JSON.parse(kumarSocket.sent[0]);

    assertEquals(chiruMessage.type, "game-state");
    assertEquals(chiruMessage.payload.self.id, 1);
    assertEquals(chiruMessage.payload.self.attackCards.map((card) => card.id), [101]);
    assertEquals(chiruMessage.payload.self.attackCards[0].action, "poison");

    assertEquals(kumarMessage.payload.self.id, 2);
    assertEquals(kumarMessage.payload.self.attackCards.map((card) => card.id), [102]);
    assertEquals(kumarMessage.payload.self.attackCards[0].action, "medicine");
  });

  it("keeps the public players[] identical across sockets and free of hand data", () => {
    const game = buildGame();
    const games = { 101: game };
    const hub = new RealtimeHub();
    const chiruSocket = makeFakeSocket();
    const kumarSocket = makeFakeSocket();

    hub.registerClient("101", { playerID: 1, socket: chiruSocket });
    hub.registerClient("101", { playerID: 2, socket: kumarSocket });

    createUpdateGameState(hub, games)("101");

    const chiruMessage = JSON.parse(chiruSocket.sent[0]);
    const kumarMessage = JSON.parse(kumarSocket.sent[0]);

    assertEquals(chiruMessage.payload.players, kumarMessage.payload.players);
    for (const player of chiruMessage.payload.players) {
      assertEquals("attackCards" in player, false);
    }
  });

  it("sends only one message per distinct player even with two sockets for the same player", () => {
    const game = buildGame();
    const games = { 101: game };
    const hub = new RealtimeHub();
    const tabOne = makeFakeSocket();
    const tabTwo = makeFakeSocket();

    hub.registerClient("101", { playerID: 1, socket: tabOne });
    hub.registerClient("101", { playerID: 1, socket: tabTwo });

    createUpdateGameState(hub, games)("101");

    assertEquals(tabOne.sent.length, 1);
    assertEquals(tabTwo.sent.length, 1);
  });
});
