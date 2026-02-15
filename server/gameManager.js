const { createGrid, processMove, checkWinCondition } = require('./utils');

const MAX_ROOMS = 50;
const ROOM_MAX_AGE_MS = 30 * 60 * 1000;        // 30 minutes
const WAITING_ROOM_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;      // every 5 minutes

class GameManager {
    constructor(io) {
        this.io = io;
        this.rooms = new Map(); // roomId -> roomState

        // --- Auto-cleanup stale rooms ---
        this.cleanupInterval = setInterval(() => {
            this.cleanupStaleRooms();
        }, CLEANUP_INTERVAL_MS);
    }

    cleanupStaleRooms() {
        const now = Date.now();
        let cleaned = 0;

        for (const [roomId, room] of this.rooms) {
            const age = now - room.createdAt;

            // Delete rooms older than 30 min
            if (age > ROOM_MAX_AGE_MS) {
                this.io.to(roomId).emit('error', 'Room expired due to inactivity');
                this.rooms.delete(roomId);
                cleaned++;
                continue;
            }

            // Delete waiting rooms older than 15 min (never started)
            if (room.status === 'waiting' && age > WAITING_ROOM_MAX_AGE_MS) {
                this.io.to(roomId).emit('error', 'Room expired — game was never started');
                this.rooms.delete(roomId);
                cleaned++;
                continue;
            }

            // Delete finished rooms older than 5 min
            if (room.status === 'finished' && age > 5 * 60 * 1000) {
                this.rooms.delete(roomId);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`Cleaned up ${cleaned} stale room(s). Active rooms: ${this.rooms.size}`);
        }
    }

    handleConnection(socket) {
        socket.on('createRoom', ({ playerName, gridSize = { rows: 9, cols: 6 } }) => {
            // --- Room cap ---
            if (this.rooms.size >= MAX_ROOMS) {
                socket.emit('error', 'Server is at capacity. Please try again later.');
                return;
            }

            // --- Sanitize grid size ---
            const rows = Math.min(Math.max(Math.floor(gridSize.rows) || 9, 3), 15);
            const cols = Math.min(Math.max(Math.floor(gridSize.cols) || 6, 3), 10);

            const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
            const player = { id: socket.id, name: playerName, color: this.getRandomColor() };

            this.rooms.set(roomId, {
                id: roomId,
                players: [player],
                grid: createGrid(rows, cols),
                turnIndex: 0,
                status: 'waiting', // waiting, playing, finished
                gridSize: { rows, cols },
                winner: null,
                createdAt: Date.now()  // timestamp for cleanup
            });

            socket.join(roomId);
            socket.emit('roomCreated', { roomId, player });
            console.log(`Room ${roomId} created by ${playerName} (${this.rooms.size} active rooms)`);
        });

        socket.on('joinRoom', ({ roomId, playerName }) => {
            const room = this.rooms.get(roomId);
            if (!room) {
                socket.emit('error', 'Room not found');
                return;
            }
            if (room.status !== 'waiting') {
                socket.emit('error', 'Game already in progress');
                return;
            }
            if (room.players.length >= 8) { // Max 8 players
                socket.emit('error', 'Room is full');
                return;
            }

            const player = { id: socket.id, name: playerName, color: this.getRandomColor(room.players.map(p => p.color)) };
            room.players.push(player);
            socket.join(roomId);
            socket.emit('roomJoined', { roomId });

            this.io.to(roomId).emit('playerJoined', { players: room.players });
            console.log(`${playerName} joined room ${roomId}`);
        });

        socket.on('startGame', ({ roomId }) => {
            const room = this.rooms.get(roomId);
            if (room && room.players[0].id === socket.id && room.players.length >= 2) {
                room.status = 'playing';
                this.io.to(roomId).emit('gameStarted', {
                    grid: room.grid,
                    currentPlayer: room.players[room.turnIndex].id
                });
            }
        });

        socket.on('makeMove', ({ roomId, row, col }) => {
            const room = this.rooms.get(roomId);
            if (!room || room.status !== 'playing') return;

            const currentPlayer = room.players[room.turnIndex];
            if (currentPlayer.id !== socket.id) return;

            // --- Validate row/col are numbers within bounds ---
            if (typeof row !== 'number' || typeof col !== 'number') return;
            if (row < 0 || row >= room.gridSize.rows || col < 0 || col >= room.gridSize.cols) return;

            // Logic to process move
            const { valid, newGrid, nextTurnIndex, winner, eliminatedPlayers } = processMove(room, row, col);

            if (valid) {
                room.grid = newGrid;

                if (winner) {
                    room.status = 'finished';
                    room.winner = winner;
                    this.io.to(roomId).emit('gameOver', { winner });
                } else {
                    room.turnIndex = nextTurnIndex;
                    this.io.to(roomId).emit('updateGame', {
                        grid: room.grid,
                        currentPlayer: room.players[room.turnIndex].id,
                        eliminatedPlayers
                    });
                }
            } else {
                socket.emit('invalidMove');
            }
        });
    }

    handleDisconnect(socket) {
        // Handle player leaving... simplistic approach for now
        for (const [roomId, room] of this.rooms) {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                this.io.to(roomId).emit('playerLeft', { playerId: socket.id });
                if (room.players.length === 0) {
                    this.rooms.delete(roomId);
                }
                break;
            }
        }
    }

    getRandomColor(usedColors = []) {
        const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF5', '#FFFF33', '#FF3385', '#8533FF'];
        const available = colors.filter(c => !usedColors.includes(c));
        return available.length > 0 ? available[0] : colors[Math.floor(Math.random() * colors.length)];
    }
}

module.exports = { GameManager };
