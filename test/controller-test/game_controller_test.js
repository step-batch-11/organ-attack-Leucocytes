import { assertEquals, assertThrows } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import GameController from "../../src/controllers/game_controller.js";
import ActionController from "../../src/controllers/action_controller.js";
import ActionStack from "../../src/models/action_stack.js";

describe("GameController", () => {
  let actionStack;
  let actionController;
  let gameController;
  const timer = {
    start() {
      return "Dummy Promise";
    },
  };
  const target = { opponentID: 1, organCardID: 1 };
  const actions = {
    affliction: {
      name: "AFFLICTION",
      ...target,
      card: { action: "affliction" },
    },
    contagious: { name: "CONTAGIOUS", card: { action: "contagious" } },
    immunity: { name: "IMMUNITY_BOOST", card: { action: "immunity-boost" } },
  };

  beforeEach(() => {
    actionStack = new ActionStack();
    actionController = new ActionController(actionStack);
    gameController = new GameController(actionController, timer);
  });

  describe("play card method", () => {
    it("Should add action to actionStack when played a card", () => {
      const action = actions.affliction;
      const promise = gameController.playCard(action);
      assertEquals(promise, "Dummy Promise");
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

      assertThrows(
        () => gameController.playCard(action),
        Error,
        expectedMessage,
      );
    });

    it("Should fail to add action to actionStack since CONTAGIOUS can only be plays after AFFLICTION", () => {
      const action1 = actions.affliction;
      const action2 = actions.immunity;
      const action3 = actions.contagious;
      gameController.playCard(action1);
      gameController.playCard(action2);
      const expectedMessage = "CONTAGIOUS can only be played after affliction";
      assertThrows(
        () => gameController.playCard(action3),
        Error,
        expectedMessage,
      );
    });
  });

  describe("resolve action method", () => {
    let game;
    let afflictionRecord;
    beforeEach(() => {
      afflictionRecord = [];

      game = {
        passTurn() {
          return "Passed turn";
        },
        afflictOrganOfOpponent(opponentID, organCardID) {
          afflictionRecord.push({ opponentID, organCardID });
        },
      };
    });

    it("should resolve the action [AFFLICTION , IMMUNITY_BOOST]; nothing to apply", () => {
      const { affliction, immunity } = actions;
      gameController.playCard(affliction);
      gameController.playCard(immunity);
      const { success } = gameController.resolveAction(game);
      assertEquals(success, true);
      assertEquals(afflictionRecord, []);
    });

    it("should resolve the action [AFFLICTION , IMMUNITY_BOOST,IMMUNITY_BOOST]", () => {
      const { affliction, immunity } = actions;
      gameController.playCard(affliction);
      gameController.playCard(immunity);
      gameController.playCard(immunity);
      const { success } = gameController.resolveAction(game);
      assertEquals(success, true);

      const opponentID = affliction.opponentID;
      const organCardID = affliction.organCardID;
      assertEquals(afflictionRecord, [{ opponentID, organCardID }]);
    });

    it("should resolve the action [AFFLICTION]", () => {
      const { affliction } = actions;
      gameController.playCard(affliction);
      const { success } = gameController.resolveAction(game);
      assertEquals(success, true);
      const opponentID = affliction.opponentID;
      const organCardID = affliction.organCardID;
      assertEquals(afflictionRecord, [{ opponentID, organCardID }]);
    });

    // ignored because contagious is not implemented yet
    it.ignore("should resolve the action [AFFLICTION, CONTAGIOUS]", () => {
      const { affliction, contagious } = actions;
      gameController.playCard(affliction);
      gameController.playCard(contagious);
      const { success } = gameController.resolveAction(game);
      assertEquals(success, true);
      assertEquals(actionRecord, [affliction, contagious]);
    });
  });
});
