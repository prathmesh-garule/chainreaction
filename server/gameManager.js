const { createGrid, processMove, checkWinCondition } = require('./utils');

class GameManager {
    constructor(io) {
        this.io = io;
        this.rooms = new Map(); // roomId -> roomState
    }

    handleConnection(socket) {
        socket.on('createRoom', ({ playerName, gridSize = { rows: 9, cols: 6 } }) => {
            const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
            const player = { id: socket.id, name: playerName, color: this.getRandomColor() };

            this.rooms.set(roomId, {
                id: roomId,
                players: [player],
                grid: createGrid(gridSize.rows, gridSize.cols),
                turnIndex: 0,
                status: 'waiting', // waiting, playing, finished
                gridSize,
                winner: null
            });

            socket.join(roomId);
            socket.emit('roomCreated', { roomId, player });
            console.log(`Room ${roomId} created by ${playerName}`);
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
