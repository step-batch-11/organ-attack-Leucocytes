import { describe, it } from "@std/testing/bdd";
import { assertEquals, assertInstanceOf } from "@std/assert";
import { Game } from "../src/models/game.js";

describe("Game model test", () => {
  describe("* GetPlayers test", () => {
    it("Should return the players' details", () => {
      const players = [{ getPlayerDetails: () => "Player" }];
      const game = new Game(players);
      const playerDetails = game.getPlayers();

      assertInstanceOf(game, Game);
      assertEquals(playerDetails, ["Player"]);
    });
  });
});
