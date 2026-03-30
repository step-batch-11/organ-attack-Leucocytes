import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { logger } from "hono/logger";
import { loginHandler, redirectIfAlreadyLoggedIn } from "./handlers.js";

export const createApp = ({ session, idGenerator }) => {
  const app = new Hono();
  app.use(logger());

  app.use(async (c, next) => {
    c.set("session", session);
    c.set("idGenerator", idGenerator);
    await next();
  });

  app.post("/login", loginHandler);
  app.get("/", redirectIfAlreadyLoggedIn);
  app.get("*", serveStatic({ root: "public" }));

  return app;
};
