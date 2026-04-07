import { getCookie } from "hono/cookie";
import { updateGameState } from "../app.js";

const createEvent = ({ name, actor, target, card }) => {
  const { player, organID } = target;
  const organName = player.organCards.find(({ id }) => id === organID).name;
  return {
    name,
    actor: actor.name,
    target: { playerName: player.name, organName },
    card,
  };
};

export const resolveAction = async (ctx, gameController) => {
  /**
   * create new handle attack: pass as variable not ctx
   * pull normal affliction into it
   * handle immunity boost using action controller
   *
   *
   * event = {
    name: action,
    actor: game.getPlayer(attackerID).name,
    target: {
      playerName: targetPlayer?.name,
      organName: targetOrgan?.name,
    },
    card: attackCard,
  };

   */
  const body = await ctx.req.json();
  // const { attackerID, attackCardID, isInstant, organCardID, opponentID } = body;

  const roomID = getCookie(ctx, "roomID");
  const game = ctx.get("games")[roomID];

  const action = gameController.constructAction(body, game);
  try {
    gameController.playCard(action, game);
  } catch (error) {
    console.error(error.message);
    return ctx.json({ message: error.message }, 400);
  }
  const event = createEvent(action);

  // should go inside controller
  game.registerEvent(event);
  const gameState = game.getGameState();

  updateGameState(gameState);
  return ctx.json({ success: true });
};

export const resolveActionsOnTurnEnd = (ctx, gameController) => {
  /**
   * immunity boost resolve the attack that is played before
   * first gameController.resolve actions  => ()
   * then gameController.apply actions that => (game, remaining actions)
   * get game from games using roomId
   * then it will resolve and send response back to the player who are in the waiting list
   */

  const roomID = getCookie(ctx, "roomID");
  const game = ctx.get("games")[roomID];
  gameController.resolveAction(game);

  //this should not be here
  const gameState = game.getGameState();

  updateGameState(gameState);
  return ctx.json({ success: true });
};
