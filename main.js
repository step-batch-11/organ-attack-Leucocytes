import { createApp } from "./src/app.js";
import { counter } from "./src/utils.js";

const main = () => {
  const session = {};
  const idGenerator = counter();

  const app = createApp({ session, idGenerator }, false);
  const port = Deno.env.get("PORT") || 8000;

  Deno.serve({ port }, app.fetch);
};
main();
