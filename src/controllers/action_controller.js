export default class ActionController {
  #stack;
  constructor(stack) {
    this.#stack = stack;
  }

  add(action) {
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
      this.#stack.peek().name !== "AFFLICTION" &&
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

  resolve() {
    if (this.#stack.length() === 0) {
      return { success: false, message: "Nothing to resolve in stack" };
    }

    if (this.#stack.length() === 1) {
      return { success: true, data: this.#stack.flush() };
    }

    while (this.#stack.length() > 0) {
      const topMostElement = this.#stack.peek();
      if (
        topMostElement === undefined ||
        topMostElement.name !== "IMMUNITY_BOOST"
      ) {
        return { success: true, data: this.#stack.flush() };
      }

      this.#stack.consume();
      this.#stack.consume();
    }
  }
}
