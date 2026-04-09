import { getCookie, setCookie } from "hono/cookie";

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
  rooms[roomID] = [player];

  return c.redirect("/pages/lobby.html");
};

export const joinRoom = async (c) => {
  const request = await c.req.formData();
  const { "room-id": roomID } = Object.fromEntries(request.entries());
  const rooms = c.get("rooms");
  if (!(roomID in rooms)) return c.text("Room Not Found");

  setCookie(c, "roomID", roomID);

  const players = rooms[roomID];
  console.log({ rooms, roomID });
  const player = createPlayer(c, "non-host");
  players.push(player);

  return c.redirect("/pages/lobby.html");
};
