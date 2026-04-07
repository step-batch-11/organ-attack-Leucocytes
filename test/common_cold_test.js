import { assertEquals } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { createApp } from "../src/app.js";
import { counter } from "../src/utils.js";
import { Game } from "../src/models/game.js";
import { Player } from "../src/models/player.js";
import { Deck } from "../src/models/deck.js";
import { AfflictionHandler } from "../src/models/affliction_handler.js";
import { Dealer } from "../src/models/dealer.js";
import { Organ } from "../src/models/organ.js";

describe("Testing Common cold", () => {
  let roomID;
  let players;
  let shuffle;
  let session;
  let idGenerator;
  let playerIDGenerator;
  let roomIDGenerator;
  let rooms;
  let games;
  let game;
  let app;

  const logger = () => (_, next) => {
    return next();
  };

  beforeEach(() => {
    roomID = 101;
    shuffle = (x) => x;
    const attackCards = new Deck(
      Array.from(
        { length: 10 },
        (_, i) => ({
          id: i + 1,
          action: "common-cold",
          type: "tactical",
          afflictableOrgans: [],
        }),
      ),
      shuffle,
    );
    const organCards = new Deck(
      [{ id: 1, health: 2 }, { id: 2, health: 2 }, { id: 3, health: 2 }, {
        id: 4,
        health: 2,
      }]
        .map(({ id, health }) => new Organ("o" + id, id, health)),
      shuffle,
    );
    rooms = { 101: [{ name: "chiru", id: 1 }, { name: "kumar", id: 2 }] };
    games = {};

    players = rooms[roomID].map(({ name, id }) => new Player(name, id));
    players.map((player) => {
      player.fillHandWithOrgans([new Organ("Heart", 1, 1)]);
      player.fillHandWithAttacks([{
        id: 1,
        action: "common-cold",
        afflictableOrgans: [1],
      }]);
    });
    const dealer = new Dealer(attackCards, organCards, players);

    const afflictionHandler = new AfflictionHandler(attackCards, organCards);

    session = { "1": "chiru" };
    idGenerator = counter();
    playerIDGenerator = counter();
    roomIDGenerator = counter();
    game = new Game(
      players,
      attackCards,
      organCards,
      dealer,
      afflictionHandler,
    );
    // game.dealCards();
    game.setFirstPlayer();
    games[101] = game;

    app = createApp({
      session,
      idGenerator,
      playerIDGenerator,
      roomIDGenerator,
      rooms,
      shuffle,
      games,
    }, logger);
  });
  it("Should get an attack card from selected opponent and send common cold to him", async () => {
    const res = await app.request("/attack", {
      method: "post",
      body: JSON.stringify({
        attackerID: 1,
        opponentID: 1,
        attackCardID: 1,
        organCardID: 1,
        isInstant: false,
      }),
      headers: { cookie: "roomID=101" },
    });

    assertEquals(res.status, 200);
    const { success } = await res.json();
    assertEquals(success, true);
  });
});
