import type { RealtimeClient, RealtimeMessage, RealtimeSocket } from "./types/realtime.ts";

// WebSocket readyState: OPEN. A socket may still be CONNECTING right after
// registration (before its "open" event fires) — sending to it would throw.
const OPEN = 1;

/**
 * Tracks WebSocket clients per room and fans out messages to them. Pure
 * transport primitive — no knowledge of `Game`/`Player`/game rules.
 */
export class RealtimeHub {
  #clientsByRoom = new Map<string, RealtimeClient[]>();

  registerClient(roomID: string, client: RealtimeClient): void {
    const roomClients = this.#clientsByRoom.get(roomID) ?? [];
    roomClients.push(client);
    this.#clientsByRoom.set(roomID, roomClients);
  }

  removeClient(roomID: string, socket: RealtimeSocket): void {
    const roomClients = this.#clientsByRoom.get(roomID) ?? [];
    const nextClients = roomClients.filter((client) => client.socket !== socket);

    if (nextClients.length === 0) {
      this.#clientsByRoom.delete(roomID);
      return;
    }

    this.#clientsByRoom.set(roomID, nextClients);
  }

  broadcast(roomID: string, message: RealtimeMessage): void {
    const roomClients = this.#clientsByRoom.get(roomID) ?? [];
    const data = JSON.stringify(message);
    roomClients
      .filter(({ socket }) => socket.readyState === OPEN)
      .forEach(({ socket }) => socket.send(data));
  }

  sendToPlayer(roomID: string, playerID: number, message: RealtimeMessage): void {
    const roomClients = this.#clientsByRoom.get(roomID) ?? [];
    const data = JSON.stringify(message);
    roomClients
      .filter((client) => client.playerID === playerID && client.socket.readyState === OPEN)
      .forEach(({ socket }) => socket.send(data));
  }

  getClients(roomID: string): readonly RealtimeClient[] {
    return this.#clientsByRoom.get(roomID) ?? [];
  }

  getClientCount(roomID: string): number {
    return (this.#clientsByRoom.get(roomID) ?? []).length;
  }
}
