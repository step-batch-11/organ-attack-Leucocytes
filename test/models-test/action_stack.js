import { assertEquals } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import ActionStack from "../../src/models/action_stack.js";

describe("methods of ActionStack", () => {
  let actionStack;
  beforeEach(() => {
    actionStack = new ActionStack();
  });
  it("should return the no of element in the stack", () => {
    assertEquals(actionStack.length(), 0);
  });

  it("should add element in the stack", () => {
    const element = "Hello";
    actionStack.add(element);
    assertEquals(actionStack.peek(), element);
    assertEquals(actionStack.length(), 1);
  });

  it("should consume the peek element in the stack", () => {
    const element = "Hello";
    actionStack.add(element);
    assertEquals(actionStack.peek(), element);
    assertEquals(actionStack.length(), 1);
    assertEquals(actionStack.consume(), element);
    assertEquals(actionStack.length(), 0);
  });

  it("should flush all the element from the stack", () => {
    const elements = ["hello", "world"];
    elements.forEach((element) => actionStack.add(element));
    assertEquals(actionStack.length(), 2);
    assertEquals(actionStack.flush(), elements);
    assertEquals(actionStack.length(), 0);
  });
});
