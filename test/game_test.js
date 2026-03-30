import { describe, it } from "@std/testing/bdd";
import { assertEquals, assertInstanceOf } from "@std/assert";
import { Game } from "../src/models/game.js";
import { Player } from "../src/models/player.js";

describe("Game model test", () => {
  describe("* GetPlayers test", () => {
    it("Should return the players' details", () => {
      const players = [
        new Player("Shivang", 1),
        new Player("Samiran", 1),
      ];

      const game = new Game(players);
      const playerDetails = game.getPlayers();

      assertInstanceOf(game, Game);
      assertEquals(playerDetails, [{
        id: 1,
        name: "Shivang",
        organCards: [],
      }, {
        id: 1,
        name: "Samiran",
        organCards: [],
      }]);
    });

    it("Should return the index of firstPlayer", () => {
      const players = [
        new Player("Shivang", 1),
        new Player("Samiran", 1),
      ];

      const game = new Game(players);

      players[0].fillHand([], [{ isWild: false }]);
      players[1].fillHand([], [{ isWild: true }]);

      assertEquals(game.getFirstPlayer(), 1);
    });
  });

  describe("Testing Cards Distributor", () => {
    it("Should distribute 5 attack cards and 4 organ cards for 2 players", () => {
      const [player1, player2] = [
        new Player("Shivang", 1),
        new Player("Samiran", 1),
      ];

      const attackCards = Array.from({ length: 10 }, (_, i) => `a${i + 1}`);
      const organCards = Array.from({ length: 8 }, (_, i) => `o${i + 1}`);

      const game = new Game(
        [player1, player2],
        attackCards,
        organCards,
        (deck) => deck,
      );

      game.distributeCards();

      const { attackCards: player1Attacks, organCards: player1Organs } = player1
        .getPlayerDetails();
      assertEquals(player1Attacks, ["a1", "a2", "a3", "a4", "a5"]);
      assertEquals(player1Organs, ["o1", "o2", "o3", "o4"]);

      const { attackCards: player2Attacks, organCards: player2Organs } = player2
        .getPlayerDetails();
      assertEquals(player2Attacks, ["a6", "a7", "a8", "a9", "a10"]);
      assertEquals(player2Organs, ["o5", "o6", "o7", "o8"]);
    });

    it("Should distribute cards for 6 players", () => {
      const players = Array.from(
        { length: 6 },
        (_, i) => new Player(`p${i + 1}`, i + 1),
      );
      const attackCardsDeck = Array.from({ length: 40 }, (_, i) => `a${i}`);
      const organCardsDeck = Array.from({ length: 24 }, (_, i) => `o${i}`);

      const game = new Game(
        players,
        [...attackCardsDeck],
        [...organCardsDeck],
        (deck) => deck,
      );
      game.distributeCards();

      players.forEach((player) => {
        const { attackCards, organCards } = player.getPlayerDetails();
        assertEquals(attackCards, attackCardsDeck.splice(0, 5));
        assertEquals(organCards, organCardsDeck.splice(0, 4));
      });
    });
  });
});
