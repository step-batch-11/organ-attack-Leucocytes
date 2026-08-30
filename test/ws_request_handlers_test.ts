import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { createRequestHandlers } from "../src/ws_request_handlers.ts";
import GameController from "../src/controllers/game_controller.ts";
import ActionController from "../src/controllers/action_controller.ts";
import ActionStack from "../src/models/action_stack.ts";
import Timer from "../src/models/timer.ts";
import { Game } from "../src/models/game.ts";
import { Player } from "../src/models/player.ts";
import { Organ } from "../src/models/organ.ts";
import { Deck } from "../src/models/deck.ts";
import { Dealer } from "../src/models/dealer.ts";
import { AfflictionHandler } from "../src/models/affliction_handler.ts";
import { TurnManager } from "../src/models/turn_manager.ts";
import type { AttackCard } from "../src/types/cards.ts";
import type { RoomGame } from "../src/types/context.ts";

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

let fillerCardID = 900;

const buildRoomGame = () => {
  const attacker = new Player("attacker", 1);
  const opponent = new Player("opponent", 2);
  const players = [attacker, opponent];

  players.forEach((player, i) => {
    player.fillHandWithOrgans([new Organ(`organ-${i}`, i, 2)]);
  });

  // A supply of harmless filler cards for the draw pile — refillAttackCard
  // draws from here whenever a discard/audit/remove-card empties a slot.
  const fillerCards = Array.from(
    { length: 20 },
    () => buildAttackCard({ id: fillerCardID++, action: "sedate" }),
  );

  const attackCards = new Deck<AttackCard>(fillerCards, shuffle);
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

  const actionStack = new ActionStack();
  const actionController = new ActionController(actionStack);
  const timer = new Timer(999999);
  const gameController = new GameController(actionController, timer);

  return { game, gameController, timer, attacker, opponent };
};

describe("createRequestHandlers", () => {
  describe("action — authorization", () => {
    it("plays the card as the authenticated playerID, ignoring a spoofed attackerID in the payload", async () => {
      const { game, gameController, attacker, opponent } = buildRoomGame();
      attacker.fillHandWithAttacks([
        buildAttackCard({ id: 10, action: "by-the-book", isBlockable: false }),
      ]);
      const games: Record<string, RoomGame> = { 101: { game, gameController } };
      const updateGameState = () => {};
      const handlers = createRequestHandlers(games, updateGameState);

      // Spoofed attackerID (opponent's id) in the payload — the handler must
      // still act as the authenticated playerID (attacker.getID()).
      const result = await handlers.action("101", attacker.getID(), {
        attackerID: opponent.getID(),
        attackCardID: 10,
      });

      assertEquals(result, { success: true });
      // The card came out of the attacker's hand, not the opponent's.
      assertEquals(
        attacker.getPlayerDetails().attackCards.some((c) => c.id === 10),
        false,
      );
    });

    it("rejects a card the authenticated player does not hold", () => {
      const { game, gameController, attacker } = buildRoomGame();
      const games: Record<string, RoomGame> = { 101: { game, gameController } };
      const handlers = createRequestHandlers(games, () => {});

      let error: Error | undefined;
      try {
        handlers.action("101", attacker.getID(), { attackCardID: 999 });
      } catch (e) {
        error = e as Error;
      }
      assertEquals(error?.message, "You do not hold that card");
    });

    it("rejects a non-instant card played out of turn", () => {
      const { game, gameController, opponent } = buildRoomGame();
      opponent.fillHandWithAttacks([
        buildAttackCard({ id: 20, action: "by-the-book", isBlockable: false }),
      ]);
      const games: Record<string, RoomGame> = { 101: { game, gameController } };
      const handlers = createRequestHandlers(games, () => {});

      // It's attacker's turn (setFirstPlayer defaults to index 0) — opponent
      // attempting to play is out of turn.
      let error: Error | undefined;
      try {
        handlers.action("101", opponent.getID(), { attackCardID: 20 });
      } catch (e) {
        error = e as Error;
      }
      assertEquals(error?.message, "It is not your turn");
    });

    it("allows an instant card to be played out of turn (e.g. Cryopreservation played reactively)", async () => {
      const { game, gameController, opponent } = buildRoomGame();
      opponent.fillHandWithAttacks([
        buildAttackCard({
          id: 30,
          action: "cryopreservation",
          isInstant: true,
          isBlockable: false,
        }),
      ]);
      const games: Record<string, RoomGame> = { 101: { game, gameController } };
      const handlers = createRequestHandlers(games, () => {});

      const result = await handlers.action("101", opponent.getID(), {
        attackCardID: 30,
        isInstant: true,
      });

      assertEquals(result, { success: true });
    });
  });

  describe("action — concurrent double-action race (regression)", () => {
    it("rejects a second, unrelated non-instant action while the first's response window is still open, instead of merging both into one resolution pass", () => {
      const { game, gameController, attacker } = buildRoomGame();
      attacker.fillHandWithAttacks([
        buildAttackCard({ id: 80, action: "medicine", isBlockable: true }),
        // Non-instant (matches real card data), so this second attempt must
        // be rejected on the ActionController.add() check this test targets
        // — not the ws_request_handlers "it is not your turn" check, since
        // it's still the attacker's own turn.
        buildAttackCard({ id: 82, action: "by-the-book", isBlockable: false }),
      ]);
      const games: Record<string, RoomGame> = { 101: { game, gameController } };
      const handlers = createRequestHandlers(games, () => {});

      // Attacker plays a blockable card — opens a response window that won't
      // resolve on its own (buildRoomGame's Timer duration is 999999ms).
      handlers.action("101", attacker.getID(), { attackCardID: 80 });

      // A second, unrelated non-instant card must be rejected outright
      // rather than silently joining the same still-open window.
      let error: Error | undefined;
      try {
        handlers.action("101", attacker.getID(), { attackCardID: 82 });
      } catch (e) {
        error = e as Error;
      }

      assertEquals(
        error?.message,
        "another action is still awaiting resolution",
      );
      // Rejected before ever being removed from the attacker's hand.
      assertEquals(
        attacker.getPlayerDetails().attackCards.some((c) => c.id === 82),
        true,
      );
    });

    it("allows an instant card that isn't a reactive-only type (e.g. Cryopreservation) to join an already-open window (regression: a live game froze because Cryopreservation was wrongly rejected by an earlier fix's hardcoded action-name allowlist instead of checking card.isInstant)", () => {
      const { game, gameController, attacker, opponent } = buildRoomGame();
      attacker.fillHandWithAttacks([
        buildAttackCard({ id: 80, action: "medicine", isBlockable: true }),
      ]);
      opponent.fillHandWithAttacks([
        buildAttackCard({
          id: 81,
          action: "cryopreservation",
          isInstant: true,
          isBlockable: true,
        }),
      ]);
      const games: Record<string, RoomGame> = { 101: { game, gameController } };
      const handlers = createRequestHandlers(games, () => {});

      handlers.action("101", attacker.getID(), { attackCardID: 80 });

      let error: Error | undefined;
      try {
        handlers.action("101", opponent.getID(), {
          attackCardID: 81,
          isInstant: true,
        });
      } catch (e) {
        error = e as Error;
      }

      assertEquals(error, undefined);
    });

    it("still allows a legitimate response (e.g. Immunity Boost) to join the same still-open window", () => {
      const { game, gameController, attacker, opponent } = buildRoomGame();
      attacker.fillHandWithAttacks([
        buildAttackCard({ id: 90, action: "affliction", isBlockable: true }),
      ]);
      opponent.fillHandWithAttacks([
        buildAttackCard({
          id: 91,
          action: "immunity-boost",
          isInstant: true,
          isBlockable: false,
        }),
      ]);
      const games: Record<string, RoomGame> = { 101: { game, gameController } };
      const handlers = createRequestHandlers(games, () => {});

      handlers.action("101", attacker.getID(), {
        attackCardID: 90,
        opponentID: opponent.getID(),
        organCardID: 1,
      });

      let error: Error | undefined;
      try {
        handlers.action("101", opponent.getID(), {
          attackCardID: 91,
          isInstant: true,
        });
      } catch (e) {
        error = e as Error;
      }

      assertEquals(error, undefined);
    });
  });

  describe("remove-card", () => {
    it("discards using the authenticated playerID, ignoring a spoofed playerID in the payload", () => {
      const { game, gameController, attacker, opponent } = buildRoomGame();
      attacker.fillHandWithAttacks([
        buildAttackCard({ id: 40, action: "affliction" }),
      ]);
      const games: Record<string, RoomGame> = { 101: { game, gameController } };
      const handlers = createRequestHandlers(games, () => {});

      const result = handlers["remove-card"]("101", attacker.getID(), {
        attackCardID: 40,
        playerID: opponent.getID(),
      });

      assertEquals(result, { success: true });
      assertEquals(
        attacker.getPlayerDetails().attackCards.some((c) => c.id === 40),
        false,
      );
    });

    it("rejects when it is not the requester's turn", () => {
      const { game, gameController, opponent } = buildRoomGame();
      opponent.fillHandWithAttacks([
        buildAttackCard({ id: 41, action: "affliction" }),
      ]);
      const games: Record<string, RoomGame> = { 101: { game, gameController } };
      const handlers = createRequestHandlers(games, () => {});

      let threw = false;
      try {
        handlers["remove-card"]("101", opponent.getID(), { attackCardID: 41 });
      } catch {
        threw = true;
      }
      assertEquals(threw, true);
    });

    it("caps discards at 2 per turn", () => {
      const { game, gameController, attacker } = buildRoomGame();
      attacker.fillHandWithAttacks([
        buildAttackCard({ id: 50, action: "affliction" }),
        buildAttackCard({ id: 51, action: "affliction" }),
        buildAttackCard({ id: 52, action: "affliction" }),
      ]);
      const games: Record<string, RoomGame> = { 101: { game, gameController } };
      const handlers = createRequestHandlers(games, () => {});

      handlers["remove-card"]("101", attacker.getID(), { attackCardID: 50 });
      handlers["remove-card"]("101", attacker.getID(), { attackCardID: 51 });

      let threw = false;
      try {
        handlers["remove-card"]("101", attacker.getID(), { attackCardID: 52 });
      } catch {
        threw = true;
      }
      assertEquals(threw, true);
      // Neither discard advanced the turn — remove-card never itself flips
      // whose turn it is.
      assertEquals(game.getCurrentPlayerID(), attacker.getID());
    });
  });

  describe("query-opponent-hand / audit-discard — clinical-audit gating", () => {
    it("rejects query-opponent-hand when the requester holds no clinical-audit card", () => {
      const { game, gameController, attacker } = buildRoomGame();
      const games: Record<string, RoomGame> = { 101: { game, gameController } };
      const handlers = createRequestHandlers(games, () => {});

      let threw = false;
      try {
        handlers["query-opponent-hand"]("101", attacker.getID(), {
          opponentID: 2,
        });
      } catch {
        threw = true;
      }
      assertEquals(threw, true);
    });

    it("allows query-opponent-hand while the requester holds an unplayed clinical-audit card", () => {
      const { game, gameController, attacker, opponent } = buildRoomGame();
      attacker.fillHandWithAttacks([
        buildAttackCard({ id: 60, action: "clinical-audit", isInstant: true }),
      ]);
      opponent.fillHandWithAttacks([
        buildAttackCard({ id: 61, action: "affliction" }),
      ]);
      const games: Record<string, RoomGame> = { 101: { game, gameController } };
      const handlers = createRequestHandlers(games, () => {});

      const result = handlers["query-opponent-hand"]("101", attacker.getID(), {
        opponentID: opponent.getID(),
      }) as { attackCards: AttackCard[] };

      assertEquals(result.attackCards.map((c) => c.id), [61]);
    });

    it("rejects audit-discard when the requester holds no clinical-audit card", () => {
      const { game, gameController, attacker, opponent } = buildRoomGame();
      opponent.fillHandWithAttacks([
        buildAttackCard({ id: 62, action: "affliction" }),
      ]);
      const games: Record<string, RoomGame> = { 101: { game, gameController } };
      const handlers = createRequestHandlers(games, () => {});

      let threw = false;
      try {
        handlers["audit-discard"]("101", attacker.getID(), {
          opponentID: opponent.getID(),
          attackCardID: 62,
        });
      } catch {
        threw = true;
      }
      assertEquals(threw, true);
    });

    it("allows audit-discard while the requester holds an unplayed clinical-audit card", () => {
      const { game, gameController, attacker, opponent } = buildRoomGame();
      attacker.fillHandWithAttacks([
        buildAttackCard({ id: 63, action: "clinical-audit", isInstant: true }),
      ]);
      opponent.fillHandWithAttacks([
        buildAttackCard({ id: 64, action: "affliction" }),
      ]);
      const games: Record<string, RoomGame> = { 101: { game, gameController } };
      const handlers = createRequestHandlers(games, () => {});

      const result = handlers["audit-discard"]("101", attacker.getID(), {
        opponentID: opponent.getID(),
        attackCardID: 64,
      });

      assertEquals(result, { success: true });
      assertEquals(
        opponent.getPlayerDetails().attackCards.some((c) => c.id === 64),
        false,
      );
    });
  });

  describe("per-room isolation", () => {
    it("gives each room its own GameController/Timer/ActionStack instance", () => {
      const roomA = buildRoomGame();
      const roomB = buildRoomGame();

      const games: Record<string, RoomGame> = {
        A: { game: roomA.game, gameController: roomA.gameController },
        B: { game: roomB.game, gameController: roomB.gameController },
      };

      assertEquals(games.A.gameController === games.B.gameController, false);
    });

    it("keeps two rooms' Timer independent — Room B starting its response window must not reject Room A's still-pending one (regression: shared singleton)", async () => {
      const roomA = buildRoomGame();
      const roomB = buildRoomGame();

      const cardA = buildAttackCard({
        id: 70,
        action: "medicine",
        isBlockable: true,
      });
      const cardB = buildAttackCard({
        id: 71,
        action: "medicine",
        isBlockable: true,
      });

      const donePromiseA = roomA.gameController.playCard({
        name: "MEDICINE",
        card: cardA,
        attackerID: roomA.attacker.getID(),
      });

      // Room B independently starting its own response window — under the
      // old shared-singleton design this would reject Room A's pending
      // promise via Timer.start()'s unconditional this.#reject("rejected").
      roomB.gameController.playCard({
        name: "MEDICINE",
        card: cardB,
        attackerID: roomB.attacker.getID(),
      });

      roomA.timer.end();
      const result = await donePromiseA;
      assertEquals(result, { success: true });
    });
  });
});
