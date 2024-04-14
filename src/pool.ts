import WebSocket from "ws";
import { SimplePool, useWebSocketImplementation } from "nostr-tools";

// @ts-ignore
global.WebSocket = WebSocket;
useWebSocketImplementation(WebSocket);

export const pool = new SimplePool();
