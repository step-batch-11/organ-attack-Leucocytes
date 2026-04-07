import { beforeEach, describe, it } from "@std/testing/bdd";
import { assertEquals, assertInstanceOf, assertNotEquals } from "@std/assert";
import { Game } from "../src/models/game.js";
import { Player } from "../src/models/player.js";
import { Dealer } from "../src/models/dealer.js";
import { Deck } from "../src/models/deck.js";
import { Organ } from "../src/models/organ.js";
import { TurnManager } from "../src/models/turn_manager.js";

describe("Game model test", () => {
  describe("* GetPlayers test", () => {
    it("Should return the players' details", () => {
      const players = [
        new Player("Shivang", 1),
        new Player("Samiran", 1),
      ];

      const game = new Game(players);
      const playerDetails = game.getAllPlayersDetails();

      assertInstanceOf(game, Game);
      assertEquals(playerDetails, [{
        isMyTurn: false,
        id: 1,
        name: "Shivang",
        organCards: [],
        vaccinePoints: 0,
        isSleeping : false,
      }, {
        isMyTurn: false,
        id: 1,
        name: "Samiran",
        organCards: [],
        vaccinePoints: 0,
        isSleeping : false
      }]);
    });

    it("Should return the players' details providing wild organ", () => {
      const players = [
        new Player("Shivang", 1),
        new Player("Samiran", 2),
      ];

      players.map((player) => {
        player.fillHandWithOrgans([
          new Organ("o1", 1, 1, 2),
          new Organ("wild", 2, 3, 4),
        ]);
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
            name: "o1",
            health: 1,
            id: 1,
            isWild: false,
            maxHealth: 2,
          },
          {
            name: "wild",
            health: 3,
            id: 2,
            maxHealth: 4,
            isWild: true,
          },
        ],
        attackCards: [],
        vaccinePoints: 0,
        isSleeping:false
      });
    });

    it("Should return the index of firstPlayer", () => {
      const players = [
        new Player("Shivang", 1),
        new Player("Samiran", 1),
      ];

      const game = new Game(players);

      players[0].fillHandWithOrgans([new Organ("", 1, 2)]);
      players[0].fillHandWithAttacks([]);
      players[1].fillHandWithOrgans([new Organ("wild", 2, 4)]);
      players[1].fillHandWithAttacks([]);

      assertEquals(game.setFirstPlayer(), 1);
    });
  });

  describe("Testing Cards Distributor", () => {
    let shuffle;
    beforeEach(() => shuffle = (x) => x);

    it("Should distribute 5 attack cards to each players", () => {
      const [player1, player2] = [
        new Player("Shivang", 1),
        new Player("Samiran", 1),
      ];
      const players = [player1, player2];
      const attackCards = new Deck(
        Array.from(
          { length: 10 },
          (_, i) => ({ name: `a${i + 1}`, afflictableOrgans: [i] }),
        ),
        shuffle,
      );
      const organCards = new Deck([{ id: 1 }], shuffle);

      const dealer = new Dealer(attackCards, organCards, [player1, player2]);
      const turnManager = new TurnManager(players, 1);

      const game = new Game(
        [player1, player2],
        attackCards,
        organCards,
        dealer,
        (deck) => deck,
        {},
        turnManager,
      );

      game.dealCards();

      const { attackCards: player1Attacks } = player1.getPlayerDetails();
      assertEquals(
        player1Attacks,
        Array.from(
          { length: 5 },
          (_, i) => ({ name: `a${10 - i}`, afflictableOrgans: [9 - i] }),
        ),
      );

      const { attackCards: player2Attacks } = player2.getPlayerDetails();
      assertEquals(
        player2Attacks,
        Array.from(
          { length: 5 },
          (_, i) => ({ name: `a${5 - i}`, afflictableOrgans: [4 - i] }),
        ),
      );
    });

    it("Should distribute 4 attack cards to each players", () => {
      const [player1, player2] = [
        new Player("Shivang", 1),
        new Player("Samiran", 1),
      ];

      const attackCards = new Deck(
        Array.from(
          { length: 10 },
          (_, i) => ({
            name: `a${i + 1}`,
            afflictableOrgans: [],
            removableOrgans: [],
          }),
        ),
        shuffle,
      );
      const organCards = new Deck(
        Array.from({ length: 8 }, (_, i) => `o${i + 1}`).map((x) =>
          new Organ(x)
        ),
        shuffle,
      );

      const dealer = new Dealer(attackCards, organCards, [player1, player2]);

      const game = new Game(
        [player1, player2],
        attackCards,
        organCards,
        dealer,
        (deck) => deck,
      );

      game.dealCards();
      const player1Organs = player1
        .getPlayerDetails().organCards.map(({ name }) => name);

      assertEquals(player1Organs, ["o5", "o6", "o7", "o8"].reverse());

      const player2Organs = player2
        .getPlayerDetails().organCards.map(({ name }) => name);

      assertEquals(player2Organs, ["o1", "o2", "o3", "o4"].reverse());
    });

    it("Should distribute 5 attack cards and 4 organ cards for 2 players", () => {
      const [player1, player2] = [
        new Player("Shivang", 1),
        new Player("Samiran", 1),
      ];

      const attackCards = new Deck(
        Array.from(
          { length: 10 },
          (_, i) => ({
            name: `a${i + 1}`,
            afflictableOrgans: [],
            removableOrgans: [],
          }),
        ),
        shuffle,
      );
      const organCards = new Deck(
        Array.from({ length: 8 }, (_, i) => `o${i + 1}`).map((x) =>
          new Organ(x)
        ),
        shuffle,
      );

      const dealer = new Dealer(attackCards, organCards, [player1, player2]);

      const game = new Game(
        [player1, player2],
        attackCards,
        organCards,
        dealer,
        (deck) => deck,
      );

      game.dealCards();

      const { attackCards: player1Attacks, organCards: player1Organs } = player1
        .getPlayerDetails();
      assertEquals(
        player1Attacks,
        Array.from(
          { length: 5 },
          (_, i) => ({
            name: `a${10 - i}`,
            afflictableOrgans: [],
            removableOrgans: [],
          }),
        ),
      );
      assertEquals(
        player1Organs.map(({ name }) => name),
        Array.from(
          { length: 4 },
          (_, i) => `o${8 - i}`,
        ),
      );

      const { attackCards: player2Attacks, organCards: player2Organs } = player2
        .getPlayerDetails();
      const attackCardsExp = Array.from(
        { length: 4 },
        (_, i) => ({
          name: `a${5 - i}`,
          afflictableOrgans: [],
          removableOrgans: [],
        }),
      );
      attackCardsExp.push({
        name: "a1",
        afflictableOrgans: [],
        removableOrgans: [],
      });
      assertEquals(
        player2Attacks,
        attackCardsExp,
      );
      assertEquals(
        player2Organs.map(({ name }) => name),
        Array.from(
          { length: 4 },
          (_, i) => `o${4 - i}`,
        ),
      );
    });

    it("Should distribute 5 attack cards to each players", () => {
      const [player1, player2] = [
        new Player("Shivang", 1),
        new Player("Samiran", 2),
      ];

      const attackCards = new Deck(
        Array.from({ length: 20 }, (_, i) => `a${i + 1}`),
        shuffle,
      );
      const organCards = [];
      player1.fillHandWithAttacks(attackCards.getDrawingPile());
      player2.fillHandWithAttacks(attackCards.getDrawingPile());

      const dealer = new Dealer(attackCards, organCards, [player1, player2]);

      const game = new Game(
        [player1, player2],
        attackCards,
        organCards,
        dealer,
      );

      const { attackCards: player1PreAttacks } = player1.getPlayerDetails();
      const { attackCards: player2PreAttacks } = player2.getPlayerDetails();

      game.chartMixup();

      const { attackCards: player1Attacks } = player1.getPlayerDetails();
      const { attackCards: player2Attacks } = player2.getPlayerDetails();

      assertNotEquals(player1Attacks, player1PreAttacks);
      assertNotEquals(player2Attacks, player2PreAttacks);
    });

    it("Should distribute 5 attack cards to each players", () => {
      const [player1, player2] = [
        new Player("Shivang", 1),
        new Player("Samiran", 2),
      ];

      const attackCards = new Deck(
        Array.from({ length: 20 }, (_, i) => `a${i + 1}`),
        shuffle,
      );
      const organCards = [];
      player1.fillHandWithAttacks(attackCards.getDrawingPile());
      player2.fillHandWithAttacks(attackCards.getDrawingPile());

      const dealer = new Dealer(attackCards, organCards, [player1, player2]);

      const game = new Game(
        [player1, player2],
        attackCards,
        organCards,
        dealer,
      );

      const { attackCards: player1PreAttacks } = player1.getPlayerDetails();
      const { attackCards: player2PreAttacks } = player2.getPlayerDetails();

      game.chartMixup();

      const { attackCards: player1Attacks } = player1.getPlayerDetails();
      const { attackCards: player2Attacks } = player2.getPlayerDetails();

      assertNotEquals(player1Attacks, player1PreAttacks);
      assertNotEquals(player2Attacks, player2PreAttacks);
    });

    it("Should distribute 5 attack cards to each players", () => {
      const [player1, player2] = [
        new Player("Shivang", 1),
        new Player("Samiran", 2),
      ];

      const attackCards = new Deck(
        Array.from({ length: 20 }, (_, i) => `a${i + 1}`),
        shuffle,
      );
      const organCards = [];
      player1.fillHandWithAttacks(attackCards.getDrawingPile());
      player2.fillHandWithAttacks(attackCards.getDrawingPile());

      const dealer = new Dealer(attackCards, organCards, [player1, player2]);

      const game = new Game(
        [player1, player2],
        attackCards,
        organCards,
        dealer,
      );

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
