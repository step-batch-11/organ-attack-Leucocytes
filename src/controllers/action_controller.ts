import type ActionStack from "../models/action_stack.ts";
import type { ActionInput } from "../types/entities.ts";
import type { ActionResult } from "../types/game.ts";

export default class ActionController {
  #stack: ActionStack;
  constructor(stack: ActionStack) {
    this.#stack = stack;
  }

  add(action: ActionInput): ActionResult {
    const responseActions = new Set([
      // i think these are for the defense or replying for the attack
      "IMMUNITY_BOOST",
      "METASTASIS",
      "CONTAGIOUS",
    ]);

    const afflictionResponses = new Set(["METASTASIS", "CONTAGIOUS"]); // these are for the affliction,
    // so they can only be played after affliction

    const itemCount = this.#stack.length();

    if (itemCount === 0 && responseActions.has(action.name)) {
      return { success: false, message: "response cannot be the first action" };
    }

    if (
      itemCount > 0 &&
      this.#stack.peek()?.name !== "AFFLICTION" &&
      afflictionResponses.has(action.name)
    ) {
      return {
        success: false,
        message: `${action.name} can only be played after affliction`,
      };
    }

    this.#stack.add(action);

    return { success: true };
  }

  resolve(): ActionResult<ActionInput[]> {
    if (this.#stack.length() === 0) {
      return { success: false, message: "Nothing to resolve in stack" };
    }

    const actions = this.#stack.flush();
    const resolvedActions: ActionInput[] = [];
    let immunityBoostCount = 0;

    for (let index = actions.length - 1; index >= 0; index--) {
      const action = actions[index];

      if (action.name === "IMMUNITY_BOOST") {
        immunityBoostCount += 1;
        continue;
      }

      if (immunityBoostCount > 0) {
        if (immunityBoostCount % 2 === 1) {
          immunityBoostCount = 0;
          continue;
        }
        immunityBoostCount = 0;
      }

      resolvedActions.push(action);
    }

    return { success: true, data: resolvedActions.reverse() };
  }
}
