import { describe, it } from "@std/testing/bdd";
import { assertEquals, assertInstanceOf, assertNotEquals } from "@std/assert";
import { shuffle } from "@std/random";
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
        isMyTurn: false,
        id: 1,
        name: "Shivang",
        organCards: [],
      }, {
        isMyTurn: false,
        id: 1,
        name: "Samiran",
        organCards: [],
      }]);
    });

    it("Should return the players' details providing wild organ", () => {
      const players = [
        new Player("Shivang", 1),
        new Player("Samiran", 2),
      ];

      players.map((player) => {
        player.fillHandWithOrgans([{ id: 1, health: 1, isWild: true }]);
        player.fillHandWithAttacks([]);
      });

      const game = new Game(players);
      game.setFirstPlayer();
      const playerDetails = game.getPlayer(1);

      assertInstanceOf(game, Game);
      assertEquals(playerDetails, {
        isMyTurn: true,
        id: 1,
        name: "Shivang",
        organCards: [
          {
            health: 1,
            id: 1,
            isWild: true,
          },
        ],
        attackCards: [],
      });
    });

    it("Should return the index of firstPlayer", () => {
      const players = [
        new Player("Shivang", 1),
        new Player("Samiran", 1),
      ];

      const game = new Game(players);

      players[0].fillHandWithOrgans([{ isWild: false }]);
      players[0].fillHandWithAttacks([]);
      players[1].fillHandWithOrgans([{ isWild: true }]);
      players[1].fillHandWithAttacks([]);

      assertEquals(game.setFirstPlayer(), 1);
    });
  });

  describe("Testing Cards Distributor", () => {
    it("Should distribute 5 attack cards to each players", () => {
      const [player1, player2] = [
        new Player("Shivang", 1),
        new Player("Samiran", 1),
      ];

      const attackCards = Array.from(
        { length: 10 },
        (_, i) => ({ name: `a${i + 1}`, afflictableOrgans: [] }),
      );
      const organCards = [];

      const game = new Game(
        [player1, player2],
        attackCards,
        organCards,
        (deck) => deck,
      );

      game.distributeAttackCards();

      const { attackCards: player1Attacks } = player1.getPlayerDetails();
      assertEquals(
        player1Attacks,
        Array.from(
          { length: 5 },
          (_, i) => ({ name: `a${i + 1}`, afflictableOrgans: [] }),
        ),
      );

      const { attackCards: player2Attacks } = player2.getPlayerDetails();
      assertEquals(
        player2Attacks,
        Array.from(
          { length: 5 },
          (_, i) => ({ name: `a${i + 6}`, afflictableOrgans: [] }),
        ),
      );
    });

    it("Should distribute 4 attack cards to each players", () => {
      const [player1, player2] = [
        new Player("Shivang", 1),
        new Player("Samiran", 1),
      ];

      const attackCards = [];
      const organCards = Array.from({ length: 8 }, (_, i) => `o${i + 1}`);

      const game = new Game(
        [player1, player2],
        attackCards,
        organCards,
        (deck) => deck,
      );

      game.distributeOrganCards();
      const { organCards: player1Organs } = player1
        .getPlayerDetails();

      assertEquals(player1Organs, ["o1", "o2", "o3", "o4"]);

      const { organCards: player2Organs } = player2
        .getPlayerDetails();

      assertEquals(player2Organs, ["o5", "o6", "o7", "o8"]);
    });

    it("Should distribute 5 attack cards and 4 organ cards for 2 players", () => {
      const [player1, player2] = [
        new Player("Shivang", 1),
        new Player("Samiran", 1),
      ];

      const attackCards = Array.from(
        { length: 10 },
        (_, i) => ({ name: `a${i + 1}`, afflictableOrgans: [] }),
      );
      attackCards.unshift({ name: "a0", afflictableOrgans: [1] });
      const organCards = Array.from(
        { length: 8 },
        (_, i) => ({ name: `o${i + 1}`, id: i }),
      );

      const game = new Game(
        [player1, player2],
        attackCards,
        organCards,
        (deck) => deck,
      );

      game.distributeCards();

      const { attackCards: player1Attacks, organCards: player1Organs } = player1
        .getPlayerDetails();
      assertEquals(
        player1Attacks,
        Array.from(
          { length: 5 },
          (_, i) => ({ name: `a${i + 1}`, afflictableOrgans: [] }),
        ),
      );
      assertEquals(
        player1Organs,
        Array.from(
          { length: 4 },
          (_, i) => ({ name: `o${i + 1}`, id: i }),
        ),
      );

      const { attackCards: player2Attacks, organCards: player2Organs } = player2
        .getPlayerDetails();
      const attackCardsExp = Array.from(
        { length: 4 },
        (_, i) => ({ name: `a${i + 6}`, afflictableOrgans: [] }),
      );
      attackCardsExp.unshift({ name: "a0", afflictableOrgans: [1] });
      assertEquals(
        player2Attacks,
        attackCardsExp,
      );
      assertEquals(
        player2Organs,
        Array.from(
          { length: 4 },
          (_, i) => ({ name: `o${i + 5}`, id: i + 4 }),
        ),
      );
    });

    it("Should distribute cards for 6 players", () => {
      const players = Array.from(
        { length: 6 },
        (_, i) => new Player(`p${i + 1}`, i + 1),
      );
      const attackCardsDeck = Array.from(
        { length: 40 },
        (_, i) => ({ name: `a${i}`, afflictableOrgans: [] }),
      );
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

    it("Should distribute 5 attack cards to each players", () => {
      const [player1, player2] = [
        new Player("Shivang", 1),
        new Player("Samiran", 2),
      ];

      const attackCards = Array.from({ length: 20 }, (_, i) => `a${i + 1}`);
      const organCards = [];

      const game = new Game(
        [player1, player2],
        attackCards,
        organCards,
        shuffle,
      );

      game.distributeAttackCards();

      const { attackCards: player1PreAttacks } = player1.getPlayerDetails();
      const { attackCards: player2PreAttacks } = player2.getPlayerDetails();

      game.chartMixup();

      const { attackCards: player1Attacks } = player1.getPlayerDetails();
      const { attackCards: player2Attacks } = player2.getPlayerDetails();

      assertNotEquals(player1Attacks, player1PreAttacks);
      assertNotEquals(player2Attacks, player2PreAttacks);
    });
  });
});
