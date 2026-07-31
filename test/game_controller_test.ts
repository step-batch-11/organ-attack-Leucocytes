import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
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

const shuffle = <T>(cards: T[]) => cards;

const buildAttackCard = (
  overrides: Pick<AttackCard, "action" | "isBlockable">,
): AttackCard => ({
  id: 0,
  name: overrides.action,
  type: overrides.action,
  isInstant: false,
  afflictableOrgans: [],
  removableOrgans: [],
  isWild: false,
  afflictPoints: 0,
  Desc: "",
  ...overrides,
});

const buildGameController = (duration = 999999) => {
  const actionStack = new ActionStack();
  const actionController = new ActionController(actionStack);
  const timer = new Timer(duration);
  const gameController = new GameController(actionController, timer);
  return { gameController, timer };
};

const buildThreePlayerGame = () => {
  const players = [
    new Player("attacker", 1),
    new Player("bystanderA", 2),
    new Player("bystanderB", 3),
  ];

  players.forEach((player, i) => {
    player.fillHandWithOrgans([new Organ(`organ-${i}`, i, 2)]);
  });

  const attackCards = new Deck([], shuffle);
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

  return { game, players };
};

describe("GameController", () => {
  describe("playCard non-blockable fast path", () => {
    it("resolves immediately for a non-blockable card instead of waiting out the response timer", async () => {
      const { gameController } = buildGameController(999999);
      const card = buildAttackCard({
        action: "clinical-audit",
        isBlockable: false,
      });
      const action = {
        name: "CLINICAL_AUDIT",
        card,
        attackerID: 1,
        attackCardID: 50,
      };

      // With a 999999ms timer, this would hang the test if playCard actually
      // waited it out instead of skipping the response window.
      const result = await gameController.playCard(action);
      assertEquals(result, { success: true });
    });

    it("still waits out the response window for a blockable card", async () => {
      const { gameController, timer } = buildGameController(999999);
      const card = buildAttackCard({
        action: "medicine",
        isBlockable: true,
      });
      const action = {
        name: "MEDICINE",
        card,
        attackerID: 1,
        attackCardID: 60,
      };

      const donePromise = gameController.playCard(action);
      const PENDING = Symbol("pending");
      const raceResult = await Promise.race([
        donePromise,
        new Promise((resolve) => setTimeout(() => resolve(PENDING), 20)),
      ]);

      assertEquals(raceResult, PENDING);

      timer.end();
      await donePromise;
    });
  });

  describe("#ACTIONS dispatch table", () => {
    it("applies cryopreservation's sleep effect when resolved (regression: dispatch key must match the card's actual action string)", () => {
      const { gameController } = buildGameController();
      const { game, players } = buildThreePlayerGame();
      const [attacker, bystanderA, bystanderB] = players;

      const card = buildAttackCard({
        action: "cryopreservation",
        isBlockable: false,
      });
      const action = {
        name: "CRYOPRESERVATION",
        card,
        attackerID: attacker.getID(),
      };

      gameController.playCard(action);
      gameController.resolveAction(game);

      assertEquals(bystanderA.getPlayerDetails().isSleeping, true);
      assertEquals(bystanderB.getPlayerDetails().isSleeping, true);
      assertEquals(attacker.getPlayerDetails().isSleeping, false);
    });

    it("resolves a clinical-audit action without error (dispatch entry exists for it)", () => {
      const { gameController } = buildGameController();
      const { game } = buildThreePlayerGame();

      const card = buildAttackCard({
        action: "clinical-audit",
        isBlockable: false,
      });
      const action = {
        name: "CLINICAL_AUDIT",
        card,
        attackerID: 1,
        attackCardID: 50,
      };

      gameController.playCard(action);
      const result = gameController.resolveAction(game);

      assertEquals(result, { success: true });
    });

    it("does not throw and reports failure when It's Alive targets an organCardID not in the discard pile (regression: sentinel -1 must not be dereferenced)", () => {
      const { gameController } = buildGameController();
      const { game, players } = buildThreePlayerGame();
      const [attacker] = players;

      const card = buildAttackCard({
        action: "itsAlive",
        isBlockable: false,
      });
      const action = {
        name: "ITS_ALIVE",
        card,
        attackerID: attacker.getID(),
        organCardID: 999999,
      };

      gameController.playCard(action);
      game.currentTurnPlayed(action);

      const before = game.getCurrentPlayerID();

      // Must not throw — the bug this guards against was a thrown TypeError
      // inside #applyActions (dereferencing the -1 sentinel) that prevented
      // the game.passTurn() call further down in that same method from ever
      // running, soft-locking the room.
      const result = gameController.resolveAction(game);
      assertEquals(result, { success: true });

      assertEquals(game.getCurrentPlayerID() !== before, true);
    });

    it("puts the current player to sleep when Narcolepsy targets them, and that sleep survives this same resolution's passTurn (regression: TurnManager's pre-decrement used to cancel it immediately)", async () => {
      const { gameController, timer } = buildGameController(999999);
      const { game, players } = buildThreePlayerGame();
      const [currentPlayer, nextPlayer] = players;

      const card = buildAttackCard({
        action: "narcolepsy",
        isBlockable: true,
      });
      const action = {
        name: "NARCOLEPSY",
        card,
        attackerID: nextPlayer.getID(),
        opponentID: currentPlayer.getID(),
      };

      game.currentTurnPlayed(action);
      const done = gameController.playCard(action);
      timer.end();
      await done;
      gameController.resolveAction(game);

      assertEquals(currentPlayer.getPlayerDetails().isSleeping, true);

      game.passTurn();

      // currentPlayer's own upcoming turn is what should consume the sleep
      // point, not the pass that granted it — so they're skipped this pass,
      // and only lose the sleep point once their turn actually comes around.
      assertEquals(game.getCurrentPlayerID() !== currentPlayer.getID(), true);
    });
  });
});
