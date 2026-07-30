import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { getPlayerID } from "../utils.ts";

const broadcastLobbyState = (c, roomID) => {
  const realtimeHub = c.get("realtimeHub");
  const room = c.get("rooms")[roomID];

  for (const player of room.players) {
    realtimeHub.sendToPlayer(roomID, player.id, {
      type: "lobby-state",
      payload: {
        roomID,
        players: room.players,
        started: Boolean(room.started),
        myID: player.id,
        isHost: player.type === "host",
      },
    });
  }
};

const createPlayer = (c, type) => {
  const sessionID = getCookie(c, "sessionID");
  const session = c.get("session");
  const players = c.get("players");
  const id = session[sessionID];
  return { id, name: players[id], type };
};

export const createRoom = (c) => {
  const roomID = Math.floor(Math.random() * 9000) + 1000;
  setCookie(c, "roomID", roomID);

  const rooms = c.get("rooms");
  const player = createPlayer(c, "host");
  rooms[roomID] = { players: [player], started: false };

  return c.redirect("/pages/lobby.html");
};

export const joinRoom = async (c) => {
  const request = await c.req.formData();
  const { "room-id": roomID } = Object.fromEntries(request.entries());
  const rooms = c.get("rooms");
  if (!(roomID in rooms)) {
    deleteCookie(c, "roomID");
    return c.text("Room Not Found", 400);
  }

  setCookie(c, "roomID", roomID);

  const players = rooms[roomID].players;
  const player = createPlayer(c, "non-host");
  players.push(player);
  broadcastLobbyState(c, roomID);

  return c.redirect("/pages/lobby.html");
};

const removePlayer = (c, rooms, roomID) => {
  const id = getPlayerID(c);
  const players = rooms[roomID].players;
  const playerIndex = players.findIndex((player) => player.id === id);
  players.splice(playerIndex, 1);
};

export const leaveLobby = async (c) => {
  const { isHost } = await c.req.json();
  const rooms = c.get("rooms");
  const roomID = getCookie(c, "roomID");

  if (!isHost) {
    removePlayer(c, rooms, roomID);
    broadcastLobbyState(c, roomID);
  } else {
    c.get("realtimeHub").broadcast(roomID, { type: "room-closed" });
    delete rooms[roomID];
  }

  deleteCookie(c, "roomID");
  return c.json({ success: true });
};
