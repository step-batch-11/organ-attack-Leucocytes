import { getCookie } from "hono/cookie";
import { updateGameState } from "../app.js";
import { createEvent } from "../utils.js";

const constructAction = (game, body) => {
  const { attackerID, attackCardID } = body;
  console.log("body", body);

  const card = game.getAttackCardData(attackerID, attackCardID);
  console.log("here is the card details", card);

  const { action } = card;

  return {
    name: action.toUpperCase().split("-").join("_"),
    card,
    ...body,
  };
};

const playCard = (roomID, gameController, game, action) => {
  const done = gameController.playCard(action, game);

  done.then(() => {
    gameController.resolveAction(game);

    console.log("action after resolve", action.name);

    // should go inside game controller
    gameController.updateEventStatus(game);
    const gameState = game.getGameState();
    updateGameState(roomID, gameState);
  }).catch((reject) => console.error({ reject }));
};

export const resolveAction = async (ctx, gameController) => {
  const body = await ctx.req.json();

  const roomID = getCookie(ctx, "roomID");
  const game = ctx.get("games")[roomID];

  const action = constructAction(game, body);

  try {
    playCard(roomID, gameController, game, action);

    const { attackerID, attackCardID, isInstant } = body;

    game.discardAttackCard(attackerID, attackCardID, isInstant);
  } catch (error) {
    console.error(error.message);
    return ctx.json({ message: error.message }, 400);
  }

  const event = createEvent(action, game);
  game.registerEvent(event);

  gameController.updateEventStatus(game);

  // should go inside controller
  const gameState = game.getGameState();

  updateGameState(roomID, gameState);
  return ctx.json({ success: true });
};
