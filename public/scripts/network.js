let realtimeSocket = null;
let reconnectAttempts = 0;

const pendingRequests = new Map();
const messageListenersByType = new Map();

const generateRequestId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Registers a listener for one server→client message `type` (e.g. "game-state"). */
export const onMessage = (type, listener) => {
  const listeners = messageListenersByType.get(type) ?? [];
  listeners.push(listener);
  messageListenersByType.set(type, listeners);
};

const dispatchMessage = (message) => {
  if (message.type === "request-ack" || message.type === "request-error") {
    const pending = pendingRequests.get(message.requestId);
    if (!pending) return;

    pendingRequests.delete(message.requestId);
    if (message.type === "request-ack") pending.resolve(message.data);
    else pending.reject(new Error(message.message));
    return;
  }

  const listeners = messageListenersByType.get(message.type) ?? [];
  listeners.forEach((listener) => listener(message.payload));
};

export const connectRealtime = () => {
  if (
    realtimeSocket &&
    [WebSocket.CONNECTING, WebSocket.OPEN].includes(realtimeSocket.readyState)
  ) {
    return;
  }

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  realtimeSocket = new WebSocket(`${protocol}://${window.location.host}/ws`);

  realtimeSocket.onopen = () => {
    reconnectAttempts = 0;
  };

  realtimeSocket.onmessage = (event) => {
    try {
      dispatchMessage(JSON.parse(event.data));
    } catch (error) {
      console.error(error);
    }
  };

  realtimeSocket.onclose = (event) => {
    if (event.code === 4001) {
      window.location.href = "/";
      return;
    }
    if (reconnectAttempts < 5) {
      reconnectAttempts += 1;
      setTimeout(connectRealtime, 1000 * reconnectAttempts);
    }
  };

  realtimeSocket.onerror = (error) => {
    console.error("Realtime connection error", error);
  };
};

/**
 * Sends one request over the already-open `/ws` connection and resolves
 * with `request-ack.data`, or rejects with the `request-error` message.
 */
export const sendRequest = (type, payload) =>
  new Promise((resolve, reject) => {
    const requestId = generateRequestId();
    pendingRequests.set(requestId, { resolve, reject });
    realtimeSocket.send(JSON.stringify({ requestId, type, payload }));
  });
