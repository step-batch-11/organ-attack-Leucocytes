import { gameSetup } from "../src/game_setup.js";
import { describe, it } from "@std/testing/bdd";
import { assertInstanceOf } from "@std/assert";
import { Game } from "../src/models/game.js";

describe("Game setup tests", () => {
  it("Game setup should return given players", () => {
    assertInstanceOf(gameSetup(), Game);
  });
});
