import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
export const socket = io(URL, {
    autoConnect: true,
    transports: ['polling', 'websocket'],  // start with polling, upgrade to ws
    reconnection: true,
    reconnectionAttempts: 5,               // max 5 retries
    reconnectionDelay: 1000,               // start at 1s
    reconnectionDelayMax: 10000,           // max 10s between retries
    timeout: 20000,                        // 20s connection timeout
});
