import attacks from "../data/attack_cards.json" with { type: "json" };
import organs from "../data/organ_cards.json" with { type: "json" };
import { Player } from "./models/player.ts";
import { Game } from "./models/game.ts";
import { Organ } from "./models/organ.ts";
import { Deck } from "./models/deck.ts";
import { Dealer } from "./models/dealer.ts";

import { AfflictionHandler } from "./models/affliction_handler.ts";
import { TurnManager } from "./models/turn_manager.ts";
import ActionStack from "./models/action_stack.ts";
import ActionController from "./controllers/action_controller.ts";
import Timer from "./models/timer.ts";
import GameController from "./controllers/game_controller.ts";
import type { Context } from "hono";
import type { AppBindings } from "./types/context.ts";
import type { AttackCard } from "./types/cards.ts";

/** Duration (ms) of the response window for blockable cards, per room. */
export const RESPONSE_WINDOW_MS = 5000;

export const gameSetup = async (ctx: Context<AppBindings>) => {
  const games = ctx.get("games");
  const shuffle = ctx.get("shuffle");
  const rooms = ctx.get("rooms");

  const { roomID } = await ctx.req.json();

  if (!(roomID in rooms)) return ctx.json({ message: "Invalid roomID" }, 400);

  const players = rooms[roomID].players.map(
    ({ name, id }) => new Player(name, id),
  );
  const attackCards = new Deck<AttackCard>(attacks as AttackCard[], shuffle);

  const organCards: Organ[] = [];

  organs.forEach(({ name, id, health }) => {
    organCards.push(new Organ(name, id, health));
  });

  const organDeck = new Deck(organCards, shuffle);

  const dealer = new Dealer(attackCards, organDeck, players);
  const afflictionHandler = new AfflictionHandler(
    attackCards,
    organDeck,
    players,
  );

  const turnManager = new TurnManager(players);

  const game = new Game(
    players,
    attackCards,
    organDeck,
    dealer,
    afflictionHandler,
    turnManager,
  );

  game.dealCards();
  game.setFirstPlayer();

  const actionStack = new ActionStack();
  const actionController = new ActionController(actionStack);
  const timer = new Timer(RESPONSE_WINDOW_MS);
  const gameController = new GameController(actionController, timer);

  games[roomID] = { game, gameController };

  return ctx.json(game.getAllPlayersDetails(), 201);
};
