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

const renderTableFooter = (initLobbyIntervalID, roomID) => {
  const tableFooter = document.querySelector("#table-footer");
  const button = document.createElement("button");

  tableFooter.innerHTML = "";
  button.textContent = "Start";
  button.classList.add("start-button");
  tableFooter.append(button);

  button.addEventListener("click", () => {
    clearInterval(initLobbyIntervalID);
    triggerGameSetup(roomID);
    window.location.href = "/game-page";
  });
};

(() => {
  let initLobbyIntervalID;

  const initiateLobby = async () => {
    const response = await fetch("/get-players").catch(() => {});
    const { players, myID, roomID, redirectPath } = await response.json();
    console.log({ redirectPath });

    renderPlayers(players, myID, roomID);
    if (amIHost(players, myID)) renderTableFooter(initLobbyIntervalID, roomID);
  };

  window.onload = () => {
    startGame();
    initLobbyIntervalID = setInterval(initiateLobby, 1000);
  };
})();
