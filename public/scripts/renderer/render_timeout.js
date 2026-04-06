const removeLoadIcon = () => {
  const loader = document.querySelector(".loader");
  if (loader !== null) loader.remove();
};

const setupWaitingMessage = (waitingSpan, seconds) => {
  waitingSpan.classList.add("timer");
  waitingSpan.textContent = `${seconds} seconds to begin the game`;
};

const MS_1000 = 1000;

const updateCountdown = (waitingSpan, time) => {
  waitingSpan.textContent = `${time / MS_1000} seconds to begin the game`;
};

const startCountdown = (waitingSpan, resolve, seconds) => {
  let timeLeft = seconds * MS_1000;

  const intervalID = setInterval(() => {
    timeLeft -= MS_1000;

    updateCountdown(waitingSpan, timeLeft);

    if (timeLeft <= 0) {
      clearInterval(intervalID);
      resolve();
    }
  }, 1000);
};

export const renderTimeOut = (seconds = 5) => {
  return new Promise((resolve) => {
    const waitingSpan = document.querySelector("#waiting-msg");

    removeLoadIcon();
    setupWaitingMessage(waitingSpan, seconds);
    startCountdown(waitingSpan, resolve, seconds);
  });
};
