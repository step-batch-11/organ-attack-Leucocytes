import { getCookie, setCookie } from "hono/cookie";

export const loginHandler = async (c) => {
  const session = c.get("session");
  const idGenerator = c.get("idGenerator");
  const payload = await c.req.formData();
  const username = payload.get("username");
  if (username === undefined || username.trim() === "") {
    return c.json({ message: "invalid username" }, 401);
  }

  const sessionId = idGenerator();
  session[sessionId] = username;

  setCookie(c, "sessionId", sessionId, {
    maxAge: 60 * 60 * 2,
  });

  return c.redirect("/");
};

export const redirectIfAlreadyLoggedIn = async (c, next) => {
  const session = c.get("session");

  const sessionId = getCookie(c, "sessionId");
  const username = session[sessionId];

  if (!username) {
    return c.redirect("pages/login.html");
  }

  await next();
};
