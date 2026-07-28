/**
 * Card-related type definitions used strictly by the server.
 *
 * These mirror the shapes stored in `data/attack_cards.json` and
 * `data/organ_cards.json`. They describe the *current* data as-is; no
 * attempt is made here to correct the game's known logical issues.
 */

/**
 * A single attack card as loaded from `data/attack_cards.json` and passed
 * around the game engine.
 */
export interface AttackCard {
  /** Unique numeric identifier of the card. */
  id: number;
  /** Human-readable card name. */
  name: string;
  /** Whether the card resolves immediately without ending the turn. */
  isInstant: boolean;
  /** Organ ids this card can afflict. */
  afflictableOrgans: number[];
  /** Organ ids this card can outright remove. */
  removableOrgans: number[];
  /** Whether the card represents a wild card. */
  isWild: boolean;
  /** Amount of affliction the card applies when played. */
  afflictPoints: number;
  /** Free-text description (note: capitalised key comes from the JSON data). */
  Desc: string;
  /** Broad category of the card (e.g. "affliction", "necrosis", "wild"). */
  type: string;
  /** Dispatch key used to select the handler for this card. */
  action: string;
  /** Whether the card can be blocked (e.g. by an immunity boost). */
  isBlockable: boolean;
  /**
   * Runtime-only flag toggled by {@link Game} when computing which cards a
   * player may currently play. Not present in the source JSON.
   */
  isActive?: boolean;
}

/**
 * Public projection of an {@link Organ}, as returned by `Organ.getDetails()`.
 */
export interface OrganCardData {
  /** Organ name. */
  name: string;
  /** Unique organ id. */
  id: number;
  /** Current health of the organ. */
  health: number;
  /** Maximum health the organ can be healed back to. */
  maxHealth: number;
  /** Whether this organ is the wild organ. */
  isWild: boolean;
}
