import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import PoisonForcer from "../src/models/poison_forcer.ts";
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

const buildGame = (players: Player[]) => {
  // At least one filler card — discarding Poison always refills, which pops
  // off the draw pile.
  const attackCards = new Deck<AttackCard>(
    [buildAttackCard({ id: 999, action: "medicine" })],
    shuffle,
  );
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
  return game;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("PoisonForcer", () => {
  it("does nothing while nobody holds Poison", async () => {
    const player = new Player("player", 1);
    player.fillHandWithOrgans([new Organ("Heart", 7, 2)]);
    const game = buildGame([player]);
    let forceResolveCalls = 0;
    const forcer = new PoisonForcer(game, () => forceResolveCalls++, 20);

    forcer.check();
    await sleep(40);

    assertEquals(forceResolveCalls, 0);
    assertEquals(player.getPlayerDetails().organCards.length, 1);
  });

  it("auto-resolves the holder's Poison after the grace period elapses", async () => {
    const player = new Player("player", 1);
    player.fillHandWithAttacks([
      buildAttackCard({ id: 1, action: "poison" }),
    ]);
    player.fillHandWithOrgans([new Organ("Heart", 7, 2)]);
    const game = buildGame([player]);
    let forceResolveCalls = 0;
    const forcer = new PoisonForcer(game, () => forceResolveCalls++, 20);

    forcer.check();
    await sleep(40);

    assertEquals(forceResolveCalls, 1);
    assertEquals(
      player.getPlayerDetails().attackCards.some((c) => c.action === "poison"),
      false,
    );
    assertEquals(player.getPlayerDetails().organCards, []);
  });

  it("does not restart the clock when check() is called again for the same still-stalled holder", async () => {
    const player = new Player("player", 1);
    player.fillHandWithAttacks([
      buildAttackCard({ id: 1, action: "poison" }),
    ]);
    player.fillHandWithOrgans([new Organ("Heart", 7, 2)]);
    const game = buildGame([player]);
    let forceResolveCalls = 0;
    const forcer = new PoisonForcer(game, () => forceResolveCalls++, 30);

    forcer.check();
    await sleep(15);
    forcer.check(); // same holder — must not push the deadline back
    await sleep(20);

    // Total elapsed (~35ms) exceeds the original 30ms deadline; a reset
    // would still be pending at this point.
    assertEquals(forceResolveCalls, 1);
  });

  it("cancels the pending timeout when the holder resolves Poison themselves before it fires", async () => {
    const player = new Player("player", 1);
    player.fillHandWithAttacks([
      buildAttackCard({ id: 1, action: "poison" }),
    ]);
    player.fillHandWithOrgans([new Organ("Heart", 7, 2)]);
    const game = buildGame([player]);
    let forceResolveCalls = 0;
    const forcer = new PoisonForcer(game, () => forceResolveCalls++, 20);

    forcer.check();
    game.discardAttackCard(player.getID(), 1);
    game.removeOrgan(player.getID(), 7);
    forcer.check(); // holder no longer holds Poison — clears the pending timeout

    await sleep(40);

    assertEquals(forceResolveCalls, 0);
  });
});
