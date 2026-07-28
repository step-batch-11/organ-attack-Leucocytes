export class RealtimeHub {
  #clientsByRoom = new Map();

  registerClient(roomID, { playerID, socket }) {
    const roomClients = this.#clientsByRoom.get(roomID) ?? [];
    roomClients.push({ playerID, socket });
    this.#clientsByRoom.set(roomID, roomClients);
  }

  removeClient(roomID, socket) {
    const roomClients = this.#clientsByRoom.get(roomID) ?? [];
    const nextClients = roomClients.filter((client) => client.socket !== socket);
    if (nextClients.length === 0) {
      this.#clientsByRoom.delete(roomID);
      return;
    }
    this.#clientsByRoom.set(roomID, nextClients);
  }

  broadcast(roomID, payload) {
    const roomClients = this.#clientsByRoom.get(roomID) ?? [];
    const message = JSON.stringify(payload);
    roomClients.forEach(({ socket }) => socket.send(message));
  }

  getClientCount(roomID) {
    return (this.#clientsByRoom.get(roomID) ?? []).length;
  }
}
