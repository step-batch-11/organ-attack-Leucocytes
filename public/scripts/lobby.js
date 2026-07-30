import { renderPlayers } from "./renderer/render_players.js";

const triggerGameSetup = async (roomID) =>
  await fetch("/setup-game", {
    method: "POST",
    body: JSON.stringify({ roomID }),
  });

const renderTableFooter = (lobbySocket, roomID, currentPlayersCount) => {
  const tableFooter = document.querySelector("#table-footer");
  const button = document.createElement("button");

  if (currentPlayersCount > 1) {
    tableFooter.innerHTML = "";
    button.textContent = "Start";
    button.classList.add("start-button");
    tableFooter.append(button);

    button.addEventListener("click", () => {
      lobbySocket.close();
      triggerGameSetup(roomID);
      window.location.href = "/game-page";
    });
    return;
  }

  const waitingMsg = document.querySelector("#waiting-msg");
  waitingMsg.textContent = "waiting for players to join";
};

const leaveLobby = (lobbySocket, isHost) => {
  const button = document.querySelector(".exit-button");

  button.onclick = async () => {
    lobbySocket.close();
    const { success } = await fetch("/leave-lobby", {
      method: "post",
      body: JSON.stringify({ isHost }),
    }).then((res) => res.json())
      .catch((err) => console.error(err.message));

    if (success) window.location.href = "/";
  };
};

const copyRoomID = () => {
  const copyBtn = document.querySelector("#copy-btn");

  copyBtn.addEventListener("click", () => {
    const id = document.querySelector("#room-id").textContent;
    navigator.clipboard.writeText(id);
  });
};

(() => {
  let lobbySocket = null;
  let reconnectAttempts = 0;

  const handleLobbyState = ({ roomID, players, myID, started, isHost }) => {
    if (started) {
      lobbySocket.close();
      window.location.href = "/game-page";
      return;
    }

    renderPlayers(players, myID, roomID);
    leaveLobby(lobbySocket, isHost);
    if (isHost) renderTableFooter(lobbySocket, roomID, players.length);
  };

  const connectLobby = () => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    lobbySocket = new WebSocket(`${protocol}://${window.location.host}/ws`);

    lobbySocket.onopen = () => {
      reconnectAttempts = 0;
    };

    lobbySocket.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);

        if (type === "lobby-state") {
          handleLobbyState(payload);
        } else if (type === "game-started") {
          lobbySocket.close();
          window.location.href = payload.redirectPath;
        } else if (type === "room-closed") {
          lobbySocket.close();
          window.location.href = "/";
        }
      } catch (error) {
        console.error(error);
      }
    };

    lobbySocket.onclose = (event) => {
      if (event.code === 4001) {
        window.location.href = "/";
        return;
      }
      if (reconnectAttempts < 5) {
        reconnectAttempts += 1;
        setTimeout(connectLobby, 1000 * reconnectAttempts);
      }
    };

    lobbySocket.onerror = (error) => {
      console.error("Lobby connection error", error);
    };
  };

  window.onload = () => {
    copyRoomID();
    connectLobby();
  };
})();
