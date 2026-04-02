import * as attacks from "../data/attack_cards.json" with { type: "json" };
import * as organs from "../data/organ_cards.json" with { type: "json" };
import { Player } from "./models/player.js";
import { Game } from "./models/game.js";
import { Organ } from "./models/organ.js";
import { Deck } from "./models/deck.js";
import { Dealer } from "./models/dealer.js";
import { AfflictionHandler } from "./models/affliction_handler.js";

export const gameSetup = async (ctx) => {
  const games = ctx.get("games");
  const shuffle = ctx.get("shuffle");
  const rooms = ctx.get("rooms");
  const { roomID } = await ctx.req.json();

  if (!(roomID in rooms)) return ctx.json({ message: "Invalid roomId" }, 400);

  const players = rooms[roomID].map(({ name, id }) => new Player(name, id));
  const attackCards = new Deck(attacks.default, shuffle);

  const organCards = [];
  organs.default.forEach(({ name, id, health, isWild }) => {
    organCards.push(new Organ(name, id, health, isWild));
  });
  const organDeck = new Deck(organCards, shuffle);

  const dealer = new Dealer(attackCards, organDeck, players);
  const afflictionHandler = new AfflictionHandler(attackCards, organDeck);

  const game = new Game(
    players,
    attackCards,
    organDeck,
    dealer,
    afflictionHandler,
  );
  game.dealCards();
  game.setFirstPlayer();
  games[roomID] = game;

  return ctx.json(game.getAllPlayersDetails(), 201);
};
