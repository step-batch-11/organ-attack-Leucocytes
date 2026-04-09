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

(() => {
  let initLobbyIntervalID;

  const initiateLobby = async () => {
    const response = await fetch("/get-players").catch(() => {});
    const { players, myID, roomID, redirectPath } = await response.json();
    console.log({ redirectPath });

    renderPlayers(players, myID, roomID);
    if (amIHost(players, myID)) {
      renderTableFooter(initLobbyIntervalID, roomID, players.length);
    }
  };

  window.onload = () => {
    startGame();
    initLobbyIntervalID = setInterval(initiateLobby, 1000);
  };
})();
