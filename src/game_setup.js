import attacks from "../data/attack_cards.json" with { type: "json" };
import organs from "../data/organ_cards.json" with { type: "json" };
import { Player } from "./models/player.js";
import { Game } from "./models/game.js";
import { Organ } from "./models/organ.js";
import { Deck } from "./models/deck.js";
import { Dealer } from "./models/dealer.js";

import { AfflictionHandler } from "./models/affliction_handler.js";
import { TurnManager } from "./models/turn_manager.js";

export const gameSetup = async (ctx) => {
  const games = ctx.get("games");
  const shuffle = ctx.get("shuffle");
  const rooms = ctx.get("rooms");

  const { roomID } = await ctx.req.json();

  if (!(roomID in rooms)) return ctx.json({ message: "Invalid roomID" }, 400);

  console.log(rooms[roomID]);
  const players = rooms[roomID].players.map(({ name, id }) =>
    new Player(name, id)
  );
  const attackCards = new Deck(attacks, shuffle);

  const organCards = [];

  organs.forEach(({ name, id, health }) => {
    organCards.push(new Organ(name, id, health));
  });

  const organDeck = new Deck(organCards, shuffle);

  const dealer = new Dealer(attackCards, organDeck, players);
  const afflictionHandler = new AfflictionHandler(attackCards, organDeck);
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

  games[roomID] = game;

  return ctx.json(game.getAllPlayersDetails(), 201);
};
