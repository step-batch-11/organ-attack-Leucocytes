import { gameSetup } from "../src/game_setup.js";
import { describe, it } from "@std/testing/bdd";
import { assert, assertEquals, assertInstanceOf } from "@std/assert";
import { Game } from "../src/models/game.js";

describe("Game setup tests", () => {
  it("Game setup should return given players", async () => {
    const roomInfo = {
      roomId: 1,
      players: [{ name: "qwerty", id: 1 }],
    };
    const games = {};
    const ctx = {
      games,
      get(name) {
        return this[name];
      },
      req: {
        json() {
          return roomInfo;
        },
      },
      json(json) {
        return json;
      },
      shuffle() {
        return [];
      },
    };

    const expectedPlayerDetails = [{ name: "qwerty", id: 1, organCards: [] }];
    const playerDetails = await gameSetup(ctx);

    assertEquals(playerDetails, expectedPlayerDetails);
    assert(Object.keys(games).includes("1"));
    assertInstanceOf(games[1], Game);
  });
});
