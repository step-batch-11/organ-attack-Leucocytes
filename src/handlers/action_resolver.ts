import { createEvent } from "../utils.ts";

const constructAction = (game, body) => {
  const { attackerID, attackCardID } = body;
  const card = game.getAttackCardData(attackerID, attackCardID);
  const { action } = card;

  return {
    name: action.toUpperCase().split("-").join("_"),
    card,
    ...body,
  };
};

const playCard = (roomID, gameController, game, action, updateGameState) => {
  game.currentTurnPlayed(action);

  const done = gameController.playCard(action, game);

  done.then(() => {
    gameController.resolveAction(game);
    gameController.updateEventStatus(game);
    updateGameState(roomID);
  }).catch((reject) => console.error({ reject }));
};

/**
 * Plays a card submitted over the `/ws` "action" request. Mirrors the
 * former `/action` HTTP handler's synchronous contract: throws (→
 * `request-error`) if the action can't legally be added to the
 * `ActionStack`, otherwise returns `{ success: true }` immediately — actual
 * resolution (and the resulting `game-state` broadcast) happens later,
 * asynchronously, once the response window elapses or is skipped.
 */
export const handleAction = (roomID, gameController, game, updateGameState, body) => {
  const action = constructAction(game, body);

  playCard(roomID, gameController, game, action, updateGameState);

  const { attackerID, attackCardID, isInstant } = body;
  game.discardAttackCard(attackerID, attackCardID, isInstant);

  const event = createEvent(action, game);
  game.registerEvent(event);

  gameController.updateEventStatus(game);
  updateGameState(roomID);

  return { success: true };
};
