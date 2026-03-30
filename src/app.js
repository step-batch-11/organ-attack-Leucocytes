import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { logger } from "hono/logger";
import {
  allowLoggenInUsers,
  loginHandler,
  restrictLoginHtml,
} from "./handlers.js";

export const createApp = ({ session, idGenerator }, testFlag = false) => {
  const app = new Hono();
  testFlag && app.use(logger());

  app.use(async (c, next) => {
    c.set("session", session);
    c.set("idGenerator", idGenerator);
    await next();
  });

  app.post("/login", loginHandler);
  app.get("/", allowLoggenInUsers);
  app.get("/pages/login.html", restrictLoginHtml);
  app.get("*", serveStatic({ root: "public" }));

  return app;
};
