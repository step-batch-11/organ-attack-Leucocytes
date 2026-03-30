import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { logger } from "hono/logger";

export const createApp = () => {
  const app = new Hono();
  app.use(logger());
  app.use(serveStatic({ root: "public" }));

  return app;
};
