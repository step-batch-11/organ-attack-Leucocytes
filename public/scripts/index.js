import { renderPlayers } from "./renderer/render_players.js";
import { renderTimeOut } from "./renderer/render_timeout.js";

const amIHost = (players, myID) => {
  const me = players.find((player) => player.id === myID);
  return me && me.type === "host";
};

const triggerGameSetup = async (amIHost, roomID) => {
  if (amIHost) {
    await fetch("/setup-game", {
      method: "POST",
      body: JSON.stringify({ roomID }),
    });
  }
};

(() => {
  let initLobbyIntervalID;
  let countdownStarted = false;

  const initiateLobby = async () => {
    const response = await fetch("/get-players").catch(() => {});
    const { players, myID, roomID, redirectPath } = await response.json();

    renderPlayers(players, myID, roomID);

    if (response.status === 302) {
      if (redirectPath === "/") {
        window.location.href = redirectPath;
        //if trying to access the game-page without valid credential
      }

      clearInterval(initLobbyIntervalID);
      if (!countdownStarted) {
        await triggerGameSetup(amIHost(players, myID), roomID);
        const lobbyCountdown = 3;
        await renderTimeOut(lobbyCountdown);
        window.location.href = redirectPath;
      }
    }
  };

  window.onload = () => initLobbyIntervalID = setInterval(initiateLobby, 1000);
})();
