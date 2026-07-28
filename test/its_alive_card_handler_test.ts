import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { Player } from "../src/models/player.ts";
import { Organ } from "../src/models/organ.ts";
import { Game } from "../src/models/game.ts";
import { Deck } from "../src/models/deck.ts";
import { handleItsAlive } from "../src/handlers/card_action_handler.ts";

describe("Game model test", () => {
  it(" Should return reanimated organ", () => {
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
    const { success } = handleItsAlive({ attackerID: 1, organCardID: 7, game });
    assertEquals(success, true);
    assertEquals(organDeck.getDiscardPile(), []);
  });
});
