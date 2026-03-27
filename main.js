import { createApp } from "./src/app.js";

const main = () => {
  const app = createApp();
  const port = Deno.env.get("PORT") || 8000;

  Deno.serve({ port }, app.fetch);
};
main();
