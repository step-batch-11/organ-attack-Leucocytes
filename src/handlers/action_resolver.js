import { getCookie } from "hono/cookie";
import { updateGameState } from "../app.js";

const createEvent = ({ actor, target, card }, resolved = true) => {
  const { player, organID } = target;

  const eventTarget = {};
  if (card.action === "affliction") {
    eventTarget.playerName = player.name;
    eventTarget.organName = player
      .organCards.find(({ id }) => id === organID).name;
  }

  return {
    resolved,
    name: card.action,
    actor: actor.name,
    target: eventTarget,
    card,
  };
};

const playCard = (gameController, action, game) => {
  const done = gameController.playCard(action, game);
  done.then(() => {
    gameController.resolveAction(game);
    // should go inside game controller
    game.markEventDone();
    const gameState = game.getGameState();
    updateGameState(gameState);
  }).catch((reject) => console.error({ reject }));
};

export const resolveAction = async (ctx, gameController) => {
  const body = await ctx.req.json();

  const roomID = getCookie(ctx, "roomID");
  const game = ctx.get("games")[roomID];

  const action = gameController.constructAction(body, game);
  try {
    playCard(gameController, action, game);
  } catch (error) {
    console.error(error.message);
    return ctx.json({ message: error.message }, 400);
  }
  const event = createEvent(action, false);
  // should go inside controller
  game.registerEvent(event);
  const gameState = game.getGameState();

  updateGameState(gameState);
  return ctx.json({ success: true });
};
