export default class ActionStack {
  #stack;
  constructor() {
    this.#stack = [];
  }

  length() {
    return this.#stack.length;
  }

  add(action) {
    this.#stack.push(action);
    return { success: true };
  }
  peek() {
    return this.#stack.at(-1);
  }
  flush() {
    const result = this.#stack;
    this.#stack = [];
    return result;
  }
  consume() {
    return this.#stack.pop();
  }
}
