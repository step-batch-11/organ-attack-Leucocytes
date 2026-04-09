import { renderPlayers } from "./renderer/render_players.js";
import { renderTimeOut } from "./renderer/render_timeout.js";

const amIHost = (players, myID) => {
  const me = players.find((player) => player.id === myID);
  return me && me.type === "host";
};

const triggerGameSetup = async (roomID) =>
  await fetch("/setup-game", {
    method: "POST",
    body: JSON.stringify({ roomID }),
  });

const startGame = async () => {
  await fetch("/start-game");
  window.location.href = "/game-page";
};

const renderTableFooter = (
  initLobbyIntervalID,
  roomID,
  currentPlayersCount,
) => {
  const tableFooter = document.querySelector("#table-footer");
  const button = document.createElement("button");

  if (currentPlayersCount > 1) {
    tableFooter.innerHTML = "";
    button.textContent = "Start";
    button.classList.add("start-button");
    tableFooter.append(button);

    button.addEventListener("click", () => {
      clearInterval(initLobbyIntervalID);
      triggerGameSetup(roomID);
      window.location.href = "/game-page";
    });
    return;
  }

  const waitingMsg = document.querySelector("#waiting-msg");
  waitingMsg.textContent = "waiting for players to join";
};

const leaveLobby = (isHost) => {
  const button = document.querySelector(".exit-button");

  button.onclick = async () => {
    const { success } = await fetch("/leave-lobby", {
      method: "post",
      body: JSON.stringify({ isHost }),
    }).then((res) => res.json())
      .catch((err) => console.error(err.message));

    if (success) window.location.href = "/";
  };
};

(() => {
  let initLobbyIntervalID;

  const initiateLobby = async () => {
    const response = await fetch("/get-players").catch(() => {});
    const { players, myID, roomID, redirectPath, roomAvailable } =
      await response.json();
    if (!roomAvailable) window.location.href = "/";

    renderPlayers(players, myID, roomID);
    const isHost = amIHost(players, myID);
    leaveLobby(isHost);
    if (isHost) renderTableFooter(initLobbyIntervalID, roomID, players.length);
  };

  window.onload = () => {
    startGame();
    initLobbyIntervalID = setInterval(initiateLobby, 1000);
  };
})();
