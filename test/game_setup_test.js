import { gameSetup } from "../src/game_setup.js";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { assert, assertEquals, assertInstanceOf } from "@std/assert";
import { Game } from "../src/models/game.js";

describe("Game setup tests", () => {
  let roomId;
  let rooms;
  let games;
  let ctx;
  beforeEach(() => {
    roomId = 1;
    rooms = { [roomId]: [{ name: "qwerty", id: 1 }] };
    games = {};
    ctx = {
      games,
      rooms,
      get(name) {
        return this[name];
      },
      req: {
        json() {
          return { roomId };
        },
      },
      json(json, status) {
        return { body: json, status };
      },
      shuffle() {
        return [];
      },
    };
  });

  it("Game setup should return given players", async () => {
    const expectedPlayerDetails = [{ name: "qwerty", id: 1, organCards: [] }];
    const playerDetails = await gameSetup(ctx);

    assertEquals(playerDetails.body, expectedPlayerDetails);
    assertEquals(playerDetails.status, 201);
    assert(Object.keys(games).includes("1"));
    assertInstanceOf(games[1], Game);
  });

  it("Game setup with invalid room id should return 'bad request' response", async () => {
    roomId = 2;
    const playerDetails = await gameSetup(ctx);
    assertEquals(playerDetails.status, 400);
    assertEquals(playerDetails.body, { message: "Invalid roomId" });
  });
});
