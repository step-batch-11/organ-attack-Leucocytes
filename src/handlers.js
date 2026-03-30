import { getCookie, setCookie } from "hono/cookie";

export const loginHandler = async (c) => {
  const maxAge = 60 * 60 * 2;
  const session = c.get("session");
  const idGenerator = c.get("idGenerator");
  const payload = await c.req.formData();
  const username = payload.get("username");
  if (username === null || username.trim() === "") {
    return c.json({ message: "invalid username" }, 401);
  }

  const sessionID = idGenerator();
  session[sessionID] = username;

  setCookie(c, "sessionID", sessionID, {
    maxAge,
  });

  return c.redirect("/");
};

export const redirectLoggedInUser = (c, next) => {
  const session = c.get("session");

  const sessionID = getCookie(c, "sessionID");
  return (sessionID in session) ? c.redirect("/") : next();
};

export const allowLoggedInUser = (c, next) => {
  const session = c.get("session");

  const sessionID = getCookie(c, "sessionID");

  return !(sessionID in session) ? c.redirect("/pages/login.html") : next();
};
