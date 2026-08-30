/**
 * Pure decision for whether the currently-rendered flash-screen/response-timer
 * should be replaced, cleared, or left untouched for an incoming game-state
 * event.
 *
 * `event`s are re-broadcast on every `game-state` message for the room, not
 * just when a new card is played — e.g. an unrelated player's discard also
 * triggers one. Without tracking identity, re-rendering on every broadcast
 * restarts the visual countdown from full duration even though real time has
 * already elapsed. `event.id` (assigned once by `Game#registerEvent` and left
 * untouched by `updateEventStatus`) stays stable across every broadcast for
 * the same still-open event, so it's the signal used here instead of
 * `resolved`/`timeRemaining`, which mutate mid-window without a new play.
 */
export const decideFlashScreenAction = (
  event,
  activeEventID,
  knownEventNames,
) => {
  const { name, id } = event ?? {};

  if (!knownEventNames.includes(name)) {
    return activeEventID === null ? "skip" : "clear";
  }

  if (id === activeEventID) return "skip";

  return "replace";
};
