import { io } from "socket.io-client";

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? "http://localhost:5000" : "");

const createNoopSocket = () => ({
  connected: false,
  connect() {},
  emit() {},
  on() {},
  off() {}
});

export const socket = SOCKET_URL
  ? io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"]
    })
  : createNoopSocket();
