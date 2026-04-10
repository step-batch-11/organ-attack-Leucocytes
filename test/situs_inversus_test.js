import { Game } from "../src/models/game.js";
import { Player } from "../src/models/player.js";
import { TurnManager } from "../src/models/turn_manager.js";
import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { Deck } from "../src/models/deck.js";
import { AfflictionHandler } from "../src/models/affliction_handler.js";
import { Dealer } from "../src/models/dealer.js";
import { Organ } from "../src/models/organ.js";
import { handleSitusInversus } from "../src/handlers/card_action_handler.js";

describe("tests for situs inversus", () => {
  it("players lungs and heart should swap when both exists", () => {
    const p1 = new Player("user-1", 1, "non-host");
    const p2 = new Player("user-2", 2, "non-host");
    const players = [p1, p2];
    const organ1 = new Organ("heart", 7, 2, 2);
    const shuffler = (x) => x;
    const organ2 = new Organ("lungs", 13, 2, 2);
    const organ3 = new Organ("wild", 1, 4, 4);
    const organs = [
      organ3,
      new Organ("o4", 4, 2, 2),
      new Organ("o5", 5, 2, 2),
      organ1,
      new Organ("o6", 6, 2, 2),
      new Organ("o7", 1, 2, 2),
      new Organ("o8", 8, 2, 2),
      organ2,
    ];
    const attackCards = Array.from(
      { length: 10 },
      (i) => ({
        id: i + 1,
        name: `a${i + 1}`,
        isInstant: false,
        afflictableOrgans: [],
        removableOrgans: [],
      }),
    );
    const attackDeck = new Deck(attackCards, shuffler);
    const organDeck = new Deck(organs, shuffler);
    const dealer = new Dealer(attackDeck, organDeck, players);
    const game = new Game(
      players,
      attackDeck,
      organDeck,
      dealer,
      new AfflictionHandler(),
      new TurnManager(),
    );
    game.dealCards();

    assertEquals(p1.getPlayerDetails().organCards[0].name, "lungs");
    assertEquals(p2.getPlayerDetails().organCards[0].name, "heart");

    const { success } = handleSitusInversus({ game });

    assertEquals(success, true);
    assertEquals(p1.getPlayerDetails().organCards.at(-1).name, "heart");
    assertEquals(p2.getPlayerDetails().organCards.at(-1).name, "lungs");
  });
  it("players lungs and heart shouldn't swap when both don't exists ", () => {
    const p1 = new Player("user-1", 1, "non-host");
    const p2 = new Player("user-2", 2, "non-host");
    const players = [p1, p2];
    const shuffler = (x) => x;
    const organ2 = new Organ("lungs", 13, 2, 2);
    const organ3 = new Organ("wild", 1, 4, 4);
    const organs = [
      organ3,
      new Organ("o4", 4, 2, 2),
      new Organ("o5", 5, 2, 2),
      new Organ("o6", 6, 2, 2),
      new Organ("o7", 1, 2, 2),
      new Organ("o8", 8, 2, 2),
      new Organ("o9", 9, 2, 2),
      organ2,
    ];
    const attackCards = Array.from(
      { length: 10 },
      (i) => ({
        id: i + 1,
        name: `a${i + 1}`,
        isInstant: false,
        afflictableOrgans: [],
        removableOrgans: [],
      }),
    );
    const attackDeck = new Deck(attackCards, shuffler);
    const organDeck = new Deck(organs, shuffler);
    const dealer = new Dealer(attackDeck, organDeck, players);
    const game = new Game(
      players,
      attackDeck,
      organDeck,
      dealer,
      new AfflictionHandler(),
      new TurnManager(),
    );
    game.dealCards();

    assertEquals(p1.getPlayerDetails().organCards[0].name, "lungs");
    assertEquals(p2.getPlayerDetails().organCards[0].name, "o6");

    const { success } = handleSitusInversus({ game });

    assertEquals(success, true);
    assertEquals(p1.getPlayerDetails().organCards[0].name, "lungs");
    assertEquals(p2.getPlayerDetails().organCards[0].name, "o6");
  });
});
