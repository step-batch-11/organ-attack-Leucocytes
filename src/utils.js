import { getCookie } from "hono/cookie";

export const counter = () => {
  let i = 0;
  return () => ++i;
};

export const getPlayerID = (c) => {
  const sessionID = getCookie(c, "sessionID");
  if (sessionID === undefined) return -1;
  const session = c.get("session");
  const playerName = session[sessionID];
  const roomID = getCookie(c, "roomID");
  const rooms = c.get("rooms");
  return rooms[roomID].find(({ name }) => name === playerName).id;
};
