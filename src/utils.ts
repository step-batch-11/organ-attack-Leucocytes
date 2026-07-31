import { getCookie } from "hono/cookie";
import type { Context } from "hono";
import type { AppBindings } from "./types/context.ts";
import type {
  ActionInput,
  GameEvent,
  PlayerDetails,
} from "./types/entities.ts";
import type { Game } from "./models/game.ts";

export const counter = () => {
  let i = 0;
  return () => ++i;
};

export const getPlayerID = (c: Context<AppBindings>): number => {
  const sessionID = getCookie(c, "sessionID");

  if (sessionID === undefined) return -1;

  const session = c.get("session");
  return session[sessionID];
};

const getOrganDetails = (
  organCards: Array<{ id: number; name: string }>,
  organCardID: number | undefined,
): { name: string; id: number } | undefined => {
  if (organCardID === undefined) return;

  const organCard = organCards.find(({ id }) => id === organCardID);

  if (typeof organCard === "object") {
    return { name: organCard.name, id: organCardID };
  }
};

const extractTargetData = (
  { player, game, opponentID, organCardID }: {
    player: PlayerDetails;
    game: Game;
    opponentID?: number;
    organCardID?: number;
  },
): NonNullable<GameEvent["target"]> => {
  const target: NonNullable<GameEvent["target"]> = {};

  if (opponentID) {
    const opponent = game.getPlayer(opponentID);
    target.player = {
      name: opponent.name,
      id: opponentID,
    };
    target.organ = getOrganDetails(opponent.organCards, organCardID);
  }

  if (organCardID && !target.organ) {
    const playerOrgan = player.organCards;
    const discardedOrgan = game.getOrganDiscardPile()
      .map((organ) => organ.getDetails());
    target.organ = getOrganDetails(
      [...playerOrgan, ...discardedOrgan],
      organCardID,
    );
  }

  return target;
};

export const createEvent = (eventData: ActionInput, game: Game): GameEvent => {
  const { card, attackerID } = eventData;
  const player = game.getPlayer(attackerID as number);
  const target = extractTargetData({ player, game, ...eventData });

  return {
    name: card.action,
    actor: { name: player.name, id: attackerID as number },
    target,
    card,
  };
};
