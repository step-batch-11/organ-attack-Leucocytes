import { assertEquals, assertThrows } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { Game } from "../src/models/game.ts";
import { Player } from "../src/models/player.ts";
import { Organ } from "../src/models/organ.ts";
import { Deck } from "../src/models/deck.ts";
import { Dealer } from "../src/models/dealer.ts";
import { AfflictionHandler } from "../src/models/affliction_handler.ts";
import { TurnManager } from "../src/models/turn_manager.ts";
import type { AttackCard } from "../src/types/cards.ts";

const shuffle = <T>(cards: T[]) => cards;

const buildAttackCard = (
  overrides: Partial<AttackCard> & Pick<AttackCard, "id" | "action">,
): AttackCard => ({
  name: overrides.action,
  type: overrides.action,
  isInstant: false,
  afflictableOrgans: [],
  removableOrgans: [],
  isWild: false,
  afflictPoints: 0,
  Desc: "",
  isBlockable: true,
  ...overrides,
});

const buildGame = (players: Player[], attackCards: Deck<AttackCard>) => {
  const organCards = new Deck([], shuffle);
  const dealer = new Dealer(attackCards, organCards, players);
  const afflictionHandler = new AfflictionHandler(
    attackCards,
    organCards,
    players,
  );
  const turnManager = new TurnManager(players);

  const game = new Game(
    players,
    attackCards,
    organCards,
    dealer,
    afflictionHandler,
    turnManager,
  );
  game.setFirstPlayer();

  return game;
};

describe("Game#research", () => {
  it("throws instead of pushing undefined into the player's hand when selectedCardID isn't in the discard pile", () => {
    const player = new Player("attacker", 1);
    player.fillHandWithAttacks([
      buildAttackCard({ id: 10, action: "research" }),
    ]);
    const attackCards = new Deck<AttackCard>([], shuffle);
    const game = buildGame([player], attackCards);

    assertThrows(() => game.research(1, 999, 10));

    // Neither the research card nor the hand was touched by the failed call.
    assertEquals(
      player.getPlayerDetails().attackCards.map((c) => c.id),
      [10],
    );
  });

  it("swaps the research card for the selected discard-pile card on success", () => {
    const player = new Player("attacker", 1);
    player.fillHandWithAttacks([
      buildAttackCard({ id: 10, action: "research" }),
    ]);
    const attackCards = new Deck<AttackCard>([], shuffle);
    attackCards.addToDiscardPile(
      buildAttackCard({ id: 20, action: "medicine" }),
    );
    const game = buildGame([player], attackCards);

    game.research(1, 20, 10);

    assertEquals(
      player.getPlayerDetails().attackCards.map((c) => c.id),
      [20],
    );
  });
});

describe("Game#getPlayer / #findPlayer", () => {
  it("throws a clear error instead of crashing with an unguarded-cast TypeError when the id doesn't match any player", () => {
    const player = new Player("attacker", 1);
    const attackCards = new Deck<AttackCard>([], shuffle);
    const game = buildGame([player], attackCards);

    assertThrows(
      () => game.getPlayer(999),
      Error,
      "No player found with id 999",
    );
  });
});

describe("Game#passTurn (dead player's hand)", () => {
  it("returns a dead player's discarded hand to the attack deck's discard pile instead of dropping it (regression: TurnManager used to discard cards into nothing)", () => {
    const alive1 = new Player("alive1", 1);
    const dead = new Player("dead", 2);
    const alive2 = new Player("alive2", 3);

    alive1.fillHandWithOrgans([new Organ("Heart", 100, 2)]);
    // `dead` is given no organs at all, so Player#isAlive() is false.
    alive2.fillHandWithOrgans([new Organ("Kidneys", 101, 2)]);

    dead.fillHandWithAttacks([
      buildAttackCard({ id: 50, action: "affliction" }),
      buildAttackCard({ id: 51, action: "affliction" }),
    ]);

    const attackCards = new Deck<AttackCard>([], shuffle);
    const game = buildGame([alive1, dead, alive2], attackCards);

    // Force a turn advance from alive1 past the dead player to alive2.
    game.currentTurnPlayed({
      name: "BY_THE_BOOK",
      card: buildAttackCard({ id: 60, action: "by-the-book" }),
      attackerID: alive1.getID(),
    });
    game.passTurn();

    assertEquals(game.getCurrentPlayerID(), alive2.getID());
    assertEquals(
      game.getDiscardAttackCards().map((c) => c.id).sort(),
      [50, 51],
    );
    assertEquals(dead.getPlayerDetails().attackCards, []);
  });
});
