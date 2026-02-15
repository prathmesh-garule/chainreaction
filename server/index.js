const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { GameManager } = require('./gameManager');

const app = express();
app.use(cors());

// --- Health / Keep-alive endpoint ---
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        rooms: gameManager ? gameManager.rooms.size : 0,
        connections: io ? io.engine.clientsCount : 0,
        memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        timestamp: new Date().toISOString()
    });
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST"]
    },
    // --- Socket.IO tuning for Render ---
    pingTimeout: 30000,        // 30s before considering client dead
    pingInterval: 10000,       // ping every 10s to keep connection alive
    maxHttpBufferSize: 1e5,    // 100KB max message size (prevent abuse)
    transports: ['polling', 'websocket'],  // start polling, upgrade to ws
    allowUpgrades: true,
    upgradeTimeout: 15000
});

const gameManager = new GameManager(io);

// --- Connection rate limiting ---
const connectionTracker = new Map(); // ip -> { count, resetTime }
const MAX_CONNECTIONS_PER_IP = 5;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

io.use((socket, next) => {
    const ip = socket.handshake.address;

    const now = Date.now();
    let record = connectionTracker.get(ip);

    if (!record || now > record.resetTime) {
        record = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
        connectionTracker.set(ip, record);
    }

    record.count++;

    if (record.count > MAX_CONNECTIONS_PER_IP) {
        console.warn(`Rate limited IP: ${ip}`);
        return next(new Error('Too many connections. Please wait and try again.'));
    }

    next();
});

// Clean up stale rate-limit entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of connectionTracker) {
        if (now > record.resetTime) {
            connectionTracker.delete(ip);
        }
    }
}, 5 * 60 * 1000);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    gameManager.handleConnection(socket);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        gameManager.handleDisconnect(socket);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
