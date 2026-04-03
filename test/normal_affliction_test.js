import { assertEquals } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { createApp } from "../src/app.js";
import { counter } from "../src/utils.js";
import { Game } from "../src/models/game.js";
import { Player } from "../src/models/player.js";
import { Dealer } from "../src/models/dealer.js";
import { AfflictionHandler } from "../src/models/affliction_handler.js";
import { Deck } from "../src/models/deck.js";
import { Organ } from "../src/models/organ.js";

describe("Testing Normal Affliction", () => {
  let shuffle;
  let logger;
  let session;
  let idGenerator;
  let playerIdGenerator;
  let roomIdGenerator;
  let rooms;
  let games;
  let players;
  let game;
  let app;

  beforeEach(() => {
    shuffle = (x) => x;
    logger = () => (_, next) => {
      return next();
    };

    session = { "1": "chiru" };
    idGenerator = counter();
    playerIdGenerator = counter();
    roomIdGenerator = counter();
    rooms = { 101: [{ name: "chiru", id: 1 }, { name: "kumar", id: 2 }] };
    games = {};
    players = rooms[101].map(({ name, id }) => new Player(name, id));

    app = createApp({
      session,
      idGenerator,
      playerIdGenerator,
      roomIdGenerator,
      rooms,
      shuffle,
      games,
    }, logger);
  });

  it("Should afflict an organ of player with given IDs", async () => {
    players.map((player, i) => {
      player.fillHandWithOrgans([new Organ("", i + 1, 2)]);
      player.fillHandWithAttacks([{
        id: i + 1,
        action: "affliction",
        afflictableOrgans: [1],
      }]);
    });

    const dealer = new Dealer([], [], players);
    const afflictionHandler = new AfflictionHandler(new Deck([]), new Deck([]));
    game = new Game(
      players,
      [],
      [],
      dealer,
      afflictionHandler,
    );
    games[101] = game;
    const response = await app.request("/attack", {
      method: "post",
      body: JSON.stringify({
        attackerID: 1,
        opponentID: 1,
        attackCardID: 1,
        organCardID: 1,
      }),
      headers: { cookie: "roomID=101" },
    });
    assertEquals(await response.json(), { success: true });
  });

  it("Should remove an organ of player with given IDs", async () => {
    players.map((player) => {
      player.fillHandWithOrgans([
        new Organ("", 1, 2),
        new Organ("second", 2, 2),
      ]);
      player.fillHandWithAttacks([{
        id: 1,
        action: "affliction",
        afflictableOrgans: [1],
      }]);
    });

    const dealer = new Dealer([], [], players);
    const afflictionHandler = new AfflictionHandler(new Deck([]), new Deck([]));
    game = new Game(
      players,
      [],
      [],
      dealer,
      afflictionHandler,
    );
    // game.distributeCards();
    games[101] = game;

    const response = await app.request("/attack", {
      method: "post",
      body: JSON.stringify({
        attackerID: 1,
        opponentID: 2,
        attackCardID: 1,
        organCardID: 1,
      }),
      headers: { cookie: "roomID=101" },
    });
    console.log(response);
    console.log(players.map((p) => p.getPlayerDetails()));
    assertEquals(await response.json(), { success: true });
  });
});
