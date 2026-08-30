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

/** Like `buildGame`, but also returns the organ deck for tests that need to seed its discard pile directly (e.g. It's Alive). */
const buildGameWithOrganDeck = (
  players: Player[],
  attackCards: Deck<AttackCard>,
) => {
  const organCards = new Deck<Organ>([], shuffle);
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

  return { game, organCards };
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

describe("Game#registerEvent", () => {
  it("assigns a fresh id per registered event, left stable by updateEventStatus (regression: clients need a stable identity to avoid restarting a still-open response-timer countdown on unrelated broadcasts)", () => {
    const player = new Player("attacker", 1);
    const attackCards = new Deck<AttackCard>([], shuffle);
    const game = buildGame([player], attackCards);

    game.registerEvent({
      name: "affliction",
      card: buildAttackCard({ id: 1, action: "affliction" }),
    });
    const firstID = game.getGameState().event.id;
    assertEquals(typeof firstID, "number");

    // Simulating an unrelated broadcast mid-window mutating resolved/timeRemaining.
    game.updateEventStatus(3000);
    assertEquals(game.getGameState().event.id, firstID);

    game.registerEvent({
      name: "contagious",
      card: buildAttackCard({ id: 2, action: "contagious" }),
    });
    assertEquals(game.getGameState().event.id !== firstID, true);
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

describe("Game#applySedate", () => {
  it("applies 2 sleep points to the targeted player", () => {
    const target = new Player("target", 1);
    const attackCards = new Deck<AttackCard>([], shuffle);
    const game = buildGame([target], attackCards);

    const sleepCount = game.applySedate(target.getID());

    assertEquals(sleepCount, 2);
    assertEquals(target.getPlayerDetails().isSleeping, true);
  });

  it("accumulates on top of any existing sleep rather than overwriting it", () => {
    const target = new Player("target", 1);
    target.applySleep(1);
    const attackCards = new Deck<AttackCard>([], shuffle);
    const game = buildGame([target], attackCards);

    const sleepCount = game.applySedate(target.getID());

    assertEquals(sleepCount, 3);
  });

  it("returns -1 instead of throwing when the targeted id doesn't match any player", () => {
    const player = new Player("attacker", 1);
    const attackCards = new Deck<AttackCard>([], shuffle);
    const game = buildGame([player], attackCards);

    assertEquals(game.applySedate(999), -1);
  });
});

describe("Game#exchangeCard (common-cold)", () => {
  it("swaps the attacker's chosen card for one of the opponent's cards", () => {
    const attacker = new Player("attacker", 1);
    const opponent = new Player("opponent", 2);
    attacker.fillHandWithAttacks([
      buildAttackCard({ id: 10, action: "common-cold" }),
    ]);
    opponent.fillHandWithAttacks([
      buildAttackCard({ id: 20, action: "medicine" }),
    ]);
    const attackCards = new Deck<AttackCard>([], shuffle);
    const game = buildGame([attacker, opponent], attackCards);

    game.exchangeCard(attacker.getID(), 10, opponent.getID());

    assertEquals(
      attacker.getPlayerDetails().attackCards.map((c) => c.id),
      [20],
    );
    assertEquals(
      opponent.getPlayerDetails().attackCards.map((c) => c.id),
      [10],
    );
  });

  it(
    "does not throw when the opponent holds fewer than 5 cards " +
      "(regression: the random index was hardcoded to `* 5`, out of bounds " +
      "— and throwing, since Player#removeAttackCard guards its index — " +
      "for any opponent holding fewer cards, which is routine well before " +
      "a real game ends)",
    () => {
      const attacker = new Player("attacker", 1);
      const opponent = new Player("opponent", 2);
      attacker.fillHandWithAttacks([
        buildAttackCard({ id: 10, action: "common-cold" }),
      ]);
      opponent.fillHandWithAttacks([
        buildAttackCard({ id: 20, action: "medicine" }),
      ]);
      const attackCards = new Deck<AttackCard>([], shuffle);
      const game = buildGame([attacker, opponent], attackCards);

      game.exchangeCard(attacker.getID(), 10, opponent.getID());

      assertEquals(opponent.getPlayerDetails().attackCards.length, 1);
    },
  );

  it("leaves the attacker's hand untouched when the opponent holds no cards at all", () => {
    const attacker = new Player("attacker", 1);
    const opponent = new Player("opponent", 2);
    attacker.fillHandWithAttacks([
      buildAttackCard({ id: 10, action: "common-cold" }),
    ]);
    const attackCards = new Deck<AttackCard>([], shuffle);
    const game = buildGame([attacker, opponent], attackCards);

    game.exchangeCard(attacker.getID(), 10, opponent.getID());

    assertEquals(
      attacker.getPlayerDetails().attackCards.map((c) => c.id),
      [10],
    );
  });
});

describe("Game#transplantOrgan", () => {
  it("moves the specified organ from the opponent's hand to the player's", () => {
    const player = new Player("player", 1);
    const opponent = new Player("opponent", 2);
    opponent.fillHandWithOrgans([new Organ("Kidneys", 1, 2)]);
    const attackCards = new Deck<AttackCard>([], shuffle);
    const game = buildGame([player, opponent], attackCards);

    game.transplantOrgan(player.getID(), opponent.getID(), 1);

    assertEquals(
      player.getPlayerDetails().organCards.map((o) => o.id),
      [1],
    );
    assertEquals(opponent.getPlayerDetails().organCards, []);
  });
});

describe("Game#applyVaccine", () => {
  it("blocks the player's next affliction and consumes one vaccine point instead of health", () => {
    const player = new Player("player", 1);
    player.fillHandWithOrgans([new Organ("Heart", 7, 2)]);
    const attackCards = new Deck<AttackCard>([], shuffle);
    const game = buildGame([player], attackCards);

    game.applyVaccine(player.getID());
    game.afflictOrganOfOpponent(player.getID(), 7, 1);

    assertEquals(player.getPlayerDetails().organCards[0].health, 2);
    assertEquals(player.getPlayerDetails().vaccinePoints, 1);
  });
});

describe("Game#removeOrgan (poison)", () => {
  it("removes the organ from the player's hand and moves it to the organ discard pile", () => {
    const player = new Player("player", 1);
    player.fillHandWithOrgans([new Organ("Heart", 7, 2)]);
    const attackCards = new Deck<AttackCard>([], shuffle);
    const { game, organCards } = buildGameWithOrganDeck(
      [player],
      attackCards,
    );

    game.removeOrgan(player.getID(), 7);

    assertEquals(player.getPlayerDetails().organCards, []);
    assertEquals(
      organCards.getDiscardPile().map((o) => o.getID()),
      [7],
    );
  });
});

describe("Game#getPoisonHolderID", () => {
  it("returns the id of whichever player holds an unplayed Poison card", () => {
    const p1 = new Player("p1", 1);
    const p2 = new Player("p2", 2);
    p2.fillHandWithAttacks([buildAttackCard({ id: 1, action: "poison" })]);
    const attackCards = new Deck<AttackCard>([], shuffle);
    const game = buildGame([p1, p2], attackCards);

    assertEquals(game.getPoisonHolderID(), p2.getID());
  });

  it("returns null when nobody holds Poison", () => {
    const p1 = new Player("p1", 1);
    const attackCards = new Deck<AttackCard>([], shuffle);
    const game = buildGame([p1], attackCards);

    assertEquals(game.getPoisonHolderID(), null);
  });
});

describe("Game#forceResolvePoison", () => {
  it("discards the Poison card and removes the holder's first-held organ", () => {
    const player = new Player("player", 1);
    player.fillHandWithAttacks([
      buildAttackCard({ id: 1, action: "poison" }),
    ]);
    player.fillHandWithOrgans([
      new Organ("Heart", 7, 2),
      new Organ("Kidneys", 1, 2),
    ]);
    // discardAttackCard always refills — needs at least one card available
    // to draw, or Deck#getCard pops undefined off an empty pile.
    const attackCards = new Deck<AttackCard>(
      [buildAttackCard({ id: 99, action: "medicine" })],
      shuffle,
    );
    const { game, organCards } = buildGameWithOrganDeck(
      [player],
      attackCards,
    );

    game.forceResolvePoison(player.getID());

    assertEquals(
      player.getPlayerDetails().attackCards.some((c) => c.action === "poison"),
      false,
    );
    assertEquals(
      player.getPlayerDetails().organCards.map((o) => o.id),
      [1],
    );
    assertEquals(
      organCards.getDiscardPile().map((o) => o.getID()),
      [7],
    );
  });

  it("is a no-op when the player no longer actually holds Poison", () => {
    const player = new Player("player", 1);
    player.fillHandWithOrgans([new Organ("Heart", 7, 2)]);
    const attackCards = new Deck<AttackCard>([], shuffle);
    const game = buildGame([player], attackCards);

    game.forceResolvePoison(player.getID());

    assertEquals(
      player.getPlayerDetails().organCards.map((o) => o.id),
      [7],
    );
  });
});

describe("Game#itsAlive", () => {
  it("revives a discarded organ back into the player's hand, fully healed", () => {
    const player = new Player("player", 1);
    const attackCards = new Deck<AttackCard>([], shuffle);
    const { game, organCards } = buildGameWithOrganDeck(
      [player],
      attackCards,
    );
    organCards.addToDiscardPile(new Organ("Heart", 7, 0, 2));

    const revived = game.itsAlive(player.getID(), 7);

    assertEquals(revived !== -1, true);
    assertEquals(
      player.getPlayerDetails().organCards.map((o) => o.id),
      [7],
    );
    assertEquals(player.getPlayerDetails().organCards[0].health, 2);
    assertEquals(organCards.getDiscardPile(), []);
  });
});

describe("Game#exchangeHeartAndLungs / changeOrderOfPlay (situs-inversus)", () => {
  it("swaps the Heart and Lungs organs between whichever two players hold them", () => {
    const playerA = new Player("A", 1);
    const playerB = new Player("B", 2);
    playerA.fillHandWithOrgans([new Organ("Heart", 7, 2)]);
    playerB.fillHandWithOrgans([new Organ("Lungs", 13, 2)]);
    const attackCards = new Deck<AttackCard>([], shuffle);
    const game = buildGame([playerA, playerB], attackCards);

    game.exchangeHeartAndLungs();

    assertEquals(
      playerA.getPlayerDetails().organCards.map((o) => o.id),
      [13],
    );
    assertEquals(
      playerB.getPlayerDetails().organCards.map((o) => o.id),
      [7],
    );
  });

  it("does nothing when only one of Heart/Lungs is held by anyone", () => {
    const playerA = new Player("A", 1);
    playerA.fillHandWithOrgans([new Organ("Heart", 7, 2)]);
    const attackCards = new Deck<AttackCard>([], shuffle);
    const game = buildGame([playerA], attackCards);

    game.exchangeHeartAndLungs();

    assertEquals(
      playerA.getPlayerDetails().organCards.map((o) => o.id),
      [7],
    );
  });

  it("reverses turn direction", () => {
    const p1 = new Player("p1", 1);
    const p2 = new Player("p2", 2);
    const p3 = new Player("p3", 3);
    [p1, p2, p3].forEach((p, i) =>
      p.fillHandWithOrgans([new Organ(`organ-${i}`, i, 2)])
    );
    const attackCards = new Deck<AttackCard>([], shuffle);
    const game = buildGame([p1, p2, p3], attackCards);
    const before = game.getCurrentPlayerID();

    game.changeOrderOfPlay();
    game.currentTurnPlayed({
      name: "BY_THE_BOOK",
      card: buildAttackCard({ id: 1, action: "by-the-book" }),
      attackerID: before,
    });
    game.passTurn();

    // setFirstPlayer starts at index 0 (p1); reversing direction before the
    // first pass should move to the LAST player (p3), not the next (p2).
    assertEquals(game.getCurrentPlayerID(), p3.getID());
  });
});

describe("Game#discardAttackHandOfPlayer", () => {
  it("discards the player's entire attack hand into the attack deck's discard pile", () => {
    const player = new Player("player", 1);
    player.fillHandWithAttacks([
      buildAttackCard({ id: 10, action: "affliction" }),
      buildAttackCard({ id: 11, action: "medicine" }),
    ]);
    const attackCards = new Deck<AttackCard>([], shuffle);
    const game = buildGame([player], attackCards);

    game.discardAttackHandOfPlayer(player.getID());

    assertEquals(player.getPlayerDetails().attackCards, []);
    assertEquals(
      game.getDiscardAttackCards().map((c) => c.id).sort(),
      [10, 11],
    );
  });
});

describe("Game#chartMixup", () => {
  it("discards a player's entire hand and deals a fresh 5-card hand", () => {
    const player = new Player("player", 1);
    player.fillHandWithAttacks([
      buildAttackCard({ id: 900, action: "medicine" }),
      buildAttackCard({ id: 901, action: "medicine" }),
    ]);
    const filler = Array.from(
      { length: 10 },
      (_, i) => buildAttackCard({ id: i + 1, action: "medicine" }),
    );
    // chartMixup recycles the just-discarded cards into the draw pile
    // (Deck#refillDrawingPile appends to the end) before dealing (Deck#getCard
    // pops from the end) — with the identity `shuffle` used elsewhere in this
    // file, the just-discarded cards would be drawn straight back out. A
    // reversing "shuffle" avoids that coincidence without weakening the
    // assertion.
    const reverseShuffle = <T>(cards: T[]) => [...cards].reverse();
    const attackCards = new Deck<AttackCard>(filler, reverseShuffle);
    const game = buildGame([player], attackCards);

    game.chartMixup();

    // chartMixup recycles the discard pile into the draw pile as part of
    // the same call (refillDrawingPile), so the old cards end up back in
    // the *draw* pile rather than sitting in the discard pile — the
    // observable contract is just "gone from hand, hand refilled to 5".
    const handIDs = player.getPlayerDetails().attackCards.map((c) => c.id);
    assertEquals(handIDs.length, 5);
    assertEquals(handIDs.includes(900), false);
    assertEquals(handIDs.includes(901), false);
    assertEquals(game.getDiscardAttackCards(), []);
  });
});
