import { assertEquals } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { createApp } from "../src/app.js";
import { counter } from "../src/utils.js";
import { Game } from "../src/models/game.js";
import { Player } from "../src/models/player.js";

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

    game = new Game(
      players,
      [{ id: 1, type: "affliction" }],
      [{ id: 1, health: 2 }],
      shuffle,
    );
    // game.distributeCards();
    games[101] = game;

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
    players.map((player) =>
      player.fillHand([{ id: 1, type: "affliction" }], [{ id: 1, health: 2 }])
    );

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
    assertEquals(await response.json(), { success: true });
  });

  it("Should afflict an organ of player with given IDs", async () => {
    players.map((player) =>
      player.fillHand([{ id: 1, type: "affliction" }], [{ id: 1, health: 1 }])
    );

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
    assertEquals(await response.json(), { success: true });
  });
});
