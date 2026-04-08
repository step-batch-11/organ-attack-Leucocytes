export default class Timer {
  #duration;
  #reject;
  #timeoutID;
  constructor(duration) {
    this.#duration = duration;
    this.#reject = () => {};
  }

  start() {
    this.#reject("rejected");
    clearTimeout(this.#timeoutID);
    return new Promise((resolve, reject) => {
      this.#reject = reject;
      this.#timeoutID = setTimeout(
        () => resolve({ success: true }),
        this.#duration,
      );
    });
  }
}
