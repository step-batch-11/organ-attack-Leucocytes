import type { ActionInput } from "../types/entities.ts";
import type { ActionResult } from "../types/game.ts";

export default class ActionStack {
  #stack: ActionInput[];
  constructor() {
    this.#stack = [];
  }

  length(): number {
    return this.#stack.length;
  }

  add(action: ActionInput): ActionResult {
    this.#stack.push(action);
    return { success: true };
  }

  peek(): ActionInput | undefined {
    return this.#stack.at(-1);
  }

  /** Read-only snapshot of the stack, bottom to top. */
  toArray(): ActionInput[] {
    return [...this.#stack];
  }

  flush(): ActionInput[] {
    const result = [...this.#stack];
    this.#stack = [];
    return result;
  }

  consume(): ActionInput | undefined {
    return this.#stack.pop();
  }
}
