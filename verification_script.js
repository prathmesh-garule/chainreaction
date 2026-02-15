const io = require('./client-app/node_modules/socket.io-client');

const URL = 'http://localhost:3000';

function runTest() {
    console.log('Starting verification test...');

    // Client 1
    const socket1 = io(URL);
    let socket2;
    let roomId;

    socket1.on('connect', () => {
        console.log('Client 1 connected:', socket1.id);
        socket1.emit('createRoom', { playerName: 'Alice' });
    });

    socket1.on('roomCreated', (data) => {
        console.log('Room created:', data);
        roomId = data.roomId;

        // Connect Client 2
        socket2 = io(URL);
        setupSocket2(socket2, roomId);
    });

    socket1.on('playerJoined', (data) => {
        console.log('Client 1 sees players:', data.players.length);
        if (data.players.length === 2) {
            console.log('Client 1 starting game...');
            socket1.emit('startGame', { roomId });
        }
    });

    socket1.on('gameStarted', (data) => {
        console.log('Game started for Client 1');
    });

    socket1.on('updateGame', (data) => {
        console.log('Game update received by Client 1');
        // If it's my turn, make a move?
        if (data.currentPlayer === socket1.id) {
            console.log('Client 1 turn, making move at 0,0');
            socket1.emit('makeMove', { roomId, row: 0, col: 0 });
        }
    });
}

function setupSocket2(socket, roomId) {
    socket.on('connect', () => {
        console.log('Client 2 connected:', socket.id);
        socket.emit('joinRoom', { roomId, playerName: 'Bob' });
    });

    socket.on('playerJoined', (data) => {
        console.log('Client 2 joined, players:', data.players.length);
        if (data.players.length === 2) {
            // Start game (owner is Client 1)
            // But we need Client 1 to start it.
            // Client 1 needs to know when players joined.
            // Let's rely on Client 1 listening to playerJoined?
            // Or just emit 'startGame' from Client 1 after a short delay?
        }
    });

    socket.on('gameStarted', (data) => {
        console.log('Game started for Client 2');
        // Initial move by player 1 (index 0)
    });

    socket.on('updateGame', (data) => {
        console.log('Game update received by Client 2');
        if (data.currentPlayer === socket.id) {
            console.log('Client 2 turn, making move at 0,1');
            socket.emit('makeMove', { roomId, row: 0, col: 1 });

            // End test after successful exchange
            console.log('Test PASSED: Game flow verified.');
            process.exit(0);
        }
    });
}

// Add logic for Client 1 to start game
// Since we don't have global state easily here without nesting callbacks deeply...
// I'll add a listener to socket1 for playerJoined
setTimeout(() => {
    // Failsafe
    console.log('Test timed out');
    process.exit(1);
}, 10000);

runTest();

// We need to handle the start game trigger.
// Modified runTest to include playerJoined listener on socket1
