import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { getPlayerID } from "../utils.ts";
import type { Context } from "hono";
import type { AppBindings } from "../types/context.ts";
import type { Room, RoomPlayer } from "../types/entities.ts";

type AppContext = Context<AppBindings>;

const broadcastLobbyState = (c: AppContext, roomID: string) => {
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

const createPlayer = (c: AppContext, type: string): RoomPlayer => {
  const sessionID = getCookie(c, "sessionID") as string;
  const session = c.get("session");
  const players = c.get("players");
  const id = session[sessionID];
  return { id, name: players[id], type };
};

export const createRoom = (c: AppContext) => {
  const roomID = String(Math.floor(Math.random() * 9000) + 1000);
  setCookie(c, "roomID", roomID);

  const rooms = c.get("rooms");
  const player = createPlayer(c, "host");
  rooms[roomID] = { players: [player], started: false };

  return c.redirect("/pages/lobby.html");
};

export const joinRoom = async (c: AppContext) => {
  const request = await c.req.formData();
  const { "room-id": roomID } = Object.fromEntries(
    request.entries(),
  ) as { "room-id": string };
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

const removePlayer = (
  c: AppContext,
  rooms: Record<string, Room>,
  roomID: string,
) => {
  const id = getPlayerID(c);
  const players = rooms[roomID].players;
  const playerIndex = players.findIndex((player) => player.id === id);
  players.splice(playerIndex, 1);
};

export const leaveLobby = async (c: AppContext) => {
  const { isHost } = await c.req.json();
  const rooms = c.get("rooms");
  const roomID = getCookie(c, "roomID") as string;

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
