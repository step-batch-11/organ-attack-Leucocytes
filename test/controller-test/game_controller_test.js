import { assertEquals, assertThrows } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import GameController from "../../src/controllers/game_controller.js";
import ActionController from "../../src/controllers/action_controller.js";
import ActionStack from "../../src/models/action_stack.js";

describe("GameController", () => {
  let actionStack;
  let actionController;
  let gameController;
  const actions = {
    affliction: { name: "AFFLICTION" },
    contagious: { name: "CONTAGIOUS" },
    immunity: { name: "IMMUNITY_BOOST" },
  };

  beforeEach(() => {
    actionStack = new ActionStack();
    actionController = new ActionController(actionStack);
    gameController = new GameController(actionController);
  });

  describe("play card method", () => {
    it("Should add action to actionStack when played a card", () => {
      const action = actions.affliction;
      const { success } = gameController.playCard(action);
      assertEquals(success, true);
      assertEquals(actionStack.peek(), action);
    });

    it("Should throw an error when action is not a object", () => {
      const action = "hello world";
      assertThrows(
        () => gameController.playCard(action),
        Error,
        "requires a action to play a card",
      );
    });

    it("Should fail to add action to actionStack since 1st card is IMMUNITY_BOOST", () => {
      const action = actions.immunity;
      const expectedMessage = "response cannot be the first action";
      const { success, message } = gameController.playCard(action);
      assertEquals(success, false);
      assertEquals(message, expectedMessage);
    });

    it("Should fail to add action to actionStack since CONTAGIOUS can only be plays after AFFLICTION", () => {
      const action1 = actions.affliction;
      const action2 = actions.immunity;
      const action3 = actions.contagious;
      gameController.playCard(action1);
      gameController.playCard(action2);
      const expectedMessage = "CONTAGIOUS can only be played after affliction";
      const { success, message } = gameController.playCard(action3);
      assertEquals(success, false);
      assertEquals(message, expectedMessage);
    });
  });

  describe("Construct action method", () => {
    const game = {
      getPlayer(id) {
        return { name: `Player${id}` };
      },
      discardAttackCard(attackerID, attackCardID, isInstant) {
        return { action: "attack-card", attackerID, attackCardID, isInstant };
      },
    };
    it("should create an action for an event", () => {
      const attackerID = 1;
      const attackCardID = 1;
      const isInstant = false;
      const organCardID = 1;
      const opponentID = 2;

      const expectedAction = {
        name: "ATTACK_CARD",
        actor: { name: "Player1" },
        target: { player: { name: "Player2" }, organID: organCardID },
        card: {
          action: "attack-card",
          attackerID,
          attackCardID,
          isInstant,
        },
      };

      const action = gameController.constructAction(
        { attackerID, attackCardID, isInstant, organCardID, opponentID },
        game,
      );

      assertEquals(action, expectedAction);
    });
  });

  describe("resolve action method", () => {
    let actionRecord;
    let game;
    beforeEach(() => {
      actionRecord = [];

      game = {
        apply(action) {
          actionRecord.push(action);
        },
      };
    });

    it("should resolve the action [AFFLICTION , IMMUNITY_BOOST]; nothing to apply", () => {
      const { affliction, immunity } = actions;
      gameController.playCard(affliction);
      gameController.playCard(immunity);
      const { success } = gameController.resolveAction(game);
      assertEquals(success, true);
      assertEquals(actionRecord, []);
    });

    it("should resolve the action [AFFLICTION , IMMUNITY_BOOST,IMMUNITY_BOOST]", () => {
      const { affliction, immunity } = actions;
      gameController.playCard(affliction);
      gameController.playCard(immunity);
      gameController.playCard(immunity);
      const { success } = gameController.resolveAction(game);
      assertEquals(success, true);
      assertEquals(actionRecord, [affliction]);
    });

    it("should resolve the action [AFFLICTION]", () => {
      const { affliction } = actions;
      gameController.playCard(affliction);
      const { success } = gameController.resolveAction(game);
      assertEquals(success, true);
      assertEquals(actionRecord, [affliction]);
    });

    it("should resolve the action [AFFLICTION, CONTAGIOUS]", () => {
      const { affliction, contagious } = actions;
      gameController.playCard(affliction);
      gameController.playCard(contagious);
      const { success } = gameController.resolveAction(game);
      assertEquals(success, true);
      assertEquals(actionRecord, [affliction, contagious]);
    });
  });
});
