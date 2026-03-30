import { getCookie, setCookie } from "hono/cookie";

export const loginHandler = async (c) => {
  const maxAge = 60 * 60 * 2;
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
    maxAge,
  });

  return c.redirect("/");
};

export const restrictLoginHtml = async (c, next) => {
  const session = c.get("session");

  const sessionId = getCookie(c, "sessionId");
  if (sessionId in session) {
    return c.redirect("/");
  }
  await next();
};

export const allowLoggenInUsers = async (c, next) => {
  const session = c.get("session");

  const sessionId = getCookie(c, "sessionId");

  if (!(sessionId in session)) {
    return c.redirect("/pages/login.html");
  }

  await next();
};
