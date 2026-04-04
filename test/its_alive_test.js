import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { Player } from "../src/models/player.js";
import { Organ } from "../src/models/organ.js";
import { Game } from "../src/models/game.js";
import { Deck } from "../src/models/deck.js";

describe("Game model test", () => {
  it("=> Should return reanimated organ", () => {
    const shuffle = (arr) => arr;

    const attackCards = new Deck(
      Array.from(
        { length: 10 },
        (_, i) => ({ id: i + 1, type: "affliction" }),
      ),
      shuffle,
    );

    const organCards = [
      new Organ("wild", 10, 4, 4),
      ...Array.from(
        { length: 7 },
        (_, i) => (new Organ("hello", i + 1, 1, 2)),
      ),
    ];

    const player = new Player("user1", 1, "non-host");
    player.fillHandWithOrgans(organCards);
    const organDeck = new Deck(organCards);
    organDeck.addToDiscardPile(organDeck.getCard());

    const game = new Game(
      [player],
      attackCards,
      organDeck,
    );

    assertEquals(player.getPlayerDetails().organCards.length, 7);
    const organ = game.itsAlive(1, 7);
    assertEquals(player.getPlayerDetails().organCards.length, 8);
    assertEquals(organ.getDetails().id, 7);
    assertEquals(organ.getDetails().health, 2);
    assertEquals(organ.isDead(), false);
  });
});
