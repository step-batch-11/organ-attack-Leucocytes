const makeGETReq = (url) => {
  return fetch(url).then((r) => r.json());
};

const renderPlayers = (players, myId, roomId) => {
  const playersLength = document.querySelector("#players-count #number");
  const template = document.querySelector("#player-row");
  const list = document.querySelector("#waiting-members ul");
  playersLength.textContent = players.length;
  const roomIdElement = document.querySelector("#room-number");
  roomIdElement.textContent = roomId;

  const elements = players.map((player) => {
    const templateClone = document.importNode(template.content, true);
    const li = templateClone.querySelector("li");
    const nameElement = templateClone.querySelector(".player-name");
    const indication = templateClone.querySelector("#indication");

    if (player.id === myId) {
      indication.textContent = "(YOU)";
    }

    li.id = player.id;
    nameElement.textContent = player.name;

    return li;
  });
  list.replaceChildren(...elements);
};
const amIHost = (players, myId) => {
  return players.find((player) => player.id === myId).type === "host";
};
//--------------
const removeLoader = () => {
  const loader = document.querySelector(".loader");
  loader.remove();
};

const setupWaitingMessage = (waitingSpan) => {
  waitingSpan.classList.add("timer");
  waitingSpan.textContent = "5 seconds to begin the game";
};

const updateWaitingMessage = (waitingSpan, timeLeft) => {
  waitingSpan.textContent = `${timeLeft / 1000} seconds to begin the game`;
};

const redirectToGame = (body) => {
  const { redirectPath } = body;
  globalThis.location.href = redirectPath;
};

const startCountdown = (waitingSpan, body) => {
  let timeLeft = 5000;

  const intervalID = setInterval(() => {
    timeLeft = timeLeft - 1000;
    updateWaitingMessage(waitingSpan, timeLeft);

    if (timeLeft <= 0) {
      clearInterval(intervalID);
      redirectToGame(body);
    }
  }, 1000);
};

const renderTimeOutAndRedirectToGame = (body) => {
  const waitingSpan = document.querySelector("#waiting-msg");

  removeLoader();
  setupWaitingMessage(waitingSpan);
  startCountdown(waitingSpan, body);
};

//-------------

const main = async () => {
  const body = await makeGETReq("/get-players").catch((_) => {});
  const { players, myId, roomID } = body;
  if (body.status === 302) {
    if (amIHost(players, myId)) {
      await fetch("/setup-game", {
        method: "POST",
        body: JSON.stringify({ roomID }),
      });
    }
    renderTimeOutAndRedirectToGame(body);
  }

  renderPlayers(players, myId, roomID);
};

globalThis.onload = () => {
  setInterval(() => {
    main();
  }, 1000);
};
