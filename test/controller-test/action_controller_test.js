import { assert, assertEquals } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import ActionController from "../../src/controllers/action_controller.js";
import ActionStack from "../../src/models/action_stack.js";

describe("ActionController", () => {
  let actionController;
  let actionStack;
  beforeEach(() => {
    actionStack = new ActionStack();
    actionController = new ActionController(actionStack);
  });
  describe("Adding Action in Action Controller", () => {
    it("should add new action in actionController", () => {
      const action = { name: "AFFLICTION" };
      actionController.add(action);
      assertEquals(actionStack.peek(), action);
    });

    it("should fail to add IMMUNITY_BOOST as first action", () => {
      const action = { name: "IMMUNITY_BOOST" };
      const result = actionController.add(action);
      const message = "response cannot be the first action";
      assertEquals(result.message, message);
    });

    it("should fail to add METASTASIS as first action", () => {
      const action = { name: "METASTASIS" };
      const result = actionController.add(action);
      const message = "response cannot be the first action";
      assertEquals(result.message, message);
    });

    it("should fail to add CONTAGIOUS as first action", () => {
      const action = { name: "CONTAGIOUS" };
      const result = actionController.add(action);
      const message = "response cannot be the first action";
      assertEquals(result.message, message);
    });

    it("should add CONTAGIOUS after AFFLICTION", () => {
      const affliction = { name: "AFFLICTION" };
      const contagious = { name: "CONTAGIOUS" };
      actionController.add(affliction);
      const { success } = actionController.add(contagious);

      assert(success);
    });

    it("should not add CONTAGIOUS after IMMUNITY_BOOST", () => {
      const affliction = { name: "AFFLICTION" };
      const immunity = { name: "IMMUNITY_BOOST" };
      const contagious = { name: "CONTAGIOUS" };
      actionController.add(affliction);
      actionController.add(immunity);
      const result = actionController.add(contagious);
      const expectedMessage = "CONTAGIOUS can only be played after affliction";
      assertEquals(result.message, expectedMessage);
    });
  });

  describe("Resolving Action in ActionController", () => {
    it("should resolve the action", () => {
      const action = { name: "AFFLICTION" };
      actionController.add(action);
      assertEquals(actionStack.peek(), action);
      const resolvedActions = actionController.resolve();
      assertEquals(resolvedActions.data, [action]);
    });

    it("should not resolve any action as its stack is EMPTY", () => {
      const message = "Nothing to resolve in stack";
      const result = actionController.resolve();
      assertEquals(result.message, message);
    });

    it("should consume all the actions as it is [ AFFLICTION , IMMUNITY_BOOST ]", () => {
      const affliction = { name: "AFFLICTION" };
      const immunity = { name: "IMMUNITY_BOOST" };

      actionController.add(affliction);
      assertEquals(actionStack.peek(), affliction);

      actionController.add(immunity);
      assertEquals(actionStack.peek(), immunity);

      const resolvedActions = actionController.resolve();
      assertEquals(resolvedActions.data, []);
    });

    it("should consume last two [ AFFLICTION , IMMUNITY_BOOST, IMMUNITY_BOOST ]", () => {
      const affliction = { name: "AFFLICTION" };
      const immunity = { name: "IMMUNITY_BOOST" };

      actionController.add(affliction);
      assertEquals(actionStack.peek(), affliction);

      actionController.add(immunity);
      assertEquals(actionStack.peek(), immunity);
      actionController.add(immunity);
      assertEquals(actionStack.peek(), immunity);

      const resolvedActions = actionController.resolve();
      assertEquals(resolvedActions.data, [affliction]);
    });

    it("should return [ AFFLICTION , CONTAGIOUS ]", () => {
      const affliction = { name: "AFFLICTION" };
      const contagious = { name: "CONTAGIOUS" };

      actionController.add(affliction);
      assertEquals(actionStack.peek(), affliction);

      actionController.add(contagious);
      assertEquals(actionStack.peek(), contagious);

      const resolvedActions = actionController.resolve();
      assertEquals(resolvedActions.data, [affliction, contagious]);
    });
  });
});
